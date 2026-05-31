import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, Typography, Select, DatePicker, Spin } from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import api, { getErrorMessage } from "../util/api";
import { notification } from "../util/feedback";

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminCouponPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);

  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(false);

  const [discountType, setDiscountType] = useState("percent");
  const [applyTo, setApplyTo] = useState("all");

  const [form] = Form.useForm();

  useEffect(() => {
    fetchCoupons();
    fetchOptions();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);

      const response = await api.get("/coupon");

      setCoupons(response.data?.data || []);
    } catch (error) {
      notification.error({
        message: "Fetch coupons failed",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);

      const [productRes, categoryRes, brandRes] = await Promise.all([
        api.get("/product"),
        api.get("/category"),
        api.get("/brand"),
      ]);

      setProducts(productRes.data?.data || []);
      setCategories(categoryRes.data?.data || []);
      setBrands(brandRes.data?.data || []);
    } catch (error) {
      notification.error({
        message: "Không thể tải dữ liệu",
        description: getErrorMessage(error),
      });
    } finally {
      setLoadingOptions(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentCoupon(null);
    form.resetFields();

    setDiscountType("percent");
    setApplyTo("all");
  };

  const openModal = (coupon = null) => {
    setCurrentCoupon(coupon);
    setModalOpen(true);

    const type = coupon?.discountType || "percent";
    const scope = coupon?.applyTo || "all";

    setDiscountType(type);
    setApplyTo(scope);

    if (coupon) {
      form.setFieldsValue({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applyTo: coupon.applyTo,
        targetId: coupon.targetId || [],
        startAt: coupon.startAt ? dayjs(coupon.startAt) : null,
        expiredAt: coupon.expiredAt ? dayjs(coupon.expiredAt) : null,
      });
    } else {
      form.resetFields();
    }
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);

      const payload = {
        code: values.code,
        discountType: values.discountType,
        discountValue: values.discountValue,
        applyTo: values.applyTo,
        targetId: values.targetId || [],
        startAt: values.startAt
          ? values.startAt.toISOString()
          : undefined,
        expiredAt: values.expiredAt
          ? values.expiredAt.toISOString()
          : undefined,
      };

      if (currentCoupon) {
        await api.put(`/coupon/${currentCoupon._id}`, payload);

        notification.success({
          message: "Coupon updated",
        });
      } else {
        await api.post("/coupon", payload);

        notification.success({
          message: "Coupon created",
        });
      }

      fetchCoupons();
      closeModal();
    } catch (error) {
      notification.error({
        message: "Save failed",
        description: getErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    Modal.confirm({
      title: "Delete coupon",
      content: `Delete ${coupon.code}?`,
      okType: "danger",

      onOk: async () => {
        try {
          await api.delete(`/coupon/${coupon._id}`);

          notification.success({
            message: "Coupon deleted",
          });

          fetchCoupons();
        } catch (error) {
          notification.error({
            message: "Delete failed",
            description: getErrorMessage(error),
          });
        }
      },
    });
  };

  const filteredCoupons = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return coupons;

    return coupons.filter((coupon) =>
      coupon.code?.toLowerCase().includes(keyword)
    );
  }, [coupons, searchKeyword]);

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
    },
    {
      title: "Discount",
      render: (_, record) =>
        record.discountType === "percent"
          ? `${record.discountValue}%`
          : `${record.discountValue} VNĐ`,
    },
    {
      title: "Expires",
      dataIndex: "expiredAt",
      render: (value) =>
        value ? new Date(value).toLocaleDateString() : "—",
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            Edit
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <Card>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            Add Coupon
          </Button>

          <Input
            placeholder="Search coupon"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
        </Space>

        <Table
          style={{ marginTop: 16 }}
          rowKey="_id"
          columns={columns}
          dataSource={filteredCoupons}
          loading={loading}
        />
      </Card>

      <Modal
        title={currentCoupon ? "Edit Coupon" : "Create Coupon"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saving}
      >
        <Spin spinning={loadingOptions}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              discountType: "percent",
              applyTo: "all",
            }}
          >
            <Form.Item
              label="Coupon Code"
              name="code"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Discount Type"
              name="discountType"
              rules={[{ required: true }]}
            >
              <Select onChange={(val) => setDiscountType(val)}>
                <Option value="percent">%</Option>
                <Option value="fixed">VNĐ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Discount Value"
              name="discountValue"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                max={discountType === "percent" ? 100 : undefined}
                style={{ width: "100%" }}
                addonAfter={
                  discountType === "percent" ? "%" : "VNĐ"
                }
              />
            </Form.Item>

            <Form.Item
              label="Apply To"
              name="applyTo"
              rules={[{ required: true }]}
            >
              <Select
                onChange={(val) => {
                  setApplyTo(val);
                  form.setFieldsValue({ targetId: [] });
                }}
              >
                <Option value="all">All</Option>
                <Option value="product">Product</Option>
                <Option value="category">Category</Option>
                <Option value="brand">Brand</Option>
              </Select>
            </Form.Item>

            {applyTo === "product" && (
              <Form.Item
                label="Products"
                name="targetId"
                rules={[{ required: true }]}
              >
                <Select mode="multiple">
                  {products.map((p) => (
                    <Option key={p._id} value={p._id}>
                      {p.productName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {applyTo === "category" && (
              <Form.Item
                label="Categories"
                name="targetId"
                rules={[{ required: true }]}
              >
                <Select mode="multiple">
                  {categories.map((c) => (
                    <Option key={c._id} value={c._id}>
                      {c.categoryName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {applyTo === "brand" && (
              <Form.Item
                label="Brands"
                name="targetId"
                rules={[{ required: true }]}
              >
                <Select mode="multiple">
                  {brands.map((b) => (
                    <Option key={b._id} value={b._id}>
                      {b.brandName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item label="Start Date" name="startAt">
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item label="Expired Date" name="expiredAt">
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}