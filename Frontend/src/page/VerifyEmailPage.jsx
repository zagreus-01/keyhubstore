import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Typography } from "antd";
import api, { getErrorMessage } from "../util/api";
import { notification } from "../util/feedback";

const { Title, Text } = Typography;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = new URLSearchParams(location.search).get("email") || "";
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email: values.email, otp: values.otp, type: "verify-email" });
      notification.success({ title: "Email verified. You can now sign in." });
      navigate("/login");
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-auth auth-page">
      <Card className="auth-card" title={<Title level={3}>Verify your email</Title>}>
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ email: initialEmail }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Enter your email" }, { type: "email", message: "Enter a valid email" }]}> 
            <Input placeholder="user@mail.com" />
          </Form.Item>
          <Form.Item name="otp" label="Verification code" rules={[{ required: true, message: "Enter the OTP code" }]}> 
            <Input placeholder="OTP code" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Verify email</Button>
          </Form.Item>
          <Text>
            Back to <a onClick={() => navigate("/login")}>sign in</a>
          </Text>
        </Form>
      </Card>
    </div>
  );
}
