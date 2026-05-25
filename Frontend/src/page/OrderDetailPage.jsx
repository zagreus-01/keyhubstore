import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Descriptions, Divider, Empty, List, notification, Tag, Typography } from "antd";
import api, { getErrorMessage } from "../util/api";
import { useAuth } from "../components/context/AuthContext";

const { Title, Text } = Typography;

const statusColor = {
  pending: "orange",
  preparing: "blue",
  shipping: "cyan",
  delivered: "green",
  cancelled: "red",
  confirmed: "lime",
  preparing: "gold",
  delivered: "purple",
  cancel_requested: "volcano"
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/order/${id}`);
        setOrder(response.data.data);
      } catch (error) {
        notification.error({ message: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user]);

  if (loading) {
    return <div className="page-loading">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="page-orders">
        <Title level={3}>Order not found</Title>
        <Empty
          description="Unable to load this order"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate("/orders")}>Back to orders</Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="page-orders">
      <Title>Order #{order._id.slice(-8)}</Title>
      <Tag color={statusColor[order.orderStatus] || "default"}>{order.orderStatus}</Tag>
      <Divider />
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Order tracking</Title>
        {(() => {
          const statusMap = {
            pending: "Đơn hàng mới",
            confirmed: "Đã xác nhận đơn hàng",
            preparing: "Shop đang chuẩn bị hàng",
            shipping: "Đang giao hàng",
            delivered: "Đã giao thành công",
            cancel_requested: "Yêu cầu hủy đơn",
            cancelled: "Hủy đơn hàng"
          };
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
              <div style={{ 
                minWidth: 40, 
                height: 40, 
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: "bold",
                backgroundColor: "#1890ff",
                color: "#fff"
              }}>
                ●
              </div>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                  {statusMap[order.orderStatus] || order.orderStatus}
                </Text>
              </div>
            </div>
          );
        })()}
      </Card>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Order ID">{order._id}</Descriptions.Item>
        <Descriptions.Item label="Created at">{new Date(order.createdAt).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Total amount">{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.finalAmount || order.totalAmount || 0)}</Descriptions.Item>
        <Descriptions.Item label="Payment method">{order.paymentMethod || "COD"}</Descriptions.Item>
        <Descriptions.Item label="Shipping name">{order.shippingAddress?.fullName || "-"}</Descriptions.Item>
        <Descriptions.Item label="Shipping address">{order.shippingAddress?.address || "-"}</Descriptions.Item>
      </Descriptions>
      <Divider />
      <List
        header={<Title level={5}>Items</Title>}
        dataSource={order.items || []}
        renderItem={(item) => (
          <List.Item>
            <Card size="small" style={{ width: "100%" }}>
              <Text strong>{item.productName}</Text>
              <div>
                <Text type="secondary">Variant: {item.variantName || item.sku || "-"}</Text>
              </div>
              <div>
                <Text>{item.quantity} x {Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.finalPrice)}</Text>
              </div>
            </Card>
          </List.Item>
        )}
      />
      <Divider />
      {order.orderStatus === "shipping" && (
        <Button type="primary" loading={confirming} onClick={async () => {
          setConfirming(true);
          try {
            const response = await api.put(`/order/${id}/confirm-delivered`);
            setOrder(response.data.data);
            notification.success({ message: "Xác nhận giao hàng thành công" });
          } catch (err) {
            notification.error({ message: "Không thể xác nhận giao hàng", description: getErrorMessage(err) });
          } finally {
            setConfirming(false);
          }
        }} style={{ marginBottom: 16 }}>
          Xác nhận đã giao thành công
        </Button>
      )}
      <Button type="default" onClick={() => navigate("/orders")}>Back to orders</Button>
    </div>
  );
}
