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
  Home,
  ChevronRight,
  X,
  FileDown,
  Upload,
} from "lucide-react";
import { useAdminNotification } from "../context/AdminNotificationContext";

import elegantwaterBg from "../assets/elegantwater.jpg";

import AddProductForm from "../components/AddProductForm";
import AdminHome from "../components/AdminHome";
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
import ImportData from "../components/ImportData";
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
import { exportOrders, exportProducts, exportInventory, exportUsers } from "../api/exportApi";
import "./Admin.css";

export default function AdminPage() {
  const [activeCategory, setActiveCategory] = useState("Dashboard");
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exportLoading, setExportLoading] = useState(null);
  const navigate = useNavigate();

  // Export handlers
  const handleExportOrders = async () => {
    setExportLoading('orders');
    try {
      await exportOrders();
    } catch (error) {
      console.error('Export orders error:', error);
      alert('Failed to export orders');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportProducts = async () => {
    setExportLoading('products');
    try {
      await exportProducts();
    } catch (error) {
      console.error('Export products error:', error);
      alert('Failed to export products');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportInventory = async () => {
    setExportLoading('inventory');
    try {
      await exportInventory();
    } catch (error) {
      console.error('Export inventory error:', error);
      alert('Failed to export inventory');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportUsers = async () => {
    setExportLoading('users');
    try {
      await exportUsers();
    } catch (error) {
      console.error('Export users error:', error);
      alert('Failed to export users');
    } finally {
      setExportLoading(null);
    }
  };

  // Admin notification context
  const {
    newOrdersCount,
    newPreordersCount,
    lowStockCount,
    resetNewOrdersCount,
    resetNewPreordersCount,
  } = useAdminNotification();

  // Handle category selection from top nav
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setSidebarOpen(true);
  };

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

  // Top navigation categories
  const categories = [
    { name: "Dashboard", icon: <Home size={18} /> },
    { name: "Products & Inventory", icon: <PackageSearch size={18} /> },
    { name: "Orders & Sales", icon: <Forklift size={18} />, badge: newOrdersCount + newPreordersCount },
    { name: "Website", icon: <ChartNoAxesCombined size={18} /> },
    { name: "Export Data", icon: <FileDown size={18} /> },
    { name: "System", icon: <User size={18} />, badge: lowStockCount },
  ];

  // Get tabs for current category
  const getCurrentTabs = () => {
    switch (activeCategory) {
      case "Dashboard":
        return [
          { value: "home", label: "Dashboard", icon: <Home size={16} /> },
        ];
      case "Products & Inventory":
        return [
          { value: "products", label: "All Products", icon: <PackageSearch size={16} /> },
          { value: "add", label: "Add Product", icon: <BookmarkPlus size={16} /> },
          { value: "delete", label: "Categories", icon: <Delete size={16} /> },
          { value: "uncategorized", label: "Uncategorized", icon: <HeartCrack size={16} /> },
          { value: "imei", label: "IMEI Tracking", icon: <Barcode size={16} /> },
        ];
      case "Orders & Sales":
        return [
          { value: "orders", label: "Orders", icon: <Forklift size={16} />, count: newOrdersCount },
          { value: "backorders", label: "Backorders", icon: <Forklift size={16} /> },
          { value: "preorders", label: "Preorders", icon: <Shuffle size={16} />, count: newPreordersCount },
        ];
      case "Website":
        return [
          { value: "create-hero", label: "Hero Slides", icon: <PackageSearch size={16} /> },
          { value: "create-promotion", label: "Promotions", icon: <PackageSearch size={16} /> },
        ];
      case "Export Data":
        return [
          { value: "export-orders", label: "Export Orders", icon: <FileDown size={16} /> },
          { value: "export-products", label: "Export Products", icon: <FileDown size={16} /> },
          { value: "export-inventory", label: "Export Inventory", icon: <FileDown size={16} /> },
          { value: "export-users", label: "Export Users", icon: <FileDown size={16} /> },
          { value: "import-data", label: "Import Data", icon: <Upload size={16} /> },
        ];
      case "System":
        return [
          { value: "analytics", label: "Analytics", icon: <ChartNoAxesCombined size={16} /> },
          { value: "low-stock", label: "Low Stock", icon: <BellElectric size={16} />, count: lowStockCount },
          { value: "users", label: "Users", icon: <User size={16} /> },
        ];
      default:
        return [];
    }
  };

  const currentTabs = getCurrentTabs();

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
          <nav className="topbar-nav">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`topbar-category ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.name)}
              >
                {cat.icon}
                <span>{cat.name}</span>
                {cat.badge > 0 && (
                  <span className="notification-badge">{cat.badge}</span>
                )}
              </button>
            ))}
          </nav>
          
          {/* Logout Button */}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </header>

        <div className="admin-body">
          {/* Sidebar - Submenus */}
          {sidebarOpen && (
            <aside className="admin-sidebar">
              <div className="sidebar-header">
                <span>{activeCategory}</span>
                <button 
                  className="sidebar-close"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="sidebar-nav">
                {currentTabs.map((tab) => (
                  <button
                    key={tab.value}
                    className={`sidebar-tab ${activeTab === tab.value ? 'active' : ''}`}
                    onClick={() => handleTabClick(tab.value)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="sidebar-badge">{tab.count}</span>
                    )}
                  </button>
                ))}
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <main className={`admin-main ${!sidebarOpen ? 'full-width' : ''}`}>
            {activeTab === "home" && (
              <GlassmorphicContainer><AdminHome onNavigate={handleTabClick} /></GlassmorphicContainer>
            )}
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
            {/* Export Data Tabs */}
            {activeTab === "export-orders" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Orders to Excel</h2>
                  <p>Download all orders with customer details, totals, and status.</p>
                  <button 
                    className="export-btn"
                    onClick={handleExportOrders}
                    disabled={exportLoading === 'orders'}
                  >
                    {exportLoading === 'orders' ? 'Exporting...' : 'Download Orders Excel'}
                  </button>
                </div>
              </GlassmorphicContainer>
            )}
            {activeTab === "export-products" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Products to Excel</h2>
                  <p>Download all products with variants, prices, and categories.</p>
                  <button 
                    className="export-btn"
                    onClick={handleExportProducts}
                    disabled={exportLoading === 'products'}
                  >
                    {exportLoading === 'products' ? 'Exporting...' : 'Download Products Excel'}
                  </button>
                </div>
              </GlassmorphicContainer>
            )}
            {activeTab === "export-inventory" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Inventory to Excel</h2>
                  <p>Download stock levels with buying prices and stock values.</p>
                  <button 
                    className="export-btn"
                    onClick={handleExportInventory}
                    disabled={exportLoading === 'inventory'}
                  >
                    {exportLoading === 'inventory' ? 'Exporting...' : 'Download Inventory Excel'}
                  </button>
                </div>
              </GlassmorphicContainer>
            )}
            {activeTab === "export-users" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Users to Excel</h2>
                  <p>Download all registered users with their roles and details.</p>
                  <button 
                    className="export-btn"
                    onClick={handleExportUsers}
                    disabled={exportLoading === 'users'}
                  >
                    {exportLoading === 'users' ? 'Exporting...' : 'Download Users Excel'}
                  </button>
                </div>
              </GlassmorphicContainer>
            )}
            {activeTab === "import-data" && (
              <GlassmorphicContainer><ImportData /></GlassmorphicContainer>
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
    </div>
  );
}
