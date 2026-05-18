import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Divider, InputNumber, notification, Row, Space, Table, Typography } from "antd";
import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import api, { getErrorMessage } from "../util/api";

const { Title, Text } = Typography;

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const response = await api.get("/cart");
        setCart(response.data.data);
      } catch (error) {
        notification.error({ title: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const updateQuantity = async (variantId, quantity) => {
    try {
      const response = await api.put("/cart/update", { variantId, quantity });
      setCart(response.data.data);
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
  };

  const removeItem = async (variantId) => {
    try {
      const response = await api.delete(`/cart/remove/${variantId}`);
      setCart(response.data.data);
      notification.success({ title: "Item removed" });
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    }
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
