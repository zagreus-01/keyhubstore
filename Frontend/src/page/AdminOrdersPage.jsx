import { useEffect, useState, useMemo } from "react";
import { Button, Card, Input, Select, Space, Table, Tag, Typography, notification, Spin } from "antd";
import api, { getErrorMessage } from "../util/api";

const { Title, Text } = Typography;
const { Option } = Select;

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const statuses = useMemo(() => [
    "pending",
    "confirmed",
    "preparing",
    "shipping",
    "delivered",
    "cancel_requested",
    "cancelled"
  ], []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/order");
      setOrders(res.data.data || []);
    } catch (err) {
      notification.error({ message: "Không thể tải đơn hàng", description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChangeStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/order/${orderId}/status`, { status });
      notification.success({ message: "Cập nhật trạng thái thành công" });
      await fetchOrders();
    } catch (err) {
      notification.error({ message: "Không thể cập nhật trạng thái", description: getErrorMessage(err) });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) => {
      const customerName = order.user?.fullName || order.shippingAddress?.fullName || "";
      const customerEmail = order.user?.email || order.email || "";
      const status = order.orderStatus || "";
      const payment = order.paymentMethod || "";
      return [
        order._id,
        customerName,
        customerEmail,
        status,
        payment
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword));
    });
  }, [orders, searchKeyword]);

  const columns = [
    {
      title: "Order",
      dataIndex: "_id",
      key: "id",
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: "Customer",
      dataIndex: "shippingAddress",
      key: "customer",
      render: (addr, record) => (
        <div>
          <Text strong>{record.user?.fullName || addr?.fullName || "-"}</Text>
          <br />
          <Text type="secondary">{record.user?.email || record.email || "-"}</Text>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "orderStatus",
      key: "status",
      render: (status, record) => (
        <Space align="center">
          <Tag color={statusColor[status] || "default"}>{status}</Tag>
          <Select value={status} onChange={(value) => handleChangeStatus(record._id, value)} loading={updatingId === record._id} style={{ minWidth: 140 }}>
            {statuses.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </Space>
      )
    },
    {
      title: "Payment",
      dataIndex: "paymentMethod",
      key: "payment",
      render: (pm, record) => (
        <div>
          <Text strong>{pm}</Text>
          <br />
          <Text type="secondary">{record.paymentStatus}</Text>
        </div>
      )
    },
    {
      title: "Total",
      dataIndex: "finalAmount",
      key: "total",
      render: (val) => Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0)
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => new Date(d).toLocaleString()
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button onClick={() => window.open(`/orders/${record._id}`, "_blank")}>View</Button>
          <Button type="primary" onClick={() => handleChangeStatus(record._id, 'delivered')} disabled={record.orderStatus === 'delivered' || record.orderStatus === 'cancelled'} loading={updatingId === record._id}>
            Complete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="page-admin-orders">
      <Title level={2}>Orders Management (Staff)</Title>

      <Card className="admin-info-card">
        <Text type="secondary">View all orders and update order statuses.</Text>
      </Card>

      <div className="page-title-row" style={{ marginTop: 24, gap: 12, alignItems: "center" }}>
        <Input.Search
          placeholder="Search orders by ID, customer, email, status, payment"
          allowClear
          enterButton="Search"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={setSearchKeyword}
          style={{ maxWidth: 420, width: "100%" }}
        />
      </div>

      <Card style={{ marginTop: 24 }}>
        {loading ? (
          <div className="page-loading"><Spin tip="Loading orders..." /></div>
        ) : (
          <Table rowKey={(r) => r._id} dataSource={filteredOrders} columns={columns} pagination={{ pageSize: 10 }} locale={{ emptyText: searchKeyword ? "No matching orders" : "No orders available" }} />
        )}
      </Card>
    </div>
  );
}
