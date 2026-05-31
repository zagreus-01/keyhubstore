import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  ShopOutlined,
  OrderedListOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  TagOutlined,
} from "@ant-design/icons";
import useAuth from "../context/useAuth";

const { Content, Sider } = Layout;

const adminMenuItems = [
  { key: "/admin/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/admin/orders", icon: <OrderedListOutlined />, label: "Orders" },
  { key: "/admin/products", icon: <ShopOutlined />, label: "Products" },
  { key: "/admin/categories", icon: <AppstoreOutlined />, label: "Categories" },
  { key: "/admin/brands", icon: <TeamOutlined />, label: "Brands" },
  { key: "/admin/coupons", icon: <TagOutlined />, label: "Coupons" },
  { key: "/admin/users", icon: <UserOutlined />, label: "Users" },
];

const staffMenuItems = [
  { key: "/admin/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/admin/orders", icon: <OrderedListOutlined />, label: "Orders" },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const normalizedRole = String(user?.role || "").toLowerCase();
  const menuItems = normalizedRole === "staff" ? staffMenuItems : adminMenuItems;
  const sidebarTitle = normalizedRole === "staff" ? "Staff Control" : "Admin Control";

  return (
    <Layout className="admin-layout">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={280}
        theme="dark"
        className="admin-layout-sider"
      >
        <div className="admin-layout-sider-header">{sidebarTitle}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout className="admin-layout-content-wrapper">
        <Content className="admin-layout-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
