import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Divider, InputNumber, Row, Space, Table, Typography } from "antd";
import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import useAuth from "../components/context/useAuth";
import useCart from "../components/context/useCart";

const { Title, Text } = Typography;

export default function CartPage() {
  const { user } = useAuth();
  const normalizedRole = String(user?.role || "").toLowerCase();
  const isCustomer = normalizedRole === "customer";
  const { cart, fetchCart, loading, removeCartItem, updateCartQuantity } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (isCustomer) {
      fetchCart();
    }
  }, [fetchCart, isCustomer]);

  const updateQuantity = async (variantId, quantity) => {
    await updateCartQuantity(variantId, quantity);
  };

  const removeItem = async (variantId) => {
    await removeCartItem(variantId);
  };

  const columns = [
    {
      title: "Product",
      dataIndex: ["variantId", "productId"],
      key: "product",
      render: (_, record) => (
        <Space orientation="vertical">
          <Text strong>{record.variantId?.productId?.productName || "Unknown product"}</Text>
          <Text type="secondary">SKU: {record.variantId?.sku || "n/a"}</Text>
        </Space>
      )
    },
    {
      title: "Price",
      dataIndex: ["variantId", "price"],
      key: "price",
      render: (price) => <Text>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)}</Text>
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => (
        <InputNumber min={1} max={record.variantId?.stock || 999} value={quantity} onChange={(value) => updateQuantity(record.variantId._id, value)} />
      )
    },
    {
      title: "Total",
      key: "total",
      render: (_, record) => (
        <Text>
          {Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(record.variantId?.price * record.quantity || 0)}
        </Text>
      )
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(record.variantId._id)}>
          Remove
        </Button>
      )
    }
  ];

  const totalLabel = useMemo(
    () => Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cart.totalPrice || 0),
    [cart.totalPrice]
  );

  if (!isCustomer) {
    return (
      <div className="page-cart">
        <Title>Shopping cart</Title>
        <Card>
          <Alert
            message="Cart is only available for customers"
            description="As an admin or staff user, you can manage orders from the admin dashboard. Browse products freely, but checkout is reserved for customers."
            type="info"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="page-cart">
      <Title>Shopping cart</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card loading={loading} title="Cart items">
            <Table
              rowKey={(record) => record.variantId?._id || record._id}
              dataSource={cart.items}
              columns={columns}
              pagination={false}
              locale={{ emptyText: "Your cart is empty" }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Order summary" variant="outlined">
            <Space orientation="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Text type="secondary">Sub total</Text>
                <div className="summary-price">{totalLabel}</div>
              </div>
              <Button type="primary" block icon={<ShoppingCartOutlined />} disabled={!cart.items.length} onClick={() => navigate("/checkout")}>Proceed to checkout</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
