import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Descriptions, Divider, Empty, Form, Input, List, Modal, notification, Rate, Space, Steps, Tag, Typography } from "antd";
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

const baseTrackingSteps = [
  { key: "pending", title: "Don hang moi" },
  { key: "confirmed", title: "Da xac nhan don hang" },
  { key: "preparing", title: "Shop dang chuan bi hang" },
  { key: "shipping", title: "Dang giao hang" },
  { key: "delivered", title: "Da giao thanh cong" }
];

const canRequestCancel = (status) => ["pending", "confirmed", "preparing"].includes(status);

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCustomer = String(user?.role || "").toLowerCase() === "customer";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm] = Form.useForm();

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

  const trackingSteps = useMemo(() => {
    if (!order) return baseTrackingSteps;
    if (order.orderStatus === "cancel_requested") {
      return [
        ...baseTrackingSteps.slice(0, 3),
        { key: "cancel_requested", title: "Yeu cau huy don" }
      ];
    }

    if (order.orderStatus === "cancelled") {
      return [
        ...baseTrackingSteps.slice(0, 3),
        { key: "cancelled", title: "Da huy don hang" }
      ];
    }

    return baseTrackingSteps;
  }, [order]);

  const currentStep = useMemo(() => {
    const index = trackingSteps.findIndex((step) => step.key === order?.orderStatus);
    return index >= 0 ? index : 0;
  }, [order?.orderStatus, trackingSteps]);

  const handleCancelOrder = async () => {
    if (!order) return;

    setCanceling(true);
    try {
      const response = await api.put(`/order/${order._id}/cancel`);
      const updatedOrder = response.data.data;
      setOrder(updatedOrder);
      notification.success({
        message: updatedOrder.orderStatus === "cancel_requested" ? "Da gui yeu cau huy don" : "Da huy don hang"
      });
    } catch (err) {
      notification.error({ message: "Khong the huy don", description: getErrorMessage(err) });
    } finally {
      setCanceling(false);
    }
  };

  const handleSubmitReview = async (values) => {
    if (!reviewingItem) return;

    setReviewLoading(true);
    try {
      const response = await api.post("/review", {
        orderId: order._id,
        productId: reviewingItem.productId,
        variantId: reviewingItem.variantId,
        rating: values.rating,
        comment: values.comment
      });

      const reward = response.data.data?.reward;
      notification.success({
        message: "Review submitted",
        description: reward
          ? `Reward: ${reward.points} points and coupon ${reward.coupon?.code}`
          : "Thank you for your review"
      });
      setReviewingItem(null);
      reviewForm.resetFields();
    } catch (err) {
      notification.error({ message: "Cannot submit review", description: getErrorMessage(err) });
    } finally {
      setReviewLoading(false);
    }
  };

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
      <Space align="center" wrap>
        <Title style={{ marginBottom: 0 }}>Order #{order._id.slice(-8)}</Title>
        <Tag color={statusColor[order.orderStatus] || "default"}>{statusLabel[order.orderStatus] || order.orderStatus}</Tag>
      </Space>
      <Divider />

      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>Order tracking</Title>
        <Steps
          current={currentStep}
          status={order.orderStatus === "cancelled" ? "error" : "process"}
          items={trackingSteps.map((step) => ({
            title: step.title,
            description: step.key === order.orderStatus ? "Current status" : undefined
          }))}
        />
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
              {isCustomer && order.orderStatus === "delivered" && (item.productId || item.variantId) && (
                <Button size="small" style={{ marginTop: 8 }} onClick={() => setReviewingItem(item)}>
                  Review
                </Button>
              )}
            </Card>
          </List.Item>
        )}
      />
      <Divider />

      <Space wrap>
        {isCustomer && canRequestCancel(order.orderStatus) && (
          <Button danger loading={canceling} onClick={handleCancelOrder}>
            {order.orderStatus === "preparing" ? "Request cancellation" : "Cancel order"}
          </Button>
        )}
        {isCustomer && order.orderStatus === "shipping" && (
          <Button type="primary" loading={confirming} onClick={async () => {
            setConfirming(true);
            try {
              const response = await api.put(`/order/${id}/confirm-delivered`);
              setOrder(response.data.data);
              notification.success({ message: "Xac nhan giao hang thanh cong" });
            } catch (err) {
              notification.error({ message: "Khong the xac nhan giao hang", description: getErrorMessage(err) });
            } finally {
              setConfirming(false);
            }
          }}>
            Confirm delivered
          </Button>
        )}
        <Button type="default" onClick={() => navigate("/orders")}>Back to orders</Button>
      </Space>

      <Modal
        title={`Review ${reviewingItem?.productName || "product"}`}
        open={Boolean(reviewingItem)}
        onCancel={() => setReviewingItem(null)}
        onOk={() => reviewForm.submit()}
        confirmLoading={reviewLoading}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleSubmitReview} initialValues={{ rating: 5 }}>
          <Form.Item name="rating" label="Rating" rules={[{ required: true, message: "Choose rating" }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="comment" label="Comment">
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
