import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";
import { CartProvider } from "./context/CartContext";
import { UserProvider } from "./context/UserContext";
import { AdminNotificationProvider } from "./context/AdminNotificationContext";
import AdminRoute, { POSRoute } from "../ProtectedRoute";
import Contactus from "./components/Contactus";
import Breadcrumbs from "./components/Breadcrumbs";
import "./App.css";


const Home = lazy(() => import("./pages/Home"));
const ProductList = lazy(() => import("./pages/ProductList"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Forgot = lazy(() => import("./pages/Forgot"));
const Orders = lazy(() => import("./pages/Orders"));
const Admin = lazy(() => import("./pages/Admin"));
const PendingPayments = lazy(() => import("./pages/pendingpayments"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PreOrderForm = lazy(() => import("./components/PreOrderForm")); // Add this import
const POSPage = lazy(() => import("./components/POSPage")); // POS Checkout

function App() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Check if current route is admin or pos
  const isAdminRoute = location.pathname === "/admin";
  const isPosRoute = location.pathname === "/pos";

  return (
    <UserProvider>
      <CartProvider>
        <div className="app-container">
          {!isAdminRoute && !isPosRoute && <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
          <main className={`main-content ${isAdminRoute ? 'admin-main-content' : ''}`}>
            {(location.pathname !== '/pos' && location.pathname !== '/admin') && <Breadcrumbs />}
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<ProductList searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
                <Route path="/home" element={<Home />} />
                <Route path="/index.html" element={<Navigate to="/" replace />} />

                <Route path="/products" element={<Navigate to="/" replace />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route
                  path="/products/category/:category"
                  element={<ProductList searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
                />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot" element={<Forgot />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/pendingpayments" element={<PendingPayments />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/preorder" element={<PreOrderForm />} />
                <Route path="/pos" element={
                  <POSRoute>
                    <POSPage />
                  </POSRoute>
                } />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminNotificationProvider>
                        <Admin />
                      </AdminNotificationProvider>
                    </AdminRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Toaster richColors position="bottom-right" />
          <Contactus />
        </div>
      </CartProvider>
    </UserProvider>
  );
}


export default App;