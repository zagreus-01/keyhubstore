import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider } from "./components/context/AuthContext";
import useAuth from "./components/context/useAuth";
import DefaultLayout from "./components/layout/DefaultLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ScrollToTop from "./components/common/ScrollToTop";
import "./index.css";
import "./App.css";

const HomePage = lazy(() => import("./page/HomePage"));
const ProductsPage = lazy(() => import("./page/ProductsPage"));
const ProductDetailPage = lazy(() => import("./page/ProductDetailPage"));
const CartPage = lazy(() => import("./page/CartPage"));
const WishlistPage = lazy(() => import("./page/WishlistPage"));
const CheckoutPage = lazy(() => import("./page/CheckoutPage"));
const LoginPage = lazy(() => import("./page/LoginPage"));
const RegisterPage = lazy(() => import("./page/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./page/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./page/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./page/ResetPasswordPage"));
const ProfilePage = lazy(() => import("./page/ProfilePage"));
const OrdersPage = lazy(() => import("./page/OrdersPage"));
const OrderDetailPage = lazy(() => import("./page/OrderDetailPage"));
const AdminDashboardPage = lazy(() => import("./page/AdminDashboardPage"));
const AdminOrdersPage = lazy(() => import("./page/AdminOrdersPage"));
const AdminProductPage = lazy(() => import("./page/AdminProductPage"));
const AdminCategoryPage = lazy(() => import("./page/AdminCategoryPage"));
const AdminBrandPage = lazy(() => import("./page/AdminBrandPage"));
const AdminCouponPage = lazy(() => import("./page/AdminCouponPage"));
const UserManagementPage = lazy(() => import("./page/UserManagementPage"));
const NotFoundPage = lazy(() => import("./page/NotFoundPage"));
const PaymentSuccessPage = lazy(() => import("./page/PaymentSuccessPage"));
const PaymentFailedPage = lazy(() => import("./page/PaymentFailedPage"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback-bar" />
      <span className="route-fallback-bar route-fallback-bar-short" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

function GuestGuard({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#173f7a",
          fontFamily: '"Outfit", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          borderRadius: 12,
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <DefaultLayout>
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
          </DefaultLayout>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
