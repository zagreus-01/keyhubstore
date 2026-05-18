import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Button, Card, Col, Image, InputNumber, notification, Row, Select, Space, Tag, Typography } from "antd";
import { HeartOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import api, { getBackendUrl, getErrorMessage } from "../util/api";
import { useAuth } from "../components/context/AuthContext";

const { Title, Paragraph, Text } = Typography;

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/product/${id}`);
        const data = response.data.data;
        setProduct(data);
        setSelectedVariant(data.variants?.[0] || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const productImageUrls = useMemo(() => {
    if (!product) return [];
    const images = [
      ...(selectedVariant?.images || []),
      ...(product?.images || []),
      product?.thumbnail ? [product.thumbnail] : []
    ].flat();
    const uniqueImages = Array.from(new Set(images));
    return uniqueImages.map((image) => (image.startsWith("http") ? image : getBackendUrl(image)));
  }, [product, selectedVariant]);

  useEffect(() => {
    if (productImageUrls.length) {
      setSelectedImage(productImageUrls[0]);
    }
  }, [productImageUrls]);

  const variantOptions = useMemo(
    () => product?.variants?.map((variant) => ({
      label: variant.sku || variant.attributes?.map((attr) => attr.value).join(" / ") || "Variant",
      value: variant._id
    })) || [],
    [product]
  );

  const activeVariant = useMemo(
    () => product?.variants?.find((variant) => variant._id === selectedVariant?._id) || selectedVariant,
    [product, selectedVariant]
  );

  const handleAddToCart = async () => {
    if (!activeVariant) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.role !== "customer") {
      notification.error({ title: "Access denied", description: "Only customers can add items to cart." });
      return;
    }
    try {
      await api.post("/cart/add", { variantId: activeVariant._id, quantity });
      notification.success({ title: "Added to cart" });
      navigate("/cart");
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.role !== "customer") {
      notification.error({ title: "Access denied", description: "Only customers can use the wishlist." });
      return;
    }
    try {
      await api.post("/wishlist/add", { productId: product._id });
      notification.success({ title: "Added to wishlist" });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  if (loading) {
    return <div className="page-loading">Loading product...</div>;
  }

  if (!product) {
    return <div className="page-empty">Product not found.</div>;
  }

  const imageUrl = selectedImage || "https://via.placeholder.com/520x360?text=Product";

  return (
    <div className="page-product-detail">
      <Breadcrumb items={[{ title: "Home", onClick: () => navigate("/") }, { title: "Products", onClick: () => navigate("/products") }, { title: product.productName }]} />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card variant="borderless" className="product-detail-card">
            <Image src={imageUrl} alt={product.productName} preview={false} className="product-detail-image" />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card variant="borderless" className="product-detail-card">
            <Title>{product.productName}</Title>
            <Paragraph type="secondary">{product.brandId?.brandName || "Brand"} • {product.categoryId?.categoryName || "Category"}</Paragraph>
            <Title level={3}>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(activeVariant?.price || product.price || 0)}</Title>
            <Space wrap orientation="vertical" size="middle">
              <div>
                <Text strong>Variant</Text>
                <Select
                  style={{ width: "100%", marginTop: 8 }}
                  value={activeVariant?._id}
                  options={variantOptions}
                  onChange={(value) => setSelectedVariant(product.variants.find((item) => item._id === value))}
                />
              </div>
              <div>
                <Text strong>Quantity</Text>
                <InputNumber
                  min={1}
                  max={activeVariant?.stock || 99}
                  value={quantity}
                  onChange={(value) => setQuantity(value)}
                  style={{ width: 120, marginLeft: 12 }}
                />
                <Text type="secondary" style={{ marginLeft: 16 }}>
                  Stock: {activeVariant?.stock ?? "N/A"}
                </Text>
              </div>
              <Space orientation="horizontal" size="middle">
                <Button type="primary" icon={<ShoppingCartOutlined />} onClick={handleAddToCart}>Add to cart</Button>
                <Button type="default" icon={<HeartOutlined />} onClick={handleWishlist}>Wishlist</Button>
              </Space>
              <div className="product-specs">
                <Text strong>Description</Text>
                <Paragraph>{product.description || "No description available."}</Paragraph>
                <div className="product-tags">
                  {product.attributes?.map((attr) => (
                    <Tag key={`${attr.key}-${attr.value}`}>{`${attr.key}: ${attr.value}`}</Tag>
                  ))}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
