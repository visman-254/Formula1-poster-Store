import { useState, useEffect } from "react";
import {
  PackageSearch,
  BookmarkPlus,
  Forklift,
  Delete,
  User,
  ChartNoAxesCombined,
  HeartCrack,
  BellElectric,
  Shuffle,
  Barcode,
  LogOut,
} from "lucide-react";
import { useAdminNotification } from "../context/AdminNotificationContext";

import elegantwaterBg from "../assets/elegantwater.jpg";

import AddProductForm from "../components/AddProductForm";
import ProductsGrids from "../components/ProductGrids";
import DeleteCategory from "../components/DeleteCategory";
import OrderItems from "../components/OrderItems";
import Users from "../components/Users";
import UncategorizedProducts from "../components/UncategorizedProducts";
import AnalyticsDay from "../components/AnalyticsDay";
import AnalyticsMonthly from "../components/AnalyticsMonthly";
import ProfitAnalyticsDay from "../components/ProfitAnalyticsDay";
import ProfitMonthly from "../components/ProfitMonthly";
import CreateHero from "../components/CreateHero";
import LowStockAlert from "../components/LowStockAlert";
import Backorders from "../components/Backorders";
import AdminPreorders from "../components/AdminPreorders";
import CreatePromotion from "../components/CreatePromotion";
import ProductAnalytics from "../components/ProductAnalytics";
import ManageIMEIs from "../components/ManageIMEIs";
import GlassmorphicContainer from "../components/GlassmorphicContainer";

// Import the new POS vs Online analytics components
import OrderTypeDailyComparison from "../components/OrderTypeDailyComparison";
import SalesByOrderType from "../components/SalesByOrderType";
import POSDailySales from "../components/POSDailySales";
import OnlineDailySales from "../components/OnlineDailySales";
import POSMonthlySales from "../components/POSMonthlySales";
import OnlineMonthlySales from "../components/OnlineMonthlySales";

