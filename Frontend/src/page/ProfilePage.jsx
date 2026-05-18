import { useEffect, useState } from "react";
import { PlusOutlined, CameraOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Divider, Form, Input, List, Modal, notification, Space, Tag, Typography, Upload } from "antd";
import api, { getErrorMessage } from "../util/api";
import { useAuth } from "../components/context/AuthContext";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();
  const { refreshProfile } = useAuth();

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8080"}/${avatarPath}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profileRes, addressRes] = await Promise.all([api.get("/user/profile"), api.get("/user/address")]);
        setProfile(profileRes.data.data);
        setAvatarPreview(getAvatarUrl(profileRes.data.data.avatar));
        setAddresses(addressRes.data.data || []);
        form.setFieldsValue({
          fullName: profileRes.data.data.fullName,
          email: profileRes.data.data.email,
          phone: profileRes.data.data.phone
        });
      } catch (error) {
        notification.error({ title: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [form]);

  const handleAvatarUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingAvatar(true);
      const response = await api.post("/upload/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const avatarPath = response.data.data.path;
      await api.put("/user/profile", { avatar: avatarPath });
      setProfile((prev) => ({ ...prev, avatar: avatarPath }));
      setAvatarPreview(getAvatarUrl(avatarPath));
      refreshProfile();
      notification.success({ title: "Avatar uploaded" });
      onSuccess(null, file);
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
      onError(error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (values) => {
    try {
      const response = await api.put("/user/profile", values);
      setProfile(response.data.data);
      refreshProfile();
      notification.success({ title: "Profile updated" });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  const addAddress = async (values) => {
    try {
      const response = await api.post("/user/address", values);
      setAddresses((prev) => [...prev, response.data.data]);
      setAddressModalVisible(false);
      addressForm.resetFields();
      notification.success({ title: "Address added" });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  const removeAddress = async (addressId) => {
    try {
      await api.delete(`/user/address/${addressId}`);
      setAddresses((prev) => prev.filter((address) => address._id !== addressId));
      notification.success({ title: "Address removed" });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      const response = await api.put(`/user/address/default/${addressId}`);
      setAddresses((prev) => prev.map((item) => ({ ...item, isDefault: item._id === addressId })));
      notification.success({ title: "Default address updated" });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  return (
    <div className="page-profile">
      <Title>My profile</Title>
      <Space orientation="vertical" style={{ width: "100%" }} size="large">
        <Card loading={loading} title="Account details">
          {profile && (
            <Form form={form} layout="vertical" onFinish={handleProfileSubmit} initialValues={{ fullName: profile.fullName, email: profile.email, phone: profile.phone }}>
              <Form.Item label="Avatar">
                <Space align="center">
                  <Avatar size={96} src={avatarPreview} icon={<CameraOutlined />} />
                  <Upload
                    name="file"
                    accept="image/*"
                    showUploadList={false}
                    customRequest={handleAvatarUpload}
                  >
                    <Button loading={uploadingAvatar}>Change avatar</Button>
                  </Upload>
                </Space>
              </Form.Item>
              <Form.Item label="Full name" name="fullName" rules={[{ required: true, message: "Enter your full name" }]}> 
                <Input />
              </Form.Item>
              <Form.Item label="Email" name="email">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Phone" name="phone">
                <Input />
              </Form.Item>
              <Button type="primary" htmlType="submit">Update profile</Button>
            </Form>
          )}
        </Card>

        <Card title="My addresses" extra={<Button icon={<PlusOutlined />} onClick={() => setAddressModalVisible(true)}>Add address</Button>}>
          <List
            dataSource={addresses}
            locale={{ emptyText: "No addresses yet" }}
            renderItem={(address) => (
              <List.Item
                actions={[
                  <Button key="default" type={address.isDefault ? "primary" : "default"} onClick={() => setDefaultAddress(address._id)}>{address.isDefault ? "Default" : "Set default"}</Button>,
                  <Button key="delete" danger onClick={() => removeAddress(address._id)}>Delete</Button>
                ]}
              >
                <List.Item.Meta
                  title={address.fullName}
                  description={
                    <>
                      <Text>{address.phone}</Text><br />
                      <Text>{`${address.detailAddress}, ${address.ward}, ${address.district}, ${address.province}`}</Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Space>

      <Modal
        title="Add shipping address"
        open={addressModalVisible}
        onCancel={() => setAddressModalVisible(false)}
        footer={null}
      >
        <Form form={addressForm} layout="vertical" onFinish={addAddress}>
          <Form.Item name="fullName" label="Full name" rules={[{ required: true, message: "Enter the recipient name" }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Enter the phone number" }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="province" label="Province" rules={[{ required: true, message: "Enter the province" }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="district" label="District" rules={[{ required: true, message: "Enter the district" }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="ward" label="Ward" rules={[{ required: true, message: "Enter the ward" }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="detailAddress" label="Detail address" rules={[{ required: true, message: "Enter the detail address" }]}> 
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Save address</Button>
              <Button onClick={() => setAddressModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
