import { useEffect, useState } from "react";
import { Button, Card, Descriptions, Divider, Empty, List, notification, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../util/api";

const { Title, Text } = Typography;

const statusColor = {
  pending: "orange",
  processing: "blue",
  shipping: "cyan",
  completed: "green",
  cancelled: "red"
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await api.get("/order/my-orders");
        setOrders(response.data.data);
      } catch (error) {
        notification.error({ title: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <div className="page-loading">Loading orders...</div>;
  }

  return (
    <div className="page-orders">
      <Title>My orders</Title>
      {orders.length === 0 ? (
        <Empty description="No orders yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => navigate("/products")}>Shop now</Button>
        </Empty>
      ) : (
        <List
          dataSource={orders}
          itemLayout="vertical"
          renderItem={(order) => (
            <Card key={order._id} className="order-card" hoverable>
              <div className="order-head">
                <div>
                  <Text strong>Order #{order._id.slice(-8)}</Text>
                  <Tag color={statusColor[order.orderStatus] || "default"}>{order.orderStatus}</Tag>
                </div>
                <Text>{new Date(order.createdAt).toLocaleString()}</Text>
              </div>
              <Divider />
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Total amount">{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.finalAmount || order.totalAmount || 0)}</Descriptions.Item>
                <Descriptions.Item label="Payment method">{order.paymentMethod || "COD"}</Descriptions.Item>
                <Descriptions.Item label="Shipping name">{order.shippingAddress?.fullName || "-"}</Descriptions.Item>
                <Descriptions.Item label="Address">{order.shippingAddress?.address || "-"}</Descriptions.Item>
              </Descriptions>
              <Divider />
              <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={order.items || []}
                renderItem={(item) => (
                  <List.Item>
                    <Card size="small">
                      <Text strong>{item.productName}</Text><br />
                      <Text type="secondary">Variant: {item.variantName || item.sku || "-"}</Text><br />
                      <Text>{item.quantity} x {Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.finalPrice)}</Text>
                    </Card>
                  </List.Item>
                )}
              />
              <Button style={{ marginTop: 16 }} type="default" onClick={() => navigate(`/products`)}>Continue shopping</Button>
                  {order.orderStatus !== "completed" && order.orderStatus !== "cancelled" && (
                    <Button style={{ marginTop: 16, marginLeft: 8 }} danger onClick={async () => {
                      try {
                        await api.put(`/order/${order._id}/cancel`);
                        notification.success({ message: "Đã hủy đơn hàng" });
                        setOrders((prev) => prev.map(o => o._id === order._id ? { ...o, orderStatus: 'cancelled' } : o));
                      } catch (err) {
                        notification.error({ message: "Không thể hủy đơn", description: getErrorMessage(err) });
                      }
                    }}>Cancel order</Button>
                  )}
            </Card>
          )}
        />
      )}
    </div>
  );
}
