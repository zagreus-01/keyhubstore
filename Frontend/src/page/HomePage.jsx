import { useEffect, useState } from "react";
import { Button, Card, Col, Row, Skeleton, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import api, { getBackendUrl } from "../util/api";
import ProductCard from "../components/common/ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const { Title, Paragraph } = Typography;

const defaultHeroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1512499617640-c2f999018b72?auto=format&fit=crop&w=1200&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1519923833742-bd8b4b0b84c8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    image:
      "https://images.unsplash.com/photo-1514986888952-8cd320577b0c?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function HomePage() {
  const [heroSlides, setHeroSlides] = useState(defaultHeroSlides);
  const [products, setProducts] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [topViewed, setTopViewed] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productRes, topSellingRes, topViewedRes, categoryRes, brandRes, labelRes] =
          await Promise.all([
            api.get("/product?limit=8"),
            api.get("/product?sortBy=sold&limit=10"),
            api.get("/product?sortBy=views&limit=10"),
            api.get("/category"),
            api.get("/brand"),
            api.get("/upload/label"),
          ]);

        setProducts(productRes.data.data);
        setTopSelling(topSellingRes.data.data || []);
        setTopViewed(topViewedRes.data.data || []);
        setCategories(categoryRes.data.data);
        setBrands(brandRes.data.data);

        const labelImages =
          labelRes.data?.data?.images || [];

        if (labelImages.length > 0) {
          setHeroSlides(
            labelImages.map((imgPath) => ({
              image: getBackendUrl(imgPath),
            }))
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <>
      {/* CSS INLINE */}
      <style>
  {`
    /* FULL WIDTH */

    .page-content {
      padding: 0 !important;
    }

    .page-home {
      width: 100%;
      padding: 0;
    }

    /* HERO */

    .hero-section {
      width: 100%;
      margin-bottom: 56px;
    }

    .hero-full-panel {
      position: relative;
      width: 100%;
      height: 520px;

      overflow: hidden;
      border-radius: 0;
    }

    /* SWIPER */

    .home-hero-swiper,
    .home-hero-swiper .swiper,
    .home-hero-swiper .swiper-wrapper,
    .home-hero-swiper .swiper-slide {
      width: 100%;
      height: 100%;
    }

    .home-hero-swiper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

    /* OVERLAY */

    .hero-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;

      display: flex;
      flex-direction: column;
      justify-content: center;

      width: 100%;
      padding: 0 120px;

      background: linear-gradient(
        to right,
        rgba(0, 0, 0, 0.72),
        rgba(0, 0, 0, 0.32),
        transparent
      );

      color: white;
    }

    .hero-overlay .ant-typography {
      color: white !important;
    }

    .hero-overlay h1 {
      font-size: 82px !important;
      font-weight: 800;
      margin-bottom: 16px !important;
      line-height: 1.1;
    }

    .hero-description {
      max-width: 700px;
      font-size: 24px;
      line-height: 1.6;
      margin-bottom: 32px !important;
    }

    .hero-actions .ant-btn {
      height: 56px;
      padding: 0 40px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 600;
    }

    /* CONTENT */

    .home-section {
      width: 100%;
      padding: 0 80px;
      margin-bottom: 64px;
    }

    .home-section h3 {
      font-size: 34px !important;
      margin-bottom: 28px !important;
    }

    /* FEATURE */

    .home-bottom {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;

      padding-bottom: 60px;
    }

    .feature-card {
      border-radius: 20px;
    }

    /* SWIPER DOT */

    .swiper-pagination-bullet {
      background: white !important;
      opacity: 0.7;
      width: 10px;
      height: 10px;
    }

    .swiper-pagination-bullet-active {
      opacity: 1;
    }

    /* RESPONSIVE */

    @media (max-width: 1200px) {
      .hero-overlay {
        padding: 0 80px;
      }

      .hero-overlay h1 {
        font-size: 62px !important;
      }

      .hero-description {
        font-size: 20px;
      }
    }

    @media (max-width: 992px) {
      .hero-full-panel {
        height: 500px;
      }

      .hero-overlay {
        padding: 0 48px;
      }

      .hero-overlay h1 {
        font-size: 48px !important;
      }

      .hero-description {
        font-size: 18px;
      }

      .home-section {
        padding: 0 32px;
      }

      .home-bottom {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero-full-panel {
        height: 360px;
      }

      .hero-overlay {
        padding: 0 24px;
      }

      .hero-overlay h1 {
        font-size: 34px !important;
      }

      .hero-description {
        font-size: 15px;
        max-width: 100%;
      }

      .hero-actions .ant-btn {
        height: 46px;
        padding: 0 28px;
        font-size: 15px;
      }

      .home-section {
        padding: 0 16px;
      }

      .home-section h3 {
        font-size: 26px !important;
      }
    }
  `}
</style>

      <div className="page-home">
        {/* HERO */}
        <section className="hero-section">
          <div className="hero-image hero-full-panel">
            <Swiper
              modules={[Autoplay, Pagination]}
              pagination={{ clickable: true }}
              autoplay={{
                delay: 4500,
                disableOnInteraction: false,
              }}
              loop
              className="home-hero-swiper"
            >
              {heroSlides.map((slide, index) => (
                <SwiperSlide key={index}>
                  <img
                    src={slide.image}
                    alt="Keyhub label"
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="hero-overlay">
              <Title>Keyhub Store</Title>

              <Paragraph className="hero-description">
                Mua sắm công nghệ an toàn, giao hàng nhanh
                chóng và thanh toán tiện lợi.
              </Paragraph>

              <div className="hero-actions">
                <Button
                  type="primary"
                  size="large"
                  onClick={() =>
                    navigate("/products")
                  }
                >
                  Browse products
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="home-section">
          <Title level={3}>Popular categories</Title>

          <Row gutter={[16, 16]}>
            {loading ? (
              Array.from({ length: 4 }).map(
                (_, index) => (
                  <Col
                    key={index}
                    xs={24}
                    sm={12}
                    md={6}
                  >
                    <Card>
                      <Skeleton active />
                    </Card>
                  </Col>
                )
              )
            ) : (
              categories
                .slice(0, 4)
                .map((category) => (
                  <Col
                    key={category._id}
                    xs={24}
                    sm={12}
                    md={6}
                  >
                    <Card
                      hoverable
                      onClick={() =>
                        navigate(
                          `/products?categoryId=${category._id}`
                        )
                      }
                    >
                      <Title level={5}>
                        {category.categoryName ||
                          category.name ||
                          "Category"}
                      </Title>

                      <Paragraph type="secondary">
                        Explore{" "}
                        {category.categoryName ||
                          category.name}
                      </Paragraph>
                    </Card>
                  </Col>
                ))
            )}
          </Row>
        </section>

        {/* PRODUCTS */}
        <section className="home-section">
          <Title level={3}>Featured products</Title>

          <Row gutter={[16, 16]}>
            {loading ? (
              Array.from({ length: 4 }).map(
                (_, index) => (
                  <Col
                    key={index}
                    xs={24}
                    sm={12}
                    md={6}
                  >
                    <Card>
                      <Skeleton active />
                    </Card>
                  </Col>
                )
              )
            ) : (
              products.map((product) => (
                <Col
                  key={product._id}
                  xs={24}
                  sm={12}
                  md={6}
                >
                  <ProductCard product={product} />
                </Col>
              ))
            )}
          </Row>
        </section>

        {/* TOP SELLING PRODUCTS */}
        <section className="home-section">
          <Title level={3}>Sản phẩm bán chạy nhất</Title>
          {loading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Col key={index} xs={24} sm={12} md={6}><Card><Skeleton active /></Card></Col>
              ))}
            </Row>
          ) : (
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              navigation
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                576: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                992: { slidesPerView: 4 },
              }}
              style={{ padding: "10px 0 40px" }}
              pagination={{ clickable: true, dynamicBullets: true }}
            >
              {topSelling.map((product) => (
                <SwiperSlide key={product._id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

        {/* MOST VIEWED PRODUCTS */}
        <section className="home-section">
          <Title level={3}>Sản phẩm xem nhiều nhất</Title>
          {loading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Col key={index} xs={24} sm={12} md={6}><Card><Skeleton active /></Card></Col>
              ))}
            </Row>
          ) : (
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              navigation
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                576: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                992: { slidesPerView: 4 },
              }}
              style={{ padding: "10px 0 40px" }}
              pagination={{ clickable: true, dynamicBullets: true }}
            >
              {topViewed.map((product) => (
                <SwiperSlide key={product._id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

        {/* FEATURES */}
        <section className="home-section home-bottom">
          <Card className="feature-card">
            <Title level={4}>Fast delivery</Title>

            <Paragraph>
              Đơn hàng được xử lý nhanh chóng và giao tận
              nơi. Trải nghiệm dịch vụ khách hàng chu đáo.
            </Paragraph>
          </Card>

          <Card className="feature-card">
            <Title level={4}>Secure checkout</Title>

            <Paragraph>
              Bảo mật thông tin thanh toán và đơn hàng.
              Hỗ trợ COD hoặc thanh toán trực tuyến.
            </Paragraph>
          </Card>

          <Card className="feature-card">
            <Title level={4}>Best brands</Title>

            <Paragraph>
              Kho sản phẩm đa dạng, cùng thương hiệu uy tín
              và giá tốt.
            </Paragraph>
          </Card>
        </section>
      </div>
    </>
  );
}