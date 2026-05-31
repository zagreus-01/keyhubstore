import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Button, Card, Col, Divider, Image, InputNumber, Rate, Row, Select, Space, Tag, Typography } from "antd";
import { HeartFilled, HeartOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import api, { getBackendUrl, getErrorMessage } from "../util/api";
import { notification } from "../util/feedback";
import useAuth from "../components/context/useAuth";
import useCart from "../components/context/useCart";
import ProductCard from "../components/common/ProductCard";

const { Title, Paragraph, Text } = Typography;

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { openCartDrawer } = useCart();
  const normalizedRole = String(user?.role || "").toLowerCase();
  const isCustomer = normalizedRole === "customer";
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [, setSelectedImage] = useState(null);
  const [mainSwiper, setMainSwiper] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [viewedProducts, setViewedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [response, reviewRes, similarRes] = await Promise.all([
          api.get(`/product/${id}`),
          api.get(`/review/product/${id}`),
          api.get(`/product/${id}/similar`, { params: { limit: 4 } })
        ]);
        const data = response.data.data;
        setProduct(data);
        setSelectedVariant(data.variants?.[0] || null);
        setReviews(reviewRes.data.data || []);
        setSimilarProducts(similarRes.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const recordAndFetchViewed = async () => {
      if (!isAuthenticated || !isCustomer || !id) return;

      try {
        await api.post(`/product/${id}/view`);
        const response = await api.get("/product/viewed/me", { params: { limit: 6 } });
        setViewedProducts((response.data.data || []).filter((item) => String(item._id) !== String(id)));
      } catch {
        setViewedProducts([]);
      }
    };

    recordAndFetchViewed();
  }, [id, isAuthenticated, isCustomer]);

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

  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!isAuthenticated || !isCustomer || !activeVariant?._id) {
        setIsInWishlist(false);
        return;
      }

      try {
        const response = await api.get("/wishlist");
        const products = response.data.data?.products || [];
        setIsInWishlist(products.some((item) => String(item?.selectedVariant?._id) === String(activeVariant._id)));
      } catch {
        setIsInWishlist(false);
      }
    };

    fetchWishlistStatus();
  }, [activeVariant?._id, isAuthenticated, isCustomer]);

  const handleAddToCart = async () => {
    if (!activeVariant) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!isCustomer) {
      notification.error({ title: "Access denied", description: "Only customers can add items to cart." });
      return;
    }
    try {
      await api.post("/cart/add", { variantId: activeVariant._id, quantity });
      notification.success({ title: "Added to cart" });
      openCartDrawer({ refresh: true });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!isCustomer) {
      notification.error({ title: "Access denied", description: "Only customers can use the wishlist." });
      return;
    }
    if (!activeVariant) return;
    if (isInWishlist) {
      notification.info({ title: "Variant is already in wishlist" });
      return;
    }
    try {
      setWishlistLoading(true);
      await api.post("/wishlist/add", { variantId: activeVariant._id });
      setIsInWishlist(true);
      notification.success({ title: "Added to wishlist" });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    } finally {
      setWishlistLoading(false);
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
          <Card variant="borderless" className="product-detail-card">
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
            <Space wrap style={{ marginBottom: 12 }}>
              <Rate disabled allowHalf value={product.averageRating || 0} />
              <Text type="secondary">{product.reviewCount || 0} comments</Text>
              <Text type="secondary">{product.buyerCount || 0} buyers</Text>
              <Text type="secondary">Sold {product.sold || 0}</Text>
              <Text type="secondary">Views {product.views || 0}</Text>
            </Space>
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
                <Button
                  type={isInWishlist ? "primary" : "default"}
                  danger={isInWishlist}
                  icon={isInWishlist ? <HeartFilled /> : <HeartOutlined />}
                  loading={wishlistLoading}
                  onClick={handleWishlist}
                >
                  {isInWishlist ? "Wishlisted" : "Wishlist"}
                </Button>
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

      <Divider />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Reviews">
            {reviews.length ? (
              <Space direction="vertical" style={{ width: "100%" }} size={0}>
                {reviews.map((review, index) => (
                  <div
                    key={review._id || index}
                    style={{
                      padding: "12px 0",
                      borderBottom: index === reviews.length - 1 ? "none" : "1px solid #f0f0f0"
                    }}
                  >
                    <Space wrap>
                      <Text strong>{review.userId?.fullName || "Customer"}</Text>
                      <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
                    </Space>
                    <div>
                      <Text type="secondary">{review.comment || "No comment"}</Text>
                    </div>
                  </div>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No reviews yet</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Similar products">
            <Row gutter={[16, 16]}>
              {similarProducts.map((item) => (
                <Col xs={24} sm={12} key={item._id}>
                  <ProductCard product={item} />
                </Col>
              ))}
              {!similarProducts.length && <Text type="secondary">No similar products</Text>}
            </Row>
          </Card>
        </Col>
      </Row>

      {isCustomer && viewedProducts.length > 0 && (
        <>
          <Divider />
          <Card title="Recently viewed">
            <Row gutter={[16, 16]}>
              {viewedProducts.map((item) => (
                <Col xs={24} sm={12} lg={6} key={item._id}>
                  <ProductCard product={item} />
                </Col>
              ))}
            </Row>
          </Card>
        </>
      )}
    </div>
  );
}
