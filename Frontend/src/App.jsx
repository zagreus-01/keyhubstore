import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider, useAuth } from "./components/context/AuthContext";
import DefaultLayout from "./components/layout/DefaultLayout";
import HomePage from "./page/HomePage";
import ProductsPage from "./page/ProductsPage";
import ProductDetailPage from "./page/ProductDetailPage";
import CartPage from "./page/CartPage";
import WishlistPage from "./page/WishlistPage";
import CheckoutPage from "./page/CheckoutPage";
import LoginPage from "./page/LoginPage";
import RegisterPage from "./page/RegisterPage";
import VerifyEmailPage from "./page/VerifyEmailPage";
import ForgotPasswordPage from "./page/ForgotPasswordPage";
import ResetPasswordPage from "./page/ResetPasswordPage";
import ProfilePage from "./page/ProfilePage";
import OrdersPage from "./page/OrdersPage";
import AdminDashboardPage from "./page/AdminDashboardPage";
import AdminOrdersPage from "./page/AdminOrdersPage";
import AdminProductPage from "./page/AdminProductPage";
import AdminCategoryPage from "./page/AdminCategoryPage";
import UserManagementPage from "./page/UserManagementPage";
import NotFoundPage from "./page/NotFoundPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import "./index.css";
import "./App.css";

function GuestGuard({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <BrowserRouter>
          <DefaultLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={["staff", "admin"]}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute roles={["staff", "admin"]}><AdminOrdersPage /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute roles={["admin"]}><AdminProductPage /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute roles={["admin"]}><AdminCategoryPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><UserManagementPage /></ProtectedRoute>} />
              <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
              <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
              <Route path="/forgot-password" element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />
              <Route path="/verify" element={<VerifyEmailPage />} />
              <Route path="/reset-password" element={<GuestGuard><ResetPasswordPage /></GuestGuard>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </DefaultLayout>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
