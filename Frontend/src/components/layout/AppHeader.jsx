import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge, Button, Input, Layout, Menu, Space, Avatar, Dropdown } from "antd";
import { DashboardOutlined, ShoppingCartOutlined, HeartOutlined, ShopOutlined, HomeOutlined } from "@ant-design/icons";
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

  const items = navItems.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    onClick: () => navigate(item.path)
  }));

  const normalizedRole = String(user?.role || "").toLowerCase();
  const isCustomer = !user || normalizedRole === "customer";
  const isStaff = normalizedRole === "staff";
  const isAdmin = normalizedRole === "admin";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const showDashboardButton = user && (isStaff || isAdmin) && !isAdminRoute;

  const selectedKey = () => {
    if (location.pathname === "/") return "home";
    if (location.pathname.startsWith("/products")) return "products";
    return "";
  };

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
        <Space align="center" className="header-actions">
          <Input.Search
            placeholder="Search products"
            allowClear
            onSearch={(value) => navigate(`/products?keyword=${encodeURIComponent(value)}`)}
            className="header-search"
            style={{ width: 240, minWidth: 220, flexShrink: 0 }}
          />
          {isCustomer && (
            <>
              <Badge count={cartCount} size="small">
                <Button type="text" icon={<ShoppingCartOutlined />} onClick={() => navigate("/cart")} />
              </Badge>
              <Button type="text" icon={<HeartOutlined />} onClick={() => navigate("/wishlist")} />
            </>
          )}
          {showDashboardButton && (
            <Button
              type="default"
              shape="round"
              icon={<DashboardOutlined />}
              onClick={() => navigate("/admin/dashboard")}
            >
              Dashboard
            </Button>
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
