import { useEffect, useMemo, useState } from "react";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, Upload, notification, Spin } from "antd";
import api, { getErrorMessage } from "../util/api";
import { slugifyText } from "../util/slugify";

const { Title, Text } = Typography;
const { Option } = Select;

const statusColor = {
  active: "green",
  hidden: "default"
};

export default function AdminProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productImages, setProductImages] = useState([]);
  const [imageFileList, setImageFileList] = useState([]);
  const [variantImageLists, setVariantImageLists] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);

  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productRes, categoryRes, brandRes] = await Promise.all([
        api.get("/product"),
        api.get("/category"),
        api.get("/brand")
      ]);
      setProducts(productRes.data.data || []);
      setCategories(categoryRes.data.data || []);
      setBrands(brandRes.data.data || []);
    } catch (error) {
      notification.error({
        message: "Không thể tải dữ liệu sản phẩm",
        description: getErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getBackendUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    return `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8080"}/${filePath}`;
  };

  const openProductModal = (product = null) => {
    setCurrentProduct(product);
    setModalOpen(true);
    const existingImages = product?.images || [];
    setProductImages(existingImages);
    setImageFileList(
      existingImages.map((imagePath, index) => ({
        uid: `existing-${index}`,
        name: `Image ${index + 1}`,
        status: "done",
        url: getBackendUrl(imagePath),
        thumbUrl: getBackendUrl(imagePath),
        path: imagePath
      }))
    );

    setVariantImageLists(
      (product?.variants || []).reduce((acc, variant, index) => {
        acc[index] = {
          fileList: (variant.images || []).map((path, imgIndex) => ({
            uid: `existing-variant-${index}-${imgIndex}`,
            name: `Image ${imgIndex + 1}`,
            status: "done",
            url: getBackendUrl(path),
            thumbUrl: getBackendUrl(path),
            path
          })),
          paths: variant.images || []
        };
        return acc;
      }, {})
    );

    form.setFieldsValue({
      productName: product?.productName || "",
      slug: product?.slug || "",
      description: product?.description || "",
      categoryId: product?.categoryId?._id || product?.categoryId || undefined,
      brandId: product?.brandId?._id || product?.brandId || undefined,
      thumbnail: product?.thumbnail || "",
      status: product?.status || "active",
      variants: product?.variants?.map((variant) => ({
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        attributes: variant.attributes?.map((a) => `${a.key}:${a.value}`).join(", ") || ""
      })) || []
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentProduct(null);
    form.resetFields();
    setProductImages([]);
    setImageFileList([]);
    setVariantImageLists({});
  };

  const handleProductImageUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("files", file);

    try {
      setUploadingImages(true);
      const response = await api.post("/upload/product", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const newPath = response.data.data.paths?.[0];
      if (!newPath) {
        throw new Error("Upload failed");
      }

      const uploadedFile = {
        uid: file.uid,
        name: file.name,
        status: "done",
        url: getBackendUrl(newPath),
        thumbUrl: getBackendUrl(newPath),
        path: newPath
      };

      setImageFileList((prev) => [...prev, uploadedFile]);
      setProductImages((prev) => [...prev, newPath]);
      onSuccess(null, file);
    } catch (error) {
      onError(error);
      notification.error({
        message: "Không thể tải ảnh lên",
        description: getErrorMessage(error)
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveProductImage = (file) => {
    const pathValue = file.path || file.url || file.thumbUrl;
    setImageFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    setProductImages((prev) => prev.filter((path) => path !== pathValue));
  };

  const handleVariantImageUpload = async (variantKey, { file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("files", file);

    try {
      setUploadingImages(true);
      const response = await api.post("/upload/product", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const newPath = response.data.data.paths?.[0];
      if (!newPath) {
        throw new Error("Upload failed");
      }

      setVariantImageLists((prev) => {
        const current = prev[variantKey] || { fileList: [], paths: [] };
        return {
          ...prev,
          [variantKey]: {
            fileList: [
              ...current.fileList,
              {
                uid: file.uid,
                name: file.name,
                status: "done",
                url: getBackendUrl(newPath),
                thumbUrl: getBackendUrl(newPath),
                path: newPath
              }
            ],
            paths: [...current.paths, newPath]
          }
        };
      });

      onSuccess(null, file);
    } catch (error) {
      onError(error);
      notification.error({
        message: "Không thể tải ảnh biến thể lên",
        description: getErrorMessage(error)
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveVariantImage = (variantKey, file) => {
    const pathValue = file.path || file.url || file.thumbUrl;
    setVariantImageLists((prev) => {
      const current = prev[variantKey] || { fileList: [], paths: [] };
      return {
        ...prev,
        [variantKey]: {
          fileList: current.fileList.filter((item) => item.uid !== file.uid),
          paths: current.paths.filter((path) => path !== pathValue)
        }
      };
    });
  };

  const getVariantImagePaths = (variantKey) => variantImageLists[variantKey]?.paths || [];

  const handleSaveProduct = async (values) => {
    setSaving(true);
    try {
      const variants = values.variants?.map((variant, index) => ({
        sku: variant.sku,
        price: Number(variant.price),
        stock: Number(variant.stock) || 0,
        images: getVariantImagePaths(index),
        attributes: variant.attributes
          ? variant.attributes.split(",").map((item) => {
              const [key, value] = item.split(":").map((valuePart) => valuePart.trim());
              return key && value ? { key, value } : null;
            }).filter(Boolean)
          : []
      })) || [];

      const payload = {
        ...values,
        slug: values.slug || slugifyText(values.productName),
        images: productImages,
        variants
      };

      if (currentProduct) {
        await api.put(`/product/${currentProduct._id}`, payload);
        notification.success({ message: "Cập nhật sản phẩm thành công" });
      } else {
        await api.post("/product", payload);
        notification.success({ message: "Tạo sản phẩm thành công" });
      }
      await fetchData();
      closeModal();
    } catch (error) {
      notification.error({
        message: "Không thể lưu sản phẩm",
        description: getErrorMessage(error)
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    try {
      await api.delete(`/product/${product._id}`);
      notification.success({ message: "Xóa sản phẩm thành công" });
      await fetchData();
    } catch (error) {
      notification.error({
        message: "Không thể xóa sản phẩm",
        description: getErrorMessage(error)
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Tên sản phẩm",
        dataIndex: "productName",
        key: "productName"
      },
      {
        title: "Danh mục",
        dataIndex: ["categoryId", "categoryName"],
        key: "category",
        render: (value, record) => record.categoryId?.categoryName || record.categoryId || "-"
      },
      {
        title: "Thương hiệu",
        dataIndex: ["brandId", "brandName"],
        key: "brand",
        render: (value, record) => record.brandId?.brandName || record.brandId || "-"
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => <Tag color={statusColor[status] || "default"}>{status}</Tag>
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => date ? new Date(date).toLocaleDateString() : "-"
      },
      {
        title: "Hành động",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => openProductModal(record)}>
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
    <div className="page-admin-products">
      <div className="page-title-row">
        <Title level={2}>Product Management</Title>
        <Button type="primary" onClick={() => openProductModal()}>
          New Product
        </Button>
      </div>

      <Card>
        <Text type="secondary">Quản lý sản phẩm: xem, tạo, cập nhật và xóa sản phẩm.</Text>
      </Card>

      <Card style={{ marginTop: 24 }}>
        {loading ? (
          <div className="page-loading">
            <Spin tip="Loading products..." />
          </div>
        ) : (
          <Table
            rowKey={(item) => item._id}
            dataSource={products}
            columns={columns}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "No products available" }}
          />
        )}
      </Card>

      <Modal
        title={currentProduct ? "Edit product" : "New product"}
        open={modalOpen}
        onCancel={closeModal}
        okText="Save"
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={680}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveProduct}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productName"
                label="Product Name"
                rules={[{ required: true, message: "Please enter product name" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="slug" label="Slug">
                <Input placeholder="Optional, auto-generated from name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Category"
                rules={[{ required: true, message: "Please select a category" }]}
              >
                <Select placeholder="Select category">
                  {categories.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.categoryName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="brandId"
                label="Brand"
                rules={[{ required: true, message: "Please select a brand" }]}
              >
                <Select placeholder="Select brand">
                  {brands.map((brand) => (
                    <Option key={brand._id} value={brand._id}>
                      {brand.brandName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Product images">
            <Upload
              multiple
              accept="image/*"
              customRequest={handleProductImageUpload}
              fileList={imageFileList}
              listType="picture-card"
              onRemove={handleRemoveProductImage}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
            <Text type="secondary">Upload product photos from disk. Images will be saved to uploads/product.</Text>
          </Form.Item>

          <Form.Item name="thumbnail" label="Thumbnail URL">
            <Input />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Option value="active">active</Option>
              <Option value="hidden">hidden</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item label="Variants">
            <Form.List name="variants">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => {
                    const variantFileList = variantImageLists[field.name]?.fileList || [];
                    return (
                      <Space key={field.key} direction="vertical" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <Space align="baseline" wrap style={{ display: "flex", gap: 8 }}>
                          <Form.Item
                            {...field}
                            name={[field.name, "sku"]}
                            fieldKey={[field.fieldKey, "sku"]}
                            rules={[{ required: true, message: "SKU is required" }]}
                          >
                            <Input placeholder="SKU" />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "price"]}
                            fieldKey={[field.fieldKey, "price"]}
                            rules={[{ required: true, message: "Price is required" }]}
                          >
                            <InputNumber placeholder="Price" min={0} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "stock"]}
                            fieldKey={[field.fieldKey, "stock"]}
                          >
                            <InputNumber placeholder="Stock" min={0} />
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, "attributes"]}
                            fieldKey={[field.fieldKey, "attributes"]}
                          >
                            <Input placeholder="Attributes e.g. size:S, color:Red" />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(field.name)} />
                        </Space>
                        <Form.Item label="Variant images">
                          <Upload
                            multiple
                            accept="image/*"
                            customRequest={(options) => handleVariantImageUpload(field.name, options)}
                            fileList={variantFileList}
                            listType="picture-card"
                            onRemove={(file) => handleRemoveVariantImage(field.name, file)}
                          >
                            <div>
                              <PlusOutlined />
                              <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                          </Upload>
                        </Form.Item>
                      </Space>
                    );
                  })}
                  <Form.Item>
                    <Button type="dashed" block onClick={() => add()} icon={<PlusOutlined />}>
                      Add variant
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
