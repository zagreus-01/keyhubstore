import { useEffect, useState } from "react";
import { Button, Card, Col, Row, Skeleton, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import api, { getBackendUrl } from "../util/api";
import ProductCard from "../components/common/ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

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
  const [bestSellers, setBestSellers] = useState([]);
  const [mostViewed, setMostViewed] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bestSellersRes, mostViewedRes, categoryRes, brandRes, labelRes] =
          await Promise.all([
            api.get("/product?sortBy=sold&limit=10"),
            api.get("/product?sortBy=views&limit=10"),
            api.get("/category"),
            api.get("/brand"),
            api.get("/upload/label"),
          ]);

        setBestSellers(bestSellersRes.data.data || []);
        setMostViewed(mostViewedRes.data.data || []);
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

      <div className="page-home">
        {/* HERO */}
        <section className="hero-section w-full mb-14">
          <div className="hero-image relative w-full overflow-hidden h-[360px] md:h-[500px] lg:h-[620px]">
            <Swiper
              modules={[Autoplay, Pagination]}
              pagination={{ clickable: true }}
              autoplay={{
                delay: 4500,
                disableOnInteraction: false,
              }}
              loop
              className="absolute inset-0 h-full w-full"
            >
              {heroSlides.map((slide, index) => (
                <SwiperSlide key={index} className="h-full w-full">
                  <img
                    src={slide.image}
                    alt="Keyhub label"
                    className="h-full w-full object-cover object-center block"
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

        {/* BEST SELLERS */}
        <section className="home-section">
          <Title level={3}>Sản phẩm bán chạy nhất</Title>

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

        {/* MOST VIEWED */}
        <section className="home-section">
          <Title level={3}>Sản phẩm xem nhiều nhất</Title>

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