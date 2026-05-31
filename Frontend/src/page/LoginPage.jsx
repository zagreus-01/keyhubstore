import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Card, Form, Input, Typography, notification } from "antd";
import api, { getErrorMessage } from "../util/api";
import useAuth from "../components/context/useAuth";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      login(response.data.data);
      notification.success({ title: "Welcome back!" });
      navigate("/");
    } catch (error) {
      notification.error({ title: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-auth auth-page">
      <Card className="auth-card" title={<Title level={3}>Sign in to Keyhub</Title>}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Please enter your email" }, { type: "email", message: "Enter a valid email" }]}> 
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: "Please enter your password" }]}> 
            <Input.Password placeholder="Password" />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Sign in</Button>
          </Form.Item>
          <Text>
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </Text>
        </Form>
      </Card>
    </div>
  );
}
