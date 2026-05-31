import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Typography, notification, Spin, Table, Tag } from "antd";
import { UserOutlined, ShoppingCartOutlined, DollarOutlined, AppstoreOutlined } from "@ant-design/icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api, { getErrorMessage } from "../util/api";

const { Title } = Typography;

const statusColors = {
  pending: "orange",
  preparing: "blue",
  shipping: "cyan",
  delivered: "green",
  cancelled: "red",
  cancel_requested: "volcano",
  confirmed: "geekblue"
};

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#f5222d', '#722ed1', '#fa8c16'];

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
      <div className="flex h-64 items-center justify-center">
        <Spin description="Loading dashboard data..." size="large" />
      </div>
    );
  }

  if (!stats) {
    return <div className="page-empty">No dashboard data available.</div>;
  }

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (text) => <span className="text-xs">{text.substring(0, 8)}...</span>
    },
    {
      title: "Customer",
      dataIndex: "userId",
      key: "userId",
      render: (user) => user?.fullName || user?.email || "Unknown"
    },
    {
      title: "Amount",
      dataIndex: "finalAmount",
      key: "finalAmount",
      render: (amount) => <span className="font-semibold text-blue-600">{amount?.toLocaleString()}đ</span>
    },
    {
      title: "Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN")
    }
  ];

  return (
    <div className="page-admin-dashboard p-2 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <Title level={2} className="!mb-0">Overview Dashboard</Title>
      </div>

      {/* Top Metrics Row */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm rounded-xl border-l-4 border-l-blue-500">
            <Statistic 
              title="Total Revenue" 
              value={stats.totalRevenue || 0} 
              prefix={<DollarOutlined className="text-blue-500" />}
              suffix="đ"
              valueStyle={{ color: '#173f7a', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm rounded-xl border-l-4 border-l-green-500">
            <Statistic 
              title="Total Orders" 
              value={stats.totalOrders || 0} 
              prefix={<ShoppingCartOutlined className="text-green-500" />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm rounded-xl border-l-4 border-l-orange-500">
            <Statistic 
              title="Total Users" 
              value={stats.totalUsers || 0} 
              prefix={<UserOutlined className="text-orange-500" />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm rounded-xl border-l-4 border-l-purple-500">
            <Statistic 
              title="Total Products" 
              value={stats.totalProducts || 0} 
              prefix={<AppstoreOutlined className="text-purple-500" />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} lg={16}>
          <Card title="Revenue Overview (Last 12 Months)" className="shadow-sm rounded-xl h-full">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={stats.revenueByMonth || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(val) => `${val / 1000000}M`} />
                  <RechartsTooltip formatter={(value) => [`${value.toLocaleString()}đ`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#173f7a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Orders by Status" className="shadow-sm rounded-xl h-full">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {(stats.ordersByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders Table */}
      <Card title="Recent Orders" className="shadow-sm rounded-xl">
        <Table 
          columns={columns} 
          dataSource={stats.recentOrders || []} 
          rowKey="_id" 
          pagination={false}
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  );
}
