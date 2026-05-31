import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Modal, Space, Table, Typography, Spin } from "antd";
import api, { getErrorMessage } from "../util/api";
import { notification } from "../util/feedback";

const { Title } = Typography;

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [form] = Form.useForm();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/category");
      setCategories(response.data.data || []);
    } catch (error) {
      notification.error({
        message: "Không thể tải danh mục",
        description: getErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModal = useCallback((category = null) => {
    setCurrentCategory(category);
    setModalOpen(true);
    form.setFieldsValue({ categoryName: category?.categoryName || "" });
  }, [form]);

  const closeModal = () => {
    setModalOpen(false);
    setCurrentCategory(null);
    form.resetFields();
  };

  const handleSaveCategory = async (values) => {
    setSaving(true);
    try {
      if (currentCategory) {
        await api.put(`/category/${currentCategory._id}`, values);
        notification.success({ message: "Cập nhật danh mục thành công" });
      } else {
        await api.post("/category", values);
        notification.success({ message: "Tạo danh mục thành công" });
      }
      await fetchCategories();
      closeModal();
    } catch (error) {
      notification.error({
        message: "Không thể lưu danh mục",
        description: getErrorMessage(error)
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(async (category) => {
    try {
      await api.delete(`/category/${category._id}`);
      notification.success({ message: "Xóa danh mục thành công" });
      await fetchCategories();
    } catch (error) {
      notification.error({
        message: "Không thể xóa danh mục",
        description: getErrorMessage(error)
      });
    }
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter((category) =>
      category.categoryName?.toLowerCase().includes(keyword)
    );
  }, [categories, searchKeyword]);

  const columns = useMemo(
    () => [
      {
        title: "Category Name",
        dataIndex: "categoryName",
        key: "categoryName"
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
    [handleDelete, openModal]
  );

  return (
    <div className="page-admin-categories">
      <div className="page-title-row">
        <Title level={2}>Category Management</Title>
        <Button type="primary" onClick={() => openModal()}>
          New Category
        </Button>
      </div>

      <Card>
        <p>Quản lý danh mục sản phẩm: tạo, chỉnh sửa và xóa danh mục.</p>
      </Card>

      <div className="page-title-row" style={{ marginTop: 24, gap: 12, alignItems: "center" }}>
        <Input.Search
          placeholder="Search categories by name"
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
          <div className="page-loading">
            <Spin tip="Loading categories..." />
          </div>
        ) : (
          <Table
            rowKey={(item) => item._id}
            dataSource={filteredCategories}
            columns={columns}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: searchKeyword ? "No matching categories" : "No categories found" }}
          />
        )}
      </Card>

      <Modal
        title={currentCategory ? "Edit category" : "New category"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Save"
      >
        <Form form={form} layout="vertical" onFinish={handleSaveCategory}>
          <Form.Item
            label="Category Name"
            name="categoryName"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
