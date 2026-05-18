import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Empty, notification, Row, Space, Typography } from "antd";
import { HeartFilled, ShoppingCartOutlined } from "@ant-design/icons";
import api, { getBackendUrl, getErrorMessage } from "../util/api";
import { useAuth } from "../components/context/AuthContext";

const { Title, Paragraph, Text } = Typography;

export default function WishlistPage() {
  const { user } = useAuth();
  const normalizedRole = String(user?.role || "").toLowerCase();
  const isCustomer = normalizedRole === "customer";
  const [wishlist, setWishlist] = useState({ products: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  if (!isCustomer) {
    return (
      <div className="page-wishlist">
        <Title>My wishlist</Title>
        <Card>
          <Alert
            message="Wishlist is only available for customers"
            description="Admin and staff users can view products and manage orders from the dashboard. Wishlist functionality is reserved for customer accounts."
            type="info"
            showIcon
          />
        </Card>
      </div>
    );
  }

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isCustomer) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get("/wishlist");
        setWishlist(response.data.data);
      } catch (error) {
        notification.error({ title: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [isCustomer]);

  const removeFavorite = async (productId) => {
    try {
      const response = await api.delete(`/wishlist/remove/${productId}`);
      setWishlist(response.data.data);
      notification.success({ title: "Removed from wishlist" });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  const productItems = wishlist.products || [];

  return (
    <div className="page-wishlist">
      <Title>My wishlist</Title>
      {loading ? (
        <Card loading />
      ) : productItems.length ? (
        <Row gutter={[16, 16]}>
          {productItems.map((product) => (
            <Col key={product._id} xs={24} sm={12} md={8}>
              <Card
                hoverable
                cover={<img alt={product.productName} src={product.images?.[0] || product.thumbnail ? (product.images?.[0] || product.thumbnail).startsWith("http") ? (product.images?.[0] || product.thumbnail) : getBackendUrl(product.images?.[0] || product.thumbnail) : "https://via.placeholder.com/320x240?text=Product"} />}
                actions={[
                <Button type="link" onClick={() => navigate(`/products/${product._id}`)}>View</Button>,
                <Button type="link" danger onClick={() => removeFavorite(product._id)}>Remove</Button>
              ]}>
                <Title level={5}>{product.productName}</Title>
                <Paragraph type="secondary">{product.brandId?.brandName || "No brand"}</Paragraph>
                <Text strong>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price || 0)}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="No items in wishlist" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => navigate("/products")}>Browse products</Button>
        </Empty>
      )}
    </div>
  );
}
