import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Typography, notification } from "antd";
import api, { getErrorMessage } from "../util/api";

const { Title, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      notification.success({
        title: "Request sent",
        description: "If the email is registered, you will receive an OTP to reset your password."
      });
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-auth auth-page">
      <Card className="auth-card" title={<Title level={3}>Forgot Password</Title>}>
        <Paragraph>Enter your email address and we will send you instructions to reset your password.</Paragraph>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Enter a valid email" }
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Send reset link
            </Button>
          </Form.Item>
          <Form.Item>
            <Button type="link" block onClick={() => navigate("/login")}>Back to login</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
