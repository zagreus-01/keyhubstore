import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider, useAuth } from "./components/context/AuthContext";
import DefaultLayout from "./components/layout/DefaultLayout";
import AdminLayout from "./components/layout/AdminLayout";
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
import OrderDetailPage from "./page/OrderDetailPage";
import AdminDashboardPage from "./page/AdminDashboardPage";
import AdminOrdersPage from "./page/AdminOrdersPage";
import AdminProductPage from "./page/AdminProductPage";
import AdminCategoryPage from "./page/AdminCategoryPage";
import AdminBrandPage from "./page/AdminBrandPage";
import AdminCouponPage from "./page/AdminCouponPage";
import UserManagementPage from "./page/UserManagementPage";
import NotFoundPage from "./page/NotFoundPage";
import PaymentSuccessPage from "./page/PaymentSuccessPage";
import PaymentFailedPage from "./page/PaymentFailedPage";
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
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute roles={["staff", "admin"]}>
                    <AdminLayout>
                      <AdminDashboardPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute roles={["staff", "admin"]}>
                    <AdminLayout>
                      <AdminOrdersPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminLayout>
                      <AdminProductPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminLayout>
                      <AdminCategoryPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/brands"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminLayout>
                      <AdminBrandPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/coupons"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminLayout>
                      <AdminCouponPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminLayout>
                      <UserManagementPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
              <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
              <Route path="/forgot-password" element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />
              <Route path="/verify" element={<VerifyEmailPage />} />
              <Route path="/reset-password" element={<GuestGuard><ResetPasswordPage /></GuestGuard>} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/payment-failed" element={<PaymentFailedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </DefaultLayout>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
