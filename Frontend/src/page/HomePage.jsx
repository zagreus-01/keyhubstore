import { useEffect, useState } from "react";
import { ArrowRightOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Skeleton, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ProductCard from "../components/common/ProductCard";
import api, { getBackendUrl } from "../util/api";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const { Title, Paragraph, Text } = Typography;

const defaultHeroSlides = [
  {
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=85",
  },
  {
    image: "https://images.unsplash.com/photo-1512499617640-c2f999018b72?auto=format&fit=crop&w=1600&q=85",
  },
  {
    image: "https://images.unsplash.com/photo-1519923833742-bd8b4b0b84c8?auto=format&fit=crop&w=1600&q=85",
  },
  {
    image: "https://images.unsplash.com/photo-1514986888952-8cd320577b0c?auto=format&fit=crop&w=1600&q=85",
  },
];

export default function HomePage() {
  const [heroSlides, setHeroSlides] = useState(defaultHeroSlides);
  const [bestSellers, setBestSellers] = useState([]);
  const [mostViewed, setMostViewed] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bestSellersRes, mostViewedRes, categoryRes, brandRes, labelRes] = await Promise.all([
          api.get("/product?sortBy=sold&limit=10"),
          api.get("/product?sortBy=views&limit=10"),
          api.get("/category"),
          api.get("/brand"),
          api.get("/upload/label"),
        ]);

        setBestSellers(bestSellersRes.data.data || []);
        setMostViewed(mostViewedRes.data.data || []);
        setCategories(categoryRes.data.data || []);
        setBrands(brandRes.data.data || []);

        const labelImages = labelRes.data?.data?.images || [];
        if (labelImages.length > 0) {
          setHeroSlides(labelImages.map((imgPath) => ({ image: getBackendUrl(imgPath) })));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const visibleBrands = (brands.length ? brands : [{ brandName: "Keyhub" }, { brandName: "Logitech" }, { brandName: "Sony" }, { brandName: "Asus" }]).slice(0, 8);

  return (
    <div className="page-home">
      <section className="hero-section">
        <div className="hero-image">
          <Swiper
            modules={[Autoplay, Pagination]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            loop
            className="home-hero-swiper"
          >
            {heroSlides.map((slide, index) => (
              <SwiperSlide key={`${slide.image}-${index}`}>
                <img src={slide.image} alt="Keyhub technology showcase" />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="hero-overlay">
            <Text className="hero-kicker">Curated tech gear</Text>
            <Title>Keyhub Store</Title>
            <Paragraph className="hero-description">
              Mua sắm công nghệ gọn hơn, đẹp hơn và được chọn lọc cho những thiết bị bạn dùng mỗi ngày.
            </Paragraph>

            <div className="hero-actions">
              <Button type="primary" size="large" icon={<ArrowRightOutlined />} iconPosition="end" onClick={() => navigate("/products")}>
                Browse products
              </Button>
              <Button size="large" className="hero-secondary-btn" onClick={() => navigate("/products?sortBy=views")}>
                See what is trending
              </Button>
            </div>

            <div className="hero-proof">
              <span>Xử lý trong ngày</span>
              <span>Thanh toán an toàn</span>
              <span>Thương hiệu uy tín</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">Shop by need</Text>
            <Title level={3}>Popular categories</Title>
          </div>
          <Button type="link" onClick={() => navigate("/products")}>View all products</Button>
        </div>

        <Row gutter={[16, 16]}>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={6}>
                <Card className="category-card">
                  <Skeleton active />
                </Card>
              </Col>
            ))
          ) : (
            categories.slice(0, 4).map((category, index) => (
              <Col key={category._id} xs={24} sm={12} md={6}>
                <Card hoverable className="category-card" onClick={() => navigate(`/products?categoryId=${category._id}`)}>
                  <Text className="category-index">{String(index + 1).padStart(2, "0")}</Text>
                  <Title level={5}>{category.categoryName || category.name || "Category"}</Title>
                  <Paragraph type="secondary">Explore {category.categoryName || category.name}</Paragraph>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </section>

      <section className="home-section brand-ribbon">
        <Text className="section-kicker">Brand shelf</Text>
        <div className="brand-ribbon-track">
          {visibleBrands.map((brand, index) => (
            <button
              key={brand._id || brand.brandName || index}
              className="brand-chip"
              onClick={() => brand._id ? navigate(`/products?brandId=${brand._id}`) : navigate("/products")}
            >
              {brand.brandName || brand.name || "Brand"}
            </button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">What moves fast</Text>
            <Title level={3}>Best sellers</Title>
          </div>
        </div>

        {loading ? (
          <Row gutter={[16, 16]}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={6}>
                <Card>
                  <Skeleton active />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Swiper
            modules={[Pagination, Navigation]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              576: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              992: { slidesPerView: 4 },
            }}
            className="storefront-product-swiper"
          >
            {bestSellers.map((product) => (
              <SwiperSlide key={product._id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">Most compared</Text>
            <Title level={3}>Most viewed products</Title>
          </div>
        </div>

        {loading ? (
          <Row gutter={[16, 16]}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={6}>
                <Card>
                  <Skeleton active />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Swiper
            modules={[Pagination, Navigation]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              576: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              992: { slidesPerView: 4 },
            }}
            className="storefront-product-swiper"
          >
            {mostViewed.map((product) => (
              <SwiperSlide key={product._id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>

      <section className="home-section home-bottom">
        <Card className="feature-card">
          <Space className="feature-icon" align="center"><ThunderboltOutlined /></Space>
          <Title level={4}>Giao hàng nhanh</Title>
          <Paragraph>Đơn hàng được xử lý nhanh, theo dõi rõ ràng và giao tới nơi.</Paragraph>
        </Card>

        <Card className="feature-card">
          <Space className="feature-icon" align="center"><SafetyCertificateOutlined /></Space>
          <Title level={4}>Thanh toán an toàn</Title>
          <Paragraph>Bảo mật thông tin thanh toán, hỗ trợ COD và thanh toán trực tuyến.</Paragraph>
        </Card>

        <Card className="feature-card">
          <Space className="feature-icon" align="center"><ArrowRightOutlined /></Space>
          <Title level={4}>Thương hiệu tốt</Title>
          <Paragraph>Danh mục gọn, thương hiệu tốt và thông tin sản phẩm dễ so sánh.</Paragraph>
        </Card>
      </section>
    </div>
  );
}
