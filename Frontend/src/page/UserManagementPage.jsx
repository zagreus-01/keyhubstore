import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, Popconfirm, Select, Space, Table, Tag, Typography, notification, Spin } from "antd";
import api, { getErrorMessage } from "../util/api";
import { useAuth } from "../components/context/AuthContext";

const { Title, Text } = Typography;
const { Option } = Select;

const statusColors = {
  active: "green",
  blocked: "red",
  pending: "orange",
  unknown: "default"
};

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const roleOptions = useMemo(
    () => ["customer", "staff", "admin"],
    []
  );

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.data || []);
    } catch (error) {
      notification.error({
        message: "Không thể tải danh sách người dùng",
        description: getErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (id, role) => {
    setUpdatingId(id);
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      notification.success({ message: "Cập nhật vai trò thành công" });
      await fetchUsers();
    } catch (error) {
      notification.error({
        message: "Không thể cập nhật vai trò",
        description: getErrorMessage(error)
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBlock = async (id, blocked) => {
    setUpdatingId(id);
    try {
      await api.put(`/admin/users/${id}/${blocked ? "unblock" : "block"}`);
      notification.success({ message: blocked ? "Đã mở khóa người dùng" : "Đã khóa người dùng" });
      await fetchUsers();
    } catch (error) {
      notification.error({
        message: "Không thể thay đổi trạng thái",
        description: getErrorMessage(error)
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (id) => {
    setUpdatingId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      notification.success({ message: "Xóa người dùng thành công" });
      await fetchUsers();
    } catch (error) {
      notification.error({
        message: "Không thể xóa người dùng",
        description: getErrorMessage(error)
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    {
      title: "User",
      dataIndex: "fullName",
      key: "fullName",
      render: (_, record) => (
        <Space>
          <Avatar>{record.fullName?.slice(0, 1).toUpperCase() || record.email?.slice(0, 1).toUpperCase()}</Avatar>
          <div>
            <Text strong>{record.fullName || "Unknown"}</Text>
            <br />
            <Text type="secondary">{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <Select
          value={role}
          disabled={record.role === "admin" || currentUser?._id === record._id}
          onChange={(value) => handleUpdateRole(record._id, value)}
          loading={updatingId === record._id}
          style={{ minWidth: 140 }}
        >
          {roleOptions.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColors[status] || statusColors.unknown}>
          {status || "active"}
        </Tag>
      )
    },
    {
      title: "Registered",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const isAdmin = record.role === "admin";
        const selfUser = currentUser?._id === record._id;
        return (
          <Space wrap>
            <Button
              type={record.status === "blocked" ? "default" : "primary"}
              onClick={() => handleToggleBlock(record._id, record.status === "blocked")}
              disabled={isAdmin || selfUser}
              loading={updatingId === record._id}
            >
              {record.status === "blocked" ? "Unblock" : "Block"}
            </Button>
            <Popconfirm
              title="Xóa người dùng này?"
              onConfirm={() => handleDeleteUser(record._id)}
              okText="Yes"
              cancelText="No"
              disabled={isAdmin || selfUser}
            >
              <Button danger disabled={isAdmin || selfUser} loading={updatingId === record._id}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div className="page-user-management">
      <Title level={2}>User Management</Title>
      <Card>
        <Text type="secondary">Manage all users, change roles, block/unblock accounts, or remove non-admin accounts.</Text>
      </Card>

      <Card style={{ marginTop: 24 }}>
        {loading ? (
          <div className="page-loading">
            <Spin tip="Loading users..." />
          </div>
        ) : (
          <Table
            rowKey={(record) => record._id}
            dataSource={users}
            columns={columns}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "No users found" }}
          />
        )}
      </Card>
    </div>
  );
}
