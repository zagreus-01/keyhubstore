import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Divider, Form, Input, List, Radio, Select, Space, Typography, notification } from "antd";
import api, { getErrorMessage } from "../util/api";

const { Title, Text } = Typography;

export default function CheckoutPage() {
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [addresses, setAddresses] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [qrPayload, setQrPayload] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartRes, addressRes] = await Promise.all([api.get("/cart"), api.get("/user/address")]);
        setCart(cartRes.data.data);
        setAddresses(addressRes.data.data || []);
        if (addressRes.data.data?.length) {
          setSelectedAddressId(addressRes.data.data.find((item) => item.isDefault)?._id || addressRes.data.data[0]._id);
        }
      } catch (error) {
        notification.error({ title: getErrorMessage(error) });
      }
    };
    fetchData();
  }, []);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item._id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const hasSavedAddress = Boolean(selectedAddress);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const shippingAddress = hasSavedAddress
        ? {
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            address: `${selectedAddress.detailAddress}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`
          }
        : {
            fullName: values.fullName,
            phone: values.phone,
            address: `${values.detailAddress}, ${values.ward}, ${values.district}, ${values.province}`
          };

      const res = await api.post("/order/checkout", { shippingAddress, paymentMethod });
      const order = res.data.data;
      notification.success({ title: "Order placed successfully" });
      if (paymentMethod === "VNPAY") {
        try {
          const qrRes = await api.get(`/order/${order._id}/qr`);
          setQrPayload(qrRes.data.data.qrPayload);
          setShowQrModal(true);
        } catch (err) {
          // fallback: construct a local QR payload so user can still scan
          notification.warning({ message: "QR backend unavailable, showing local QR fallback" });
          try {
            const fallback = `QR_PAY|order:${order._id}|amount:${order.finalAmount}`;
            setQrPayload(fallback);
            setShowQrModal(true);
          } catch (e) {
            notification.error({ title: "Không thể tạo QR", description: getErrorMessage(err) });
            navigate("/orders");
          }
        }
      } else {
        navigate("/orders");
      }
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-checkout">
      <Title>Checkout</Title>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <Card title="Order summary">
          <List
            dataSource={cart.items}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.variantId?.productId?.productName}
                  description={`Qty: ${item.quantity} • ${item.variantId?.sku || "Variant"}`}
                />
                <Text strong>
                  {Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format((item.variantId?.price || 0) * item.quantity)}
                </Text>
              </List.Item>
            )}
            locale={{ emptyText: "Cart is empty" }}
          />
          <div className="checkout-total">
            <Text type="secondary">Total</Text>
            <Title level={4}>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cart.totalPrice || 0)}</Title>
          </div>
        </Card>

        <Card title="Shipping address">
          {addresses.length > 0 ? (
            <Form layout="vertical" onFinish={handleFinish} initialValues={{ paymentMethod }}>
              <Form.Item label="Choose saved address">
                <Select value={selectedAddressId} onChange={setSelectedAddressId} options={addresses.map((item) => ({ value: item._id, label: `${item.fullName} - ${item.phone}` }))} />
              </Form.Item>
              {selectedAddress && (
                <Card type="inner" variant="outlined">
                  <Text strong>{selectedAddress.fullName}</Text>
                  <div>{selectedAddress.phone}</div>
                  <div>{`${selectedAddress.detailAddress}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`}</div>
                </Card>
              )}
              <Divider>Or enter a new shipping address</Divider>
              <Form.Item label="Full name" name="fullName" rules={hasSavedAddress ? [] : [{ required: true, message: "Enter full name" }]}> 
                <Input placeholder="Name" />
              </Form.Item>
              <Form.Item label="Phone" name="phone" rules={hasSavedAddress ? [] : [{ required: true, message: "Enter phone number" }]}> 
                <Input placeholder="Phone" />
              </Form.Item>
              <Form.Item label="Province" name="province" rules={hasSavedAddress ? [] : [{ required: true, message: "Enter province" }]}> 
                <Input placeholder="Province" />
              </Form.Item>
              <Form.Item label="District" name="district" rules={hasSavedAddress ? [] : [{ required: true, message: "Enter district" }]}> 
                <Input placeholder="District" />
              </Form.Item>
              <Form.Item label="Ward" name="ward" rules={hasSavedAddress ? [] : [{ required: true, message: "Enter ward" }]}> 
                <Input placeholder="Ward" />
              </Form.Item>
              <Form.Item label="Detail address" name="detailAddress" rules={hasSavedAddress ? [] : [{ required: true, message: "Enter detail address" }]}> 
                <Input placeholder="Street, apartment, building..." />
              </Form.Item>
              <Form.Item label="Payment method" name="paymentMethod" initialValue={paymentMethod}>
                <Radio.Group onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
                  <Radio value="COD">Cash on delivery</Radio>
                  <Radio value="VNPAY">VNPAY</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} disabled={!cart.items.length}>Place order</Button>
                {showQrModal && qrPayload && (
                  <div style={{ marginTop: 16, textAlign: "center" }}>
                    <p>Scan this QR to pay:</p>
                    <img alt="qr" src={`https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(qrPayload)}`} />
                    <div style={{ marginTop: 8 }}>
                      <Button onClick={() => { setShowQrModal(false); navigate('/orders'); }}>I have paid</Button>
                    </div>
                    <div style={{ marginTop: 8, wordBreak: 'break-all' }}>
                      <Text type="secondary">Debug payload:</Text>
                      <div><Text code>{qrPayload}</Text></div>
                    </div>
                  </div>
                )}
              </Form.Item>
            </Form>
          ) : (
            <Alert message="No saved address found. Please add an address in your profile or fill in the form below." type="info" />
          )}
        </Card>
      </Space>
    </div>
  );
}