import { useNavigate } from "react-router-dom";
import "./Admin.css";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("products");
  const navigate = useNavigate();

  // Admin notification context
  const {
    newOrdersCount,
    newPreordersCount,
    lowStockCount,
    resetNewOrdersCount,
    resetNewPreordersCount,
  } = useAdminNotification();

  // Handle tab clicks
  const handleTabClick = (tab) => {
    setActiveTab(tab);

    if (tab === "orders") resetNewOrdersCount();
    if (tab === "preorders") resetNewPreordersCount();
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Top navigation tabs
  const tabs = [
    { value: "products", label: "Products", icon: <PackageSearch size={18} /> },
    { value: "add", label: "Add Product", icon: <BookmarkPlus size={18} /> },
    { value: "delete", label: "Delete Category", icon: <Delete size={18} /> },
    { value: "orders", label: "Orders", icon: <Forklift size={18} />, count: newOrdersCount },
    { value: "backorders", label: "Backorders", icon: <Forklift size={18} /> },
    { value: "users", label: "Users", icon: <User size={18} /> },
    { value: "uncategorized", label: "Uncategorized", icon: <HeartCrack size={18} /> },
    { value: "analytics", label: "Analytics", icon: <ChartNoAxesCombined size={18} /> },
    { value: "create-hero", label: "Hero Slides", icon: <PackageSearch size={18} /> },
    { value: "create-promotion", label: "Promotions", icon: <PackageSearch size={18} /> },
    { value: "low-stock", label: "Low Stock", icon: <BellElectric size={18} />, count: lowStockCount },
    { value: "preorders", label: "Preorders", icon: <Shuffle size={18} />, count: newPreordersCount },
    { value: "imei", label: "IMEI", icon: <Barcode size={18} /> },
  ];

  // Force dark mode for admin
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");

    const observer = new MutationObserver(() => {
      if (!root.classList.contains("dark")) {
        root.classList.add("dark");
        root.classList.remove("light");
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="admin-root">
      {/* Background */}
      <div className="admin-background" style={{ backgroundImage: `url(${elegantwaterBg})` }}>
        <div className="background-overlay" />
      </div>

      <div className="admin-container">
        {/* Top Navigation Bar */}
        <header className="admin-topbar">
          <div className="topbar-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`topbar-tab ${activeTab === tab.value ? "active" : ""}`}
                onClick={() => handleTabClick(tab.value)}
                type="button"
              >
                {tab.icon}
                <span>{tab.label}</span>
                
                {tab.count > 0 && (
                  <span className="notification-badge">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
          
          {/* Logout Button */}
          <button className="logout-btn" onClick={handleLogout} type="button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="admin-main">
          {activeTab === "products" && (
            <GlassmorphicContainer><ProductsGrids /></GlassmorphicContainer>
          )}
          {activeTab === "add" && (
            <GlassmorphicContainer><AddProductForm /></GlassmorphicContainer>
          )}
          {activeTab === "delete" && (
            <GlassmorphicContainer><DeleteCategory /></GlassmorphicContainer>
          )}
          {activeTab === "orders" && (
            <GlassmorphicContainer><OrderItems /></GlassmorphicContainer>
          )}
          {activeTab === "users" && (
            <GlassmorphicContainer><Users /></GlassmorphicContainer>
          )}
          {activeTab === "uncategorized" && (
            <GlassmorphicContainer><UncategorizedProducts /></GlassmorphicContainer>
          )}
          {activeTab === "create-hero" && (
            <GlassmorphicContainer><CreateHero /></GlassmorphicContainer>
          )}
          {activeTab === "create-promotion" && (
            <GlassmorphicContainer><CreatePromotion /></GlassmorphicContainer>
          )}
          {activeTab === "low-stock" && (
            <GlassmorphicContainer><LowStockAlert /></GlassmorphicContainer>
          )}
          {activeTab === "backorders" && (
            <GlassmorphicContainer><Backorders /></GlassmorphicContainer>
          )}
          {activeTab === "preorders" && (
            <GlassmorphicContainer><AdminPreorders /></GlassmorphicContainer>
          )}
          {activeTab === "imei" && (
            <GlassmorphicContainer><ManageIMEIs /></GlassmorphicContainer>
          )}
          {activeTab === "analytics" && (
            <GlassmorphicContainer>
              <div className="analytics-container">
                
                {/* Overall Sales Analytics */}
                <h2 className="analytics-section-header">Overall Sales Analytics</h2>
                <div className="analytics-grid">
                  <div className="analytics-section"><AnalyticsDay /></div>
                  <div className="analytics-section"><AnalyticsMonthly /></div>
                  <div className="analytics-section"><ProfitAnalyticsDay /></div>
                  <div className="analytics-section"><ProfitMonthly /></div>
                </div>
                
                <hr className="analytics-divider" />
                
                {/* Product Performance Analytics */}
                <h2 className="product-analytics-header">Product Performance Analytics</h2>
                <div className="product-analytics-section">
                  <ProductAnalytics />
                </div>
                
                <hr className="analytics-divider" />
                
                {/* POS/Online Analytics Section */}
                <h2 className="pos-online-header">POS vs Online Sales Analytics</h2>
                
                {/* Main comparison charts */}
                <div className="pos-online-comparison-grid">
                  <div className="comparison-section">
                    <OrderTypeDailyComparison />
                  </div>
                  <div className="comparison-section">
                    <SalesByOrderType />
                  </div>
                </div>
                
                {/* Daily Sales Comparison */}
                <h3 className="sub-section-header">Daily Sales Comparison</h3>
                <div className="daily-comparison-grid">
                  <div className="comparison-section">
                    <POSDailySales />
                  </div>
                  <div className="comparison-section">
                    <OnlineDailySales />
                  </div>
                </div>
                
                {/* Monthly Sales Comparison */}
                <h3 className="sub-section-header">Monthly Sales Comparison</h3>
                <div className="monthly-comparison-grid">
                  <div className="comparison-section">
                    <POSMonthlySales />
                  </div>
                  <div className="comparison-section">
                    <OnlineMonthlySales />
                  </div>
                </div>
                
              </div>
            </GlassmorphicContainer>
          )}
        </main>
      </div>
    </div>
  );
}
