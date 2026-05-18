import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge, Button, Input, Layout, Menu, Space, Typography, Avatar, Dropdown } from "antd";
import { DashboardOutlined, ShoppingCartOutlined, HeartOutlined, ShopOutlined, HomeOutlined, TeamOutlined } from "@ant-design/icons";
import api from "../../util/api";
import { useAuth } from "../context/AuthContext";

const { Header } = Layout;

const navItems = [
  { key: "home", label: "Home", path: "/", icon: <HomeOutlined /> },
  { key: "products", label: "Products", path: "/products", icon: <ShopOutlined /> },
];

function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const normalizedRole = String(user?.role || "").toLowerCase();

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await api.get("/cart");
        setCartCount(response.data.data.items.length || 0);
      } catch {
        setCartCount(0);
      }
    };
    fetchCart();
  }, [location.pathname, user]);
  const roleItems = [];
  if (normalizedRole === "staff" || normalizedRole === "admin") {
    roleItems.push({
      key: "dashboard",
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <DashboardOutlined />
    });
    roleItems.push({
      key: "admin-orders",
      label: "Orders",
      path: "/admin/orders",
      icon: <ShoppingCartOutlined />
    });
  }
  if (normalizedRole === "admin") {
    roleItems.push(
      {
        key: "admin-products",
        label: "Products",
        path: "/admin/products",
        icon: <ShopOutlined />
      },
      {
        key: "admin-categories",
        label: "Categories",
        path: "/admin/categories",
        icon: <TeamOutlined />
      },
      {
        key: "users",
        label: "Users",
        path: "/admin/users",
        icon: <TeamOutlined />
      }
    );
  }

  const items = [...navItems, ...roleItems].map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    onClick: () => navigate(item.path)
  }));

  const selectedKey = () => {
    if (location.pathname.startsWith("/admin/dashboard")) return "dashboard";
    if (location.pathname.startsWith("/admin/orders")) return "admin-orders";
    if (location.pathname.startsWith("/admin/products")) return "admin-products";
    if (location.pathname.startsWith("/admin/categories")) return "admin-categories";
    if (location.pathname.startsWith("/admin/users")) return "users";
    if (location.pathname === "/") return "home";
    if (location.pathname.startsWith("/products")) return "products";
    return "";
  };

  const isCustomer = !user || user.role === "customer";
  const userMenu = [
    {
      key: "profile",
      label: "Profile",
      onClick: () => navigate("/profile")
    },
    ...(isCustomer
      ? [
          {
            key: "orders",
            label: "Orders",
            onClick: () => navigate("/orders")
          }
        ]
      : []),
    {
      key: "logout",
      label: "Logout",
      onClick: logout
    }
  ];

  return (
    <Header className="app-header">
      <div className="header-content">
        <div className="brand" onClick={() => navigate("/")}>Keyhub Store</div>
        <Menu className="nav-menu" mode="horizontal" selectedKeys={[selectedKey()]} items={items} />
        <Space wrap align="center" className="header-actions">
          <Input.Search
            placeholder="Search products"
            allowClear
            onSearch={(value) => navigate(`/products?keyword=${encodeURIComponent(value)}`)}
            style={{ width: 250 }}
          />
          {isCustomer && (
            <>
              <Badge count={cartCount} size="small">
                <Button type="text" icon={<ShoppingCartOutlined />} onClick={() => navigate("/cart")} />
              </Badge>
              <Button type="text" icon={<HeartOutlined />} onClick={() => navigate("/wishlist")} />
            </>
          )}
          {user ? (
            <Dropdown menu={{ items: userMenu }} trigger={["click"]}>
              <Button
                type="primary"
                shape="round"
                icon={
                  <Avatar
                    src={user.avatar ? (user.avatar.startsWith("http") ? user.avatar : `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8080"}/${user.avatar}`) : undefined}
                    style={{ backgroundColor: user.avatar ? undefined : "#1890ff" }}
                  >
                    {!user.avatar && user.fullName?.slice(0, 1).toUpperCase()}
                  </Avatar>
                }
              >
                {user.fullName}
              </Button>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate("/login")}>Sign In</Button>
          )}
        </Space>
      </div>
    </Header>
  );
}

export default AppHeader;
