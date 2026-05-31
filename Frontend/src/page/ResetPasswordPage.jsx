import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Form, Input, Typography } from "antd";
import api, { getErrorMessage } from "../util/api";
import { notification } from "../util/feedback";

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = new URLSearchParams(location.search).get("email") || "";
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialEmail) {
      form.setFieldsValue({ email: initialEmail });
    }
  }, [initialEmail, form]);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword
      });

      notification.success({
        title: "Password reset successful",
        description: "You can now sign in with your new password."
      });
      navigate("/login");
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-auth auth-page">
      <Card className="auth-card" title={<Title level={3}>Reset Password</Title>}>
        <Text type="secondary">
          Enter your email, the OTP from the email, and your new password.
        </Text>
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
          <Form.Item
            name="otp"
            label="OTP code"
            rules={[{ required: true, message: "Enter the OTP code" }]}
          >
            <Input placeholder="OTP code" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New password"
            rules={[{ required: true, message: "Enter a new password" }, { min: 6, message: "Password must be at least 6 characters" }]}
          >
            <Input.Password placeholder="New password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm password"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                }
              })
            ]}
          >
            <Input.Password placeholder="Confirm password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Reset password
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
