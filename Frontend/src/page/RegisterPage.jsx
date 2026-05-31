import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Card, Form, Input, Typography } from "antd";
import api, { getErrorMessage } from "../util/api";
import { notification } from "../util/feedback";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register", values);
      notification.success({ title: response.data.data.message || "Registration complete" });
      navigate(`/verify?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-auth auth-page">
      <Card className="auth-card" title={<Title level={3}>Create a new account</Title>}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="fullName" label="Full name" rules={[{ required: true, message: "Enter your full name" }]}> 
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Enter your email" }, { type: "email", message: "Enter a valid email" }]}> 
            <Input placeholder="example@mail.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: "Enter a password" }, { min: 6, message: "Password must be at least 6 characters" }]}> 
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="Confirm password" dependencies={["password"]} rules={[{ required: true, message: "Confirm your password" }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("password") === value) { return Promise.resolve(); } return Promise.reject(new Error("Passwords do not match")); } })]}> 
            <Input.Password placeholder="Confirm password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Create account</Button>
          </Form.Item>
          <Text>
            Already have an account? <Link to="/login">Sign in</Link>
          </Text>
        </Form>
      </Card>
    </div>
  );
}
