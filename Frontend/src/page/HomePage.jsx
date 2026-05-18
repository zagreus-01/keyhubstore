import { useEffect, useState } from "react";
import { Button, Card, Col, Row, Skeleton, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../util/api";
import ProductCard from "../components/common/ProductCard";

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productRes, categoryRes, brandRes] = await Promise.all([
          api.get("/product?limit=12"),
          api.get("/category"),
          api.get("/brand")
        ]);
        setProducts(productRes.data.data.slice(0, 8));
        setCategories(categoryRes.data.data);
        setBrands(brandRes.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="page-home">
      <section className="hero-section">
        <div className="hero-copy">
          <Title>Keyhub Store</Title>
          <Paragraph className="hero-description">
            Mua sắm công nghệ an toàn, giao hàng nhanh chóng và thanh toán tiện lợi.
          </Paragraph>
          <div className="hero-actions">
            <Button type="primary" size="large" onClick={() => navigate("/products")}>Browse products</Button>
            <Button type="default" size="large" onClick={() => navigate("/cart")}>View cart</Button>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80" alt="Shopping" />
        </div>
      </section>

      <section className="home-section">
        <Title level={3}>Popular categories</Title>
        <Row gutter={[16, 16]}>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={6}>
                <Card>
                  <Skeleton active />
                </Card>
              </Col>
            ))
          ) : (
            categories.slice(0, 4).map((category) => (
              <Col key={category._id} xs={24} sm={12} md={6}>
                <Card hoverable onClick={() => navigate(`/products?categoryId=${category._id}`)}>
                  <Title level={5}>{category.categoryName || category.name || "Category"}</Title>
                  <Paragraph type="secondary">Explore {category.categoryName || category.name}</Paragraph>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </section>

      <section className="home-section">
        <Title level={3}>Featured products</Title>
        <Row gutter={[16, 16]}>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={6}><Card><Skeleton active /></Card></Col>
            ))
          ) : (
            products.map((product) => (
              <Col key={product._id} xs={24} sm={12} md={6}>
                <ProductCard product={product} />
              </Col>
            ))
          )}
        </Row>
      </section>

      <section className="home-section home-bottom">
        <Card className="feature-card">
          <Title level={4}>Fast delivery</Title>
          <Paragraph>Đơn hàng được xử lý nhanh chóng và giao tận nơi. Trải nghiệm dịch vụ khách hàng chu đáo.</Paragraph>
        </Card>
        <Card className="feature-card">
          <Title level={4}>Secure checkout</Title>
          <Paragraph>Bảo mật thông tin thanh toán và đơn hàng. Hỗ trợ COD hoặc thanh toán trực tuyến.</Paragraph>
        </Card>
        <Card className="feature-card">
          <Title level={4}>Best brands</Title>
          <Paragraph>Kho sản phẩm đa dạng, cùng thương hiệu uy tín và giá tốt.</Paragraph>
        </Card>
      </section>
    </div>
  );
}
