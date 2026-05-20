import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  List,
  Radio,
  Select,
  Space,
  Typography,
  notification,
  Modal,
  Tag
} from "antd";

import api, { getErrorMessage } from "../util/api";
import { useAuth } from "../components/context/AuthContext";

const { Title, Text } = Typography;

export default function CheckoutPage() {
  const { user } = useAuth();

  const normalizedRole = String(user?.role || "").toLowerCase();
  const isCustomer = normalizedRole === "customer";

  const [cart, setCart] = useState({
    items: [],
    totalPrice: 0
  });

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [couponInfo, setCouponInfo] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [qrPayload, setQrPayload] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [activeCoupons, setActiveCoupons] = useState([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!isCustomer) return;

      try {
        const [cartRes, addressRes, couponsRes] = await Promise.all([
          api.get("/cart"),
          api.get("/user/address"),
          api.get("/coupon/active")
        ]);

        setCart(cartRes.data.data);

        setAddresses(addressRes.data.data || []);

        if (addressRes.data.data?.length) {
          setSelectedAddressId(
            addressRes.data.data.find((item) => item.isDefault)?._id ||
              addressRes.data.data[0]._id
          );
        }

        setActiveCoupons(couponsRes.data.data || []);
      } catch (error) {
        notification.error({
          message: getErrorMessage(error)
        });
      }
    };

    fetchData();
  }, [isCustomer]);

  useEffect(() => {
    if (couponInfo && cart.totalPrice) {
      setDiscountAmount(couponInfo.discountAmount || 0);

      setFinalAmount(
        (cart.totalPrice || 0) - (couponInfo.discountAmount || 0)
      );
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
            description="Please use a customer account."
            type="info"
            showIcon
          />
        </Card>
      </div>
    );
  }

  const selectedAddress = useMemo(
    () =>
      addresses.find((item) => item._id === selectedAddressId) || null,
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

      const res = await api.post("/order/checkout", {
        shippingAddress,
        paymentMethod,
        couponCode: couponCode.trim()
      });

      const order = res.data.data;

      notification.success({
        message: "Order placed successfully"
      });

      if (paymentMethod === "VNPAY") {
        try {
          const qrRes = await api.get(`/order/${order._id}/qr`);

          setQrPayload(qrRes.data.data.qrPayload);

          setShowQrModal(true);
        } catch (err) {
          notification.warning({
            message:
              "QR backend unavailable, showing local QR fallback"
          });

          try {
            const fallback = `QR_PAY|order:${order._id}|amount:${order.finalAmount}`;

            setQrPayload(fallback);

            setShowQrModal(true);
          } catch (e) {
            notification.error({
              message: "Không thể tạo QR",
              description: getErrorMessage(err)
            });

            navigate("/orders");
          }
        }
      } else {
        navigate("/orders");
      }
    } catch (error) {
      notification.error({
        message: getErrorMessage(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCoupon = async (
    codeToApply = couponCode
  ) => {
    if (!codeToApply.trim()) {
      setCouponInfo(null);

      notification.warning({
        message: "Vui lòng nhập mã giảm giá."
      });

      return;
    }

    try {
      const res = await api.get(
        `/coupon/validate/${codeToApply.trim()}`
      );

      const coupon = res.data.data;

      let eligibleItems = [];

      if (
        !coupon.applyTo ||
        coupon.applyTo.includes("all") ||
        coupon.applyTo === "all"
      ) {
        eligibleItems = cart.items;
      } else if (
        coupon.applyTo.includes("product") ||
        coupon.applyTo === "product"
      ) {
        eligibleItems = cart.items.filter(
          (item) =>
            coupon.targetId &&
            coupon.targetId.includes(
              String(
                item.variantId?.productId?._id ||
                  item.variantId?.productId
              )
            )
        );
      } else if (
        coupon.applyTo.includes("category") ||
        coupon.applyTo === "category"
      ) {
        eligibleItems = cart.items.filter(
          (item) =>
            coupon.targetId &&
            coupon.targetId.includes(
              String(
                item.variantId?.productId?.categoryId
              )
            )
        );
      } else if (
        coupon.applyTo.includes("brand") ||
        coupon.applyTo === "brand"
      ) {
        eligibleItems = cart.items.filter(
          (item) =>
            coupon.targetId &&
            coupon.targetId.includes(
              String(item.variantId?.productId?.brandId)
            )
        );
      }

      if (!eligibleItems.length) {
        setCouponInfo(null);

        notification.error({
          message:
            "Mã giảm giá không áp dụng cho sản phẩm nào trong giỏ hàng."
        });

        return;
      }

      const eligibleAmount = eligibleItems.reduce(
        (sum, item) =>
          sum +
          (item.variantId?.price || 0) * item.quantity,
        0
      );

      let discount = 0;

      if (coupon.discountType === "percent") {
        discount = Math.round(
          (eligibleAmount * coupon.discountValue) / 100
        );
      } else if (coupon.discountType === "fixed") {
        discount = Math.min(
          coupon.discountValue,
          eligibleAmount
        );
      }

      setCouponInfo({
        ...coupon,
        discountAmount: discount
      });

      if (codeToApply !== couponCode) {
        setCouponCode(codeToApply);
      }

      notification.success({
        message: `Áp dụng mã thành công! Giảm ${discount.toLocaleString()}đ`
      });
    } catch (error) {
      setCouponInfo(null);

      notification.error({
        message: getErrorMessage(error)
      });
    }
  };

  return (
    <div className="page-checkout">
      <Title>Checkout</Title>

      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%" }}
      >
        <Card title="Order summary">
          <List
            dataSource={cart.items}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    item.variantId?.productId?.productName
                  }
                  description={`Qty: ${item.quantity} • ${
                    item.variantId?.sku || "Variant"
                  }`}
                />

                <Text strong>
                  {Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND"
                  }).format(
                    (item.variantId?.price || 0) *
                      item.quantity
                  )}
                </Text>
              </List.Item>
            )}
            locale={{
              emptyText: "Cart is empty"
            }}
          />

          <div
            style={{
              margin: "16px 0",
              display: "flex",
              alignItems: "center"
            }}
          >
            <Input
              placeholder="Nhập mã giảm giá"
              value={couponCode}
              onChange={(e) =>
                setCouponCode(e.target.value)
              }
              style={{
                width: 200,
                marginRight: 8
              }}
              onPressEnter={() =>
                handleCheckCoupon(couponCode)
              }
              maxLength={32}
            />

            <Button
              onClick={() =>
                handleCheckCoupon(couponCode)
              }
              disabled={!couponCode.trim()}
              style={{ marginRight: 8 }}
            >
              Áp dụng
            </Button>

            <Button
              type="dashed"
              onClick={() =>
                setIsCouponModalOpen(true)
              }
            >
              Chọn mã
            </Button>
          </div>

          {couponInfo && (
            <div
              style={{
                color: "green",
                marginBottom: 8
              }}
            >
              Đã áp dụng mã: <b>{couponInfo.code}</b> -
              Giảm{" "}
              {Intl.NumberFormat("vi-VN").format(
                couponInfo.discountAmount
              )}
              đ
            </div>
          )}

          <div className="checkout-total">
            <Text type="secondary">Tạm tính</Text>

            <Title level={5}>
              {Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND"
              }).format(cart.totalPrice || 0)}
            </Title>

            {discountAmount > 0 && (
              <>
                <Text type="secondary">
                  Giảm giá
                </Text>

                <Title
                  level={5}
                  style={{ color: "green" }}
                >
                  -
                  {Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND"
                  }).format(discountAmount)}
                </Title>
              </>
            )}

            <Text type="secondary">
              Tổng thanh toán
            </Text>

            <Title level={4}>
              {Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND"
              }).format(finalAmount)}
            </Title>
          </div>
        </Card>

        <Card title="Shipping address">
          {addresses.length > 0 ? (
            <Form
              layout="vertical"
              onFinish={handleFinish}
              initialValues={{ paymentMethod }}
            >
              <Form.Item label="Choose saved address">
                <Select
                  value={selectedAddressId}
                  onChange={setSelectedAddressId}
                  options={addresses.map((item) => ({
                    value: item._id,
                    label: `${item.fullName} - ${item.phone}`
                  }))}
                />
              </Form.Item>

              {selectedAddress &&
                !showNewAddressForm && (
                  <Card type="inner">
                    <Text strong>
                      {selectedAddress.fullName}
                    </Text>

                    <div>
                      {selectedAddress.phone}
                    </div>

                    <div>
                      {`${selectedAddress.detailAddress}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`}
                    </div>
                  </Card>
                )}

              <Button
                type="link"
                onClick={() =>
                  setShowNewAddressForm(
                    !showNewAddressForm
                  )
                }
                style={{ marginBottom: 8 }}
              >
                {showNewAddressForm
                  ? "Ẩn form nhập địa chỉ"
                  : "Nhập địa chỉ mới"}
              </Button>

              {showNewAddressForm && (
                <>
                  <Form.Item
                    label="Full name"
                    name="fullName"
                    rules={[
                      {
                        required: true,
                        message:
                          "Enter full name"
                      }
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[
                      {
                        required: true,
                        message:
                          "Enter phone number"
                      }
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    label="Province"
                    name="province"
                    rules={[
                      {
                        required: true,
                        message:
                          "Enter province"
                      }
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    label="District"
                    name="district"
                    rules={[
                      {
                        required: true,
                        message:
                          "Enter district"
                      }
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    label="Ward"
                    name="ward"
                    rules={[
                      {
                        required: true,
                        message: "Enter ward"
                      }
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    label="Detail address"
                    name="detailAddress"
                    rules={[
                      {
                        required: true,
                        message:
                          "Enter detail address"
                      }
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </>
              )}

              <Form.Item
                label="Payment method"
                name="paymentMethod"
              >
                <Radio.Group
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                  value={paymentMethod}
                >
                  <Radio value="COD">
                    Cash on delivery
                  </Radio>

                  <Radio value="VNPAY">
                    VNPAY
                  </Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  disabled={!cart.items.length}
                >
                  Place order
                </Button>

                {showQrModal && qrPayload && (
                  <div
                    style={{
                      marginTop: 16,
                      textAlign: "center"
                    }}
                  >
                    <div
                      style={{
                        marginTop: 8,
                        wordBreak: "break-all"
                      }}
                    >

                      <div style={{ marginTop: 12 }}>
                        <Button
                          type="primary"
                          onClick={() =>
                            window.open(
                              qrPayload,
                              "_blank"
                            )
                          }
                        >
                          Đi tới link thanh toán
                        </Button>
                      </div>
                                          <div style={{ marginTop: 8 }}>
                      <Button
                        onClick={() => {
                          setShowQrModal(false);
                          navigate("/orders");
                        }}
                      >
                        I have paid
                      </Button>
                    </div>
                    </div>
                  </div>
                )}
              </Form.Item>
            </Form>
          ) : (
            <Alert
              message="No saved address found."
              type="info"
            />
          )}
        </Card>
      </Space>

      <Modal
        title="Chọn mã giảm giá"
        open={isCouponModalOpen}
        onCancel={() =>
          setIsCouponModalOpen(false)
        }
        footer={null}
      >
        <List
          dataSource={activeCoupons}
          renderItem={(coupon) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    handleCheckCoupon(
                      coupon.code
                    );

                    setIsCouponModalOpen(false);
                  }}
                >
                  Áp dụng
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>
                      {coupon.code}
                    </Text>

                    <Tag color="blue">
                      {coupon.discountType ===
                      "percent"
                        ? `${coupon.discountValue}%`
                        : `${Intl.NumberFormat(
                            "vi-VN"
                          ).format(
                            coupon.discountValue
                          )}đ`}
                    </Tag>
                  </Space>
                }
                description={`Áp dụng cho: ${
                  coupon.applyTo === "all"
                    ? "Tất cả sản phẩm"
                    : coupon.applyTo
                }`}
              />
            </List.Item>
          )}
          locale={{
            emptyText:
              "Không có mã giảm giá nào"
          }}
        />
      </Modal>
    </div>
  );
}