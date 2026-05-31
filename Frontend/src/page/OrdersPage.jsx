import { useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Divider, Empty, List, notification, Pagination, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../util/api";
import useAuth from "../components/context/useAuth";

const { Title, Text } = Typography;

const statusColor = {
  pending: "orange",
  confirmed: "lime",
  preparing: "blue",
  shipping: "cyan",
  delivered: "green",
  cancel_requested: "volcano",
  cancelled: "red"
};

const statusLabel = {
  pending: "Don hang moi",
  confirmed: "Da xac nhan",
  preparing: "Shop dang chuan bi hang",
  shipping: "Dang giao hang",
  delivered: "Da giao thanh cong",
  cancel_requested: "Yeu cau huy don",
  cancelled: "Da huy"
};

const canRequestCancel = (status) => ["pending", "confirmed", "preparing"].includes(status);

export default function OrdersPage() {
  const { user } = useAuth();
  const normalizedRole = String(user?.role || "").toLowerCase();
  const isCustomer = normalizedRole === "customer";
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isCustomer) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get("/order/my-orders", {
          params: {
            page: pagination.page,
            limit: pagination.limit
          }
        });

        const nextOrders = response.data.data || [];
        const nextPagination = response.data.pagination || {
          page: pagination.page,
          limit: pagination.limit,
          total: nextOrders.length,
          totalPages: 1
        };

        setOrders(nextOrders);
        setPagination((prev) => ({
          ...prev,
          ...nextPagination
        }));
      } catch (error) {
        notification.error({ title: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isCustomer, pagination.page, pagination.limit]);

  const handleCancelOrder = async (order) => {
    try {
      const response = await api.put(`/order/${order._id}/cancel`);
      const updatedOrder = response.data.data;
      const updatedStatus = updatedOrder?.orderStatus || order.orderStatus;

      notification.success({
        message: updatedStatus === "cancel_requested" ? "Da gui yeu cau huy don" : "Da huy don hang"
      });

      setOrders((prev) => prev.map((item) => item._id === order._id ? updatedOrder : item));
    } catch (err) {
      notification.error({ message: "Khong the huy don", description: getErrorMessage(err) });
    }
  };

  const handlePageChange = (page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      page: pageSize === prev.limit ? page : 1,
      limit: pageSize
    }));
  };

  if (!isCustomer) {
    return (
      <div className="page-orders">
        <Title>My orders</Title>
        <Card>
          <Alert
            message="Order history is only available for customers"
            description="If you are a staff or admin user, please use the admin orders dashboard to manage orders."
            type="info"
            showIcon
          />
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate("/admin/orders")}>Go to admin orders</Button>
        </Card>
      </div>
    );
  }

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
        <>
        <List
          dataSource={orders}
          itemLayout="vertical"
          renderItem={(order) => (
            <Card key={order._id} className="order-card" hoverable>
              <div className="order-head">
                <div>
                  <Text strong>Order #{order._id.slice(-8)}</Text>
                  <Tag color={statusColor[order.orderStatus] || "default"}>{statusLabel[order.orderStatus] || order.orderStatus}</Tag>
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
              <Button style={{ marginTop: 16 }} type="default" onClick={() => navigate("/products")}>Continue shopping</Button>
              <Button style={{ marginTop: 16, marginLeft: 8 }} type="primary" onClick={() => navigate(`/orders/${order._id}`)}>View details</Button>
              {canRequestCancel(order.orderStatus) && (
                <Button style={{ marginTop: 16, marginLeft: 8 }} danger onClick={() => handleCancelOrder(order)}>
                  {order.orderStatus === "preparing" ? "Request cancellation" : "Cancel order"}
                </Button>
              )}
            </Card>
          )}
        />
        <Pagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          showSizeChanger
          pageSizeOptions={["5", "10", "20"]}
          onChange={handlePageChange}
          style={{ marginTop: 24, textAlign: "right" }}
        />
        </>
      )}
    </div>
  );
}
