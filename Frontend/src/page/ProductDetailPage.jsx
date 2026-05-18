import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Button, Card, Col, Image, InputNumber, notification, Row, Select, Space, Tag, Typography } from "antd";
import { HeartOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import api, { getBackendUrl, getErrorMessage } from "../util/api";
import { useAuth } from "../components/context/AuthContext";

const { Title, Paragraph, Text } = Typography;

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [, setSelectedImage] = useState(null);
  const [mainSwiper, setMainSwiper] = useState(null);
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
    const productImages = (product.images || []).filter(Boolean);
    const allVariantImages = product.variants?.flatMap((variant) => (variant.images || []).filter(Boolean)) || [];
    const images = [...productImages, ...allVariantImages];
    if (!images.length && product.thumbnail) {
      images.push(product.thumbnail);
    }
    const uniqueImages = Array.from(new Set(images.filter(Boolean)));
    return uniqueImages.map((image) => (image.startsWith("http") ? image : getBackendUrl(image)));
  }, [product]);

  const selectedVariantImageUrls = useMemo(() => {
    if (!product || !selectedVariant) return [];
    const variantImages = (selectedVariant.images || []).filter(Boolean);
    if (!variantImages.length) {
      variantImages.push(...(product.images || []).filter(Boolean));
    }
    if (!variantImages.length && product.thumbnail) {
      variantImages.push(product.thumbnail);
    }
    const uniqueImages = Array.from(new Set(variantImages.filter(Boolean)));
    return uniqueImages.map((image) => (image.startsWith("http") ? image : getBackendUrl(image)));
  }, [product, selectedVariant]);

  useEffect(() => {
    if (productImageUrls.length) {
      setSelectedImage(productImageUrls[0]);
    }
  }, [productImageUrls]);

  useEffect(() => {
    if (!mainSwiper || !selectedVariant || !productImageUrls.length) return;
    const targetUrl = selectedVariantImageUrls[0] || productImageUrls[0];
    const targetIndex = productImageUrls.indexOf(targetUrl);
    if (targetIndex >= 0 && targetIndex !== mainSwiper.activeIndex) {
      mainSwiper.slideTo(targetIndex);
      setSelectedImage(productImageUrls[targetIndex]);
    }
  }, [selectedVariant, mainSwiper, productImageUrls, selectedVariantImageUrls]);

  const variantOptions = useMemo(
    () => product?.variants?.map((variant) => ({
      label: variant.sku || variant.attributes?.map((attr) => `${attr.key}:${attr.value}`).join(" / ") || "Attributes",
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

  return (
    <div className="page-product-detail">
      <Breadcrumb items={[{ title: "Home", onClick: () => navigate("/") }, { title: "Products", onClick: () => navigate("/products") }, { title: product.productName }]} />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card bordered={false} className="product-detail-card">
            <div className="product-detail-swiper-wrapper">
              {productImageUrls.length ? (
                <>
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    onSwiper={setMainSwiper}
                    onSlideChange={(swiper) => setSelectedImage(productImageUrls[swiper.activeIndex])}
                    className="product-detail-swiper"
                  >
                    {productImageUrls.map((url, index) => (
                      <SwiperSlide key={`${url}-${index}`}>
                        <div className="product-detail-image-wrapper">
                          <Image src={url} alt={`${product.productName} ${index + 1}`} preview={false} className="product-detail-image" />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </>
              ) : (
                <div className="product-detail-image-wrapper">
                  <Image src="https://via.placeholder.com/520x360?text=Product" alt="No product image" preview={false} className="product-detail-image" />
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card variant="borderless" className="product-detail-card">
            <Title>{product.productName}</Title>
            <Paragraph type="secondary">{product.brandId?.brandName || "Brand"} • {product.categoryId?.categoryName || "Category"}</Paragraph>
            <Title level={3}>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(activeVariant?.price || product.price || 0)}</Title>
            <Space wrap orientation="vertical" size="middle">
              <div>
                <Text strong>Attributes</Text>
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
                  {(activeVariant?.attributes || product.attributes || []).map((attr) => (
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
