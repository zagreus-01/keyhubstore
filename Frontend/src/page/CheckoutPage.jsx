import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
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
import useAuth from "../components/context/useAuth";

const { Title, Text } = Typography;
const POINT_VALUE = 1000;

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
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [couponInfo, setCouponInfo] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("COD");



  const [loading, setLoading] = useState(false);

  const [activeCoupons, setActiveCoupons] = useState([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!isCustomer) return;

      try {
        const [cartRes, addressRes, couponsRes, profileRes] = await Promise.all([
          api.get("/cart"),
          api.get("/user/address"),
          api.get("/coupon/active"),
          api.get("/user/profile")
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
        setLoyaltyPoints(profileRes.data.data?.loyaltyPoints || 0);
      } catch (error) {
        notification.error({
          message: getErrorMessage(error)
        });
      }
    };

    fetchData();
  }, [isCustomer]);

  useEffect(() => {
    const couponDiscount = couponInfo?.discountAmount || 0;
    const maxPoints = Math.min(
      loyaltyPoints,
      Math.floor(Math.max((cart.totalPrice || 0) - couponDiscount, 0) / POINT_VALUE)
    );
    const normalizedPoints = Math.min(Math.max(Number(pointsToUse) || 0, 0), maxPoints);
    const nextPointsDiscount = normalizedPoints * POINT_VALUE;

    if (normalizedPoints !== pointsToUse) {
      setPointsToUse(normalizedPoints);
    }

    setPointsDiscount(nextPointsDiscount);

    if (couponInfo && cart.totalPrice) {
      setDiscountAmount(couponInfo.discountAmount || 0);

      setFinalAmount(
        Math.max((cart.totalPrice || 0) - (couponInfo.discountAmount || 0) - nextPointsDiscount, 0)
      );
    } else {
      setDiscountAmount(0);
      setFinalAmount(Math.max((cart.totalPrice || 0) - nextPointsDiscount, 0));
    }
  }, [couponInfo, cart, loyaltyPoints, pointsToUse]);

  const selectedAddress = useMemo(
    () =>
      addresses.find((item) => item._id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const shouldShowAddressForm = showNewAddressForm || !addresses.length;
  const useSavedAddress = Boolean(selectedAddress && !shouldShowAddressForm);

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

  const handleFinish = async (values) => {
    setLoading(true);

    try {
      const shippingAddress = useSavedAddress
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
        couponCode: couponCode.trim(),
        pointsToUse
      });

      const order = res.data.data;

      notification.success({
        message: "Order placed successfully"
      });

      if (paymentMethod === "VNPAY") {
        try {
          // Gọi API tạo link thanh toán VNPay
          const paymentRes = await api.post("/payment/vnpay", {
            orderId: order._id
          });

          // Redirect trực tiếp tới VNPay
          window.location.href = paymentRes.data.paymentUrl;
          return; // Không setLoading(false) vì đang redirect
        } catch (err) {
          notification.error({
            message: "Không thể tạo link thanh toán VNPay",
            description: getErrorMessage(err)
          });
          navigate("/orders");
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
                item.variantId?.productId?.categoryId?._id ||
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
              String(
                item.variantId?.productId?.brandId?._id ||
                  item.variantId?.productId?.brandId
              )
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

          <div style={{ marginBottom: 16 }}>
            <Text strong>Loyalty points</Text>
            <div style={{ marginTop: 8 }}>
              <InputNumber
                min={0}
                max={Math.min(loyaltyPoints, Math.floor(Math.max((cart.totalPrice || 0) - discountAmount, 0) / POINT_VALUE))}
                value={pointsToUse}
                onChange={(value) => setPointsToUse(Number(value) || 0)}
                style={{ width: 160, marginRight: 8 }}
              />
              <Text type="secondary">
                Available: {loyaltyPoints} points, 1 point = {Intl.NumberFormat("vi-VN").format(POINT_VALUE)} VND
              </Text>
            </div>
          </div>

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

            {pointsDiscount > 0 && (
              <>
                <Text type="secondary">
                  Points discount
                </Text>

                <Title
                  level={5}
                  style={{ color: "green" }}
                >
                  -
                  {Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND"
                  }).format(pointsDiscount)}
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
          <Form
              layout="vertical"
              onFinish={handleFinish}
              initialValues={{ paymentMethod }}
            >
              {addresses.length > 0 && (
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
              )}

              {selectedAddress &&
                !shouldShowAddressForm && (
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

              {addresses.length > 0 && (
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
              )}

              {shouldShowAddressForm && (
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
              </Form.Item>
            </Form>
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
