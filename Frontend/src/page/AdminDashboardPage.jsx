import { useEffect, useState } from "react";
import { Card, Col, Divider, Row, Statistic, Typography, notification, Spin } from "antd";
import api, { getErrorMessage } from "../util/api";

const { Title } = Typography;

const statusColors = {
  pending: "orange",
  preparing: "blue",
  shipping: "cyan",
  delivered: "green",
  cancelled: "red",
  unknown: "default"
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await api.get("/dashboard");
        setStats(response.data.data);
      } catch (error) {
        notification.error({
          message: "Không thể tải dữ liệu",
          description: getErrorMessage(error)
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <Spin tip="Loading dashboard..." />
      </div>
    );
  }

  if (!stats) {
    return <div className="page-empty">No dashboard data available.</div>;
  }

  return (
    <div className="page-admin-dashboard">
      <Title level={2}>Admin / Staff Dashboard</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total users" value={stats.totalUsers || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total products" value={stats.totalProducts || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total categories" value={stats.totalCategories || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total brands" value={stats.totalBrands || 0} />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="Quick insights" style={{ marginBottom: 24 }}>
        <p>Admin dashboard tập trung vào quản lý người dùng, sản phẩm và danh mục.</p>
      </Card>
    </div>
  );
}
