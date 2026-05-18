import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Modal, Space, Table, Typography, notification, Spin } from "antd";
import api, { getErrorMessage } from "../util/api";

const { Title } = Typography;

export default function AdminBrandPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await api.get("/brand");
      setBrands(response.data.data || []);
    } catch (error) {
      notification.error({
        message: "Không thể tải thương hiệu",
        description: getErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openModal = (brand = null) => {
    setCurrentBrand(brand);
    setModalOpen(true);
    form.setFieldsValue({ brandName: brand?.brandName || "" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentBrand(null);
    form.resetFields();
  };

  const handleSaveBrand = async (values) => {
    setSaving(true);
    try {
      if (currentBrand) {
        await api.put(`/brand/${currentBrand._id}`, values);
        notification.success({ message: "Cập nhật thương hiệu thành công" });
      } else {
        await api.post("/brand", values);
        notification.success({ message: "Tạo thương hiệu thành công" });
      }
      await fetchBrands();
      closeModal();
    } catch (error) {
      notification.error({
        message: "Không thể lưu thương hiệu",
        description: getErrorMessage(error)
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand) => {
    try {
      await api.delete(`/brand/${brand._id}`);
      notification.success({ message: "Xóa thương hiệu thành công" });
      await fetchBrands();
    } catch (error) {
      notification.error({
        message: "Không thể xóa thương hiệu",
        description: getErrorMessage(error)
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Brand Name",
        dataIndex: "brandName",
        key: "brandName"
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => (value ? new Date(value).toLocaleDateString() : "-")
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => openModal(record)}>
              Edit
            </Button>
            <Button danger type="text" onClick={() => handleDelete(record)}>
              Delete
            </Button>
          </Space>
        )
      }
    ],
    []
  );

  return (
    <div className="page-admin-brands">
      <div className="page-title-row">
        <Title level={2}>Brand Management</Title>
        <Button type="primary" onClick={() => openModal()}>
          New Brand
        </Button>
      </div>

      <Card>
        <p>Quản lý thương hiệu sản phẩm: tạo, chỉnh sửa và xóa thương hiệu.</p>
      </Card>

      <Card style={{ marginTop: 24 }}>
        {loading ? (
          <div className="page-loading">
            <Spin tip="Loading brands..." />
          </div>
        ) : (
          <Table
            rowKey={(item) => item._id}
            dataSource={brands}
            columns={columns}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "No brands found" }}
          />
        )}
      </Card>

      <Modal
        title={currentBrand ? "Edit brand" : "New brand"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleSaveBrand}>
          <Form.Item
            label="Brand Name"
            name="brandName"
            rules={[{ required: true, message: "Please enter brand name" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
