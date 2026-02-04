import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import LoadingScreen from "./components/LoadingScreen";
import { Toaster } from "sonner";
import { CartProvider } from "./context/CartContext";
import { UserProvider } from "./context/UserContext";
import { AdminNotificationProvider } from "./context/AdminNotificationContext";
import AdminRoute from "../ProtectedRoute";
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    // Only set isNavigating if it's not a side menu hover event
    if (!location.state?.fromSideMenuHover) {
      setIsNavigating(true);
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsNavigating(false); // Ensure it's false for hover events
    }
  }, [location.pathname, location.state]);

  return (
    <UserProvider>
      <CartProvider>
        <div className="app-container">
          <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          {isNavigating && <LoadingScreen />}
          <main className="main-content">
            <Breadcrumbs />
            <Suspense fallback={<LoadingScreen />}>
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
                <Route path="/pos" element={<POSPage />} />
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