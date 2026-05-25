import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Card, Result } from "antd";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  return (
    <div className="page-payment-result">
      <Card>
        <Result
          status="success"
          title="Thanh toán thành công!"
          subTitle={
            orderId
              ? `Đơn hàng #${orderId.slice(-8)} đã được thanh toán qua VNPay.`
              : "Đơn hàng của bạn đã được thanh toán thành công."
          }
          extra={[
            <Button
              type="primary"
              key="orders"
              onClick={() => navigate("/orders")}
            >
              Xem đơn hàng
            </Button>,
            <Button
              key="home"
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </Button>
          ]}
        />
      </Card>
    </div>
  );
}
