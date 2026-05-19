import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Divider, Form, Input, List, Radio, Select, Space, Typography, notification } from "antd";
import api, { getErrorMessage } from "../util/api";
import { useAuth } from "../components/context/AuthContext";

const { Title, Text } = Typography;

export default function CheckoutPage() {
  const { user } = useAuth();
  const normalizedRole = String(user?.role || "").toLowerCase();
  const isCustomer = normalizedRole === "customer";
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [couponInfo, setCouponInfo] = useState(null);
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
      if (!isCustomer) {
        return;
      }
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
  }, [isCustomer]);

  // Tính lại finalAmount khi cart hoặc couponInfo thay đổi
  useEffect(() => {
    if (couponInfo && cart.totalPrice) {
      setDiscountAmount(couponInfo.discountAmount || 0);
      setFinalAmount((cart.totalPrice || 0) - (couponInfo.discountAmount || 0));
    } else {
      setDiscountAmount(0);
      setFinalAmount(cart.totalPrice || 0);
    }
  }, [couponInfo, cart]);

  if (!isCustomer) {
    return (
      <div className="page-checkout">
        <Title>Checkout</Title>
        <Card>
          <Alert
            message="Checkout is only available for customers"
            description="Please use a customer account when placing an order. Admin and staff users can manage orders from the admin dashboard."
            type="info"
            showIcon
          />
        </Card>
      </div>
    );
  }

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

      const res = await api.post("/order/checkout", { shippingAddress, paymentMethod, couponCode: couponCode.trim() });
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

  // Hàm kiểm tra coupon
  const handleCheckCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponInfo(null);
      notification.warning({ message: "Vui lòng nhập mã giảm giá." });
      return;
    }
    try {
      const res = await api.get(`/coupon/validate/${couponCode.trim()}`);
      const coupon = res.data.data;
      // Tính discountAmount dựa trên loại coupon
      let discount = 0;
      if (coupon.discountType === "percent") {
        discount = Math.round((cart.totalPrice * coupon.discountValue) / 100);
      } else if (coupon.discountType === "fixed") {
        discount = Math.min(coupon.discountValue, cart.totalPrice);
      }
      setCouponInfo({ ...coupon, discountAmount: discount });
      notification.success({ message: `Áp dụng mã thành công! Giảm ${discount.toLocaleString()}đ` });
    } catch (error) {
      setCouponInfo(null);
      notification.error({ message: getErrorMessage(error) });
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
          <div style={{ margin: '16px 0' }}>
            <Input
              placeholder="Nhập mã giảm giá"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              style={{ width: 200, marginRight: 8 }}
              onPressEnter={handleCheckCoupon}
              maxLength={32}
            />
            <Button onClick={handleCheckCoupon} disabled={!couponCode.trim()}>Áp dụng</Button>
          </div>
          {couponInfo && (
            <div style={{ color: 'green', marginBottom: 8 }}>
              Đã áp dụng mã: <b>{couponInfo.code}</b> - Giảm {Intl.NumberFormat("vi-VN").format(couponInfo.discountAmount)}đ
            </div>
          )}
          <div className="checkout-total">
            <Text type="secondary">Tạm tính</Text>
            <Title level={5}>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cart.totalPrice || 0)}</Title>
            {discountAmount > 0 && (
              <>
                <Text type="secondary">Giảm giá</Text>
                <Title level={5} style={{ color: 'green' }}>- {Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(discountAmount)}</Title>
              </>
            )}
            <Text type="secondary">Tổng thanh toán</Text>
            <Title level={4}>{Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(finalAmount)}</Title>
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
