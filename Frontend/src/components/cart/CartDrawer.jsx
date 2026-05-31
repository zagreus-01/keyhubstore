import { Button, Drawer, Empty, InputNumber, Space, Typography } from "antd";
import { CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getBackendUrl } from "../../util/api";
import useCart from "../context/useCart";

const { Text, Title } = Typography;

const formatCurrency = (value) => Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND"
}).format(value || 0);

const getItemImage = (item) => {
  const variant = item.variantId || {};
  const product = variant.productId || {};
  const rawImage = variant.images?.[0] || product.images?.[0] || product.thumbnail;

  if (!rawImage) {
    return "https://via.placeholder.com/180x140?text=Keyhub";
  }

  return rawImage.startsWith("http") ? rawImage : getBackendUrl(rawImage);
};

const getVariantLabel = (variant) => {
  if (variant?.attributes?.length) {
    return variant.attributes.map((attr) => `${attr.key}: ${attr.value}`).join(" / ");
  }

  return variant?.sku ? `SKU: ${variant.sku}` : "Phiên bản tiêu chuẩn";
};

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    closeCartDrawer,
    drawerOpen,
    loading,
    removeCartItem,
    updateCartQuantity
  } = useCart();

  const items = cart.items || [];
  const subtotal = cart.totalPrice || 0;
  const freeShippingTarget = 1500000;
  const progress = Math.min((subtotal / freeShippingTarget) * 100, 100);
  const hasFreeShipping = subtotal >= freeShippingTarget;

  const goToCheckout = () => {
    closeCartDrawer();
    navigate("/checkout");
  };

  const goToProducts = () => {
    closeCartDrawer();
    navigate("/products");
  };

  return (
    <Drawer
      className="cart-drawer"
      closeIcon={null}
      maskClassName="cart-drawer-mask"
      onClose={closeCartDrawer}
      open={drawerOpen}
      placement="right"
      width={650}
      styles={{ body: { padding: 0 }, header: { display: "none" } }}
    >
      <div className="cart-drawer-shell">
        <div className="cart-drawer-header">
          <Text strong>Cart ({cartCount})</Text>
          <Text className="cart-drawer-shipping">{hasFreeShipping ? "Bạn đã được miễn phí vận chuyển" : "Thêm sản phẩm để nhận ưu đãi vận chuyển"}</Text>
          <Button type="text" icon={<CloseOutlined />} onClick={closeCartDrawer} />
        </div>

        <div className="cart-drawer-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="cart-drawer-content">
          {items.length ? (
            <Space direction="vertical" size={0} style={{ width: "100%" }}>
              {items.map((item) => {
                const variant = item.variantId || {};
                const product = variant.productId || {};

                return (
                  <div className="cart-drawer-item" key={variant._id || item._id}>
                    <img src={getItemImage(item)} alt={product.productName || "Cart item"} />
                    <div className="cart-drawer-item-main">
                      <div className="cart-drawer-item-top">
                        <div>
                          <Text strong>{product.productName || "Unknown product"}</Text>
                          <Text type="secondary">{getVariantLabel(variant)}</Text>
                        </div>
                        <Text strong>{formatCurrency((variant.price || 0) * item.quantity)}</Text>
                      </div>
                      <div className="cart-drawer-item-actions">
                        <Button type="link" size="small" onClick={() => removeCartItem(variant._id)}>Remove</Button>
                        <div className="cart-quantity-control">
                          <Button type="text" icon={<DeleteOutlined />} onClick={() => removeCartItem(variant._id)} />
                          <InputNumber
                            min={1}
                            max={variant.stock || 999}
                            value={item.quantity}
                            controls={false}
                            onChange={(value) => updateCartQuantity(variant._id, Number(value) || 1)}
                          />
                          <Button type="text" onClick={() => updateCartQuantity(variant._id, item.quantity + 1)}>+</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Space>
          ) : (
            <div className="cart-drawer-empty">
              <Empty description="Giỏ hàng của bạn đang trống" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" onClick={goToProducts}>Mua sắm ngay</Button>
              </Empty>
            </div>
          )}

        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-row">
              <Text strong>Subtotal</Text>
              <Title level={4}>{formatCurrency(subtotal)}</Title>
            </div>
            <div className="cart-summary-row">
              <Text strong>Shipping</Text>
              <Text>{hasFreeShipping ? "FREE" : "Tính khi thanh toán"}</Text>
            </div>
            <Button type="primary" block size="large" loading={loading} onClick={goToCheckout}>
              Proceed to checkout
            </Button>
            <div className="cart-payments">
              <span>COD</span>
              <span>VNPay</span>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
