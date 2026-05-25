import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Card, Result } from "antd";

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const message = searchParams.get("message");

  return (
    <div className="page-payment-result">
      <Card>
        <Result
          status="error"
          title="Thanh toán thất bại!"
          subTitle={
            message || "Giao dịch VNPay không thành công. Vui lòng thử lại."
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
