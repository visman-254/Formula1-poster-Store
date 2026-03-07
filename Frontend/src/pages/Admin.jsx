import { useState, useEffect, useCallback } from "react";
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
  X,
  FileDown,
  Upload,
  Settings,
  Image,
  Package,
  Menu,
} from "lucide-react";
import { useAdminNotification } from "../context/AdminNotificationContext";
import { getWallpaper, updateWallpaper, deleteWallpaper } from "../api/adminSettings";
import API_BASE from "../config";

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
import ManageSKUs from "../components/ManageSKUs";
import GlassmorphicContainer from "../components/GlassmorphicContainer";
import BatchInventory from "../components/BatchInventory";
import StandaloneBarcodeScanner from "../components/StandaloneBarcodeScanner";
import StockReceivePage from "../components/StockReceivePage";

import OrderTypeDailyComparison from "../components/OrderTypeDailyComparison";
import SalesByOrderType from "../components/SalesByOrderType";
import POSDailySales from "../components/POSDailySales";
import OnlineDailySales from "../components/OnlineDailySales";
import POSMonthlySales from "../components/POSMonthlySales";
import OnlineMonthlySales from "../components/OnlineMonthlySales";

import { useNavigate } from "react-router-dom";
import { exportOrders, exportProducts, exportInventory, exportUsers, exportBatches } from "../api/exportApi";
import "./Admin.css";

export default function AdminPage() {
  const [activeCategory, setActiveCategory] = useState("Dashboard");
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [adminBackground, setAdminBackground] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();

  // Handle product found from scanner
  const handleScannerProductFound = (result) => {
    if (result) {
      setActiveCategory("Products & Inventory");
      setActiveTab("products");
      setScannerOpen(false);
    }
  };

  const {
    newOrdersCount,
    newPreordersCount,
    lowStockCount,
    resetNewOrdersCount,
    resetNewPreordersCount,
  } = useAdminNotification();

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const getTabsForCategory = (category) => {
    switch (category) {
      case "Dashboard":
        return [{ value: "home", label: "Dashboard", icon: <Home size={16} /> }];
      case "Products & Inventory":
        return [
          { value: "products",        label: "All Products",    icon: <PackageSearch size={16} /> },
          { value: "add",             label: "Add Product",     icon: <BookmarkPlus size={16} /> },
          { value: "delete",          label: "Categories",      icon: <Delete size={16} /> },
          { value: "uncategorized",   label: "Uncategorized",   icon: <HeartCrack size={16} /> },
          { value: "imei",            label: "IMEI Tracking",   icon: <Barcode size={16} /> },
          { value: "sku-management",  label: "SKU Management",  icon: <Barcode size={16} /> },
          { value: "batch-inventory", label: "Batch Inventory", icon: <Package size={16} /> },
        ];
      case "Orders & Sales":
        return [
          { value: "orders",     label: "Orders",     icon: <Forklift size={16} />, count: newOrdersCount },
          { value: "backorders", label: "Backorders", icon: <Forklift size={16} /> },
          { value: "preorders",  label: "Preorders",  icon: <Shuffle size={16} />,  count: newPreordersCount },
        ];
      case "Website":
        return [
          { value: "create-hero",      label: "Hero Slides", icon: <PackageSearch size={16} /> },
          { value: "create-promotion", label: "Promotions",  icon: <PackageSearch size={16} /> },
        ];
      case "Export Data":
        return [
          { value: "export-orders",    label: "Export Orders",    icon: <FileDown size={16} /> },
          { value: "export-products",  label: "Export Products",  icon: <FileDown size={16} /> },
          { value: "export-inventory", label: "Export Inventory", icon: <FileDown size={16} /> },
          { value: "export-batches",   label: "Export Batches",   icon: <FileDown size={16} /> },
          { value: "export-users",     label: "Export Users",     icon: <FileDown size={16} /> },
          { value: "import-data",      label: "Import Data",      icon: <Upload size={16} /> },
        ];
      case "System":
        return [
          { value: "analytics", label: "Analytics", icon: <ChartNoAxesCombined size={16} /> },
          { value: "low-stock", label: "Low Stock",  icon: <BellElectric size={16} />, count: lowStockCount },
          { value: "users",     label: "Users",      icon: <User size={16} /> },
          { value: "settings",  label: "Settings",   icon: <Settings size={16} /> },
        ];
      default:
        return [];
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setSidebarOpen(true);
    const tabs = getTabsForCategory(category);
    if (tabs.length > 0) setActiveTab(tabs[0].value);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768) setSidebarOpen(false);
    if (tab === "orders")    resetNewOrdersCount();
    if (tab === "preorders") resetNewPreordersCount();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ─── Export handlers ────────────────────────────────────────────────────────

  const handleExport = async (type, fn) => {
    setExportLoading(type);
    try { await fn(); }
    catch (e) { console.error(e); alert(`Failed to export ${type}`); }
    finally { setExportLoading(null); }
  };

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
    const obs = new MutationObserver(() => {
      if (!root.classList.contains("dark")) {
        root.classList.add("dark");
        root.classList.remove("light");
      }
    });
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch (_) {} }

    const loadWallpaper = async () => {
      try {
        const res = await getWallpaper();
        if (res.success && res.wallpaper) setAdminBackground(`${API_BASE}/${res.wallpaper}`);
      } catch (_) {}
    };
    loadWallpaper();
  }, []);

  // ─── Wallpaper handlers ─────────────────────────────────────────────────────

  const handleWallpaperUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await updateWallpaper(file);
      if (res.success) setAdminBackground(`${API_BASE}/${res.wallpaper}`);
    } catch (_) {}
  };

  const handleWallpaperReset = async () => {
    try {
      const res = await deleteWallpaper();
      if (res.success) setAdminBackground(null);
    } catch (_) {}
  };

  // ─── Data ───────────────────────────────────────────────────────────────────

  const categories = [
    { name: "Dashboard",            icon: <Home size={18} /> },
    { name: "Products & Inventory", icon: <PackageSearch size={18} /> },
    { name: "Orders & Sales",       icon: <Forklift size={18} />,           badge: newOrdersCount + newPreordersCount },
    { name: "Website",              icon: <ChartNoAxesCombined size={18} /> },
    { name: "Export Data",          icon: <FileDown size={18} /> },
    { name: "System",               icon: <User size={18} />,               badge: lowStockCount },
  ];

  const currentTabs = getTabsForCategory(activeCategory);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="admin-root">
      {/* Background */}
      <div
        className="admin-background"
        style={{ backgroundImage: adminBackground ? `url(${adminBackground})` : `url(${elegantwaterBg})` }}
      >
        <div className="background-overlay" />
      </div>

      <div className="admin-container">

        {/* ── Top Navigation Bar ── */}
        <header className="admin-topbar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className="topbar-nav">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`topbar-category ${activeCategory === cat.name ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat.name)}
              >
                {cat.icon}
                <span>{cat.name}</span>
                {cat.badge > 0 && (
                  <span className="notification-badge">{cat.badge}</span>
                )}
              </button>
            ))}

            <button
              className="topbar-category topbar-pos-btn"
              onClick={() => navigate("/pos")}
              title="Open Point of Sale"
            >
              <Package size={18} />
              <span>POS</span>
            </button>
          </nav>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </header>

        <div className="admin-body">

          <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <span>{activeCategory}</span>
              <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="sidebar-nav">
              {currentTabs.map((tab) => (
                <button
                  key={tab.value}
                  className={`sidebar-tab ${activeTab === tab.value ? "active" : ""}`}
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

            {/* VS Code-style user footer */}
            <div className="sidebar-user-footer">
              <div className="sidebar-user-info">
                <div className="sidebar-user-avatar">
                  <User size={18} />
                </div>
                <div className="sidebar-user-details">
                  <span className="sidebar-user-name">
                    {user ? (user.name || user.username) : "Admin User"}
                  </span>
                  {user?.role && (
                    <span className="sidebar-user-role">{user.role}</span>
                  )}
                </div>
              </div>

              <div className="sidebar-user-actions">
                {/* ← removed inline backgroundColor:#10b981 green */}
                <button
                  className="sidebar-action-btn sidebar-pos-btn"
                  onClick={() => navigate("/pos")}
                  title="Open POS"
                >
                  <Package size={18} />
                </button>
                <button
                  className="sidebar-action-btn"
                  onClick={() => handleTabClick("settings")}
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
                <button
                  className="sidebar-logout-btn"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ── Main Content ── */}
          <main className={`admin-main ${!sidebarOpen ? "full-width" : ""}`}>

            {activeTab === "home" && (
              <GlassmorphicContainer>
                <AdminHome onNavigate={handleTabClick} />
              </GlassmorphicContainer>
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
            {activeTab === "export-orders" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Orders to Excel</h2>
                  <p>Download all orders with customer details, totals, and status.</p>
                  <button className="export-btn" onClick={() => handleExport("orders", exportOrders)} disabled={exportLoading === "orders"}>
                    {exportLoading === "orders" ? "Exporting…" : "Download Orders Excel"}
                  </button>
                </div>
              </GlassmorphicContainer>
            )}
            {activeTab === "export-products" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Products to Excel</h2>
                  <p>Download all products with variants, prices, and categories.</p>
                  <button className="export-btn" onClick={() => handleExport("products", exportProducts)} disabled={exportLoading === "products"}>
                    {exportLoading === "products" ? "Exporting…" : "Download Products Excel"}
                  </button>
                </div>
              </GlassmorphicContainer>
            )}
            {activeTab === "export-inventory" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Inventory to Excel</h2>
                  <p>Download stock levels with buying prices and stock values.</p>
                  <button className="export-btn" onClick={() => handleExport("inventory", exportInventory)} disabled={exportLoading === "inventory"}>
                    {exportLoading === "inventory" ? "Exporting…" : "Download Inventory Excel"}
                  </button>
                </div>
              </GlassmorphicContainer>
            )}
            {activeTab === "export-batches" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Batches to Excel</h2>
                  <p>Download all individual batches with their own buying prices and quantities.</p>
                  <button className="export-btn" onClick={() => handleExport("batches", exportBatches)} disabled={exportLoading === "batches"}>
                    {exportLoading === "batches" ? "Exporting…" : "Download Batches Excel"}
                  </button>
                </div>
              </GlassmorphicContainer>
            )}
            {activeTab === "export-users" && (
              <GlassmorphicContainer>
                <div className="export-section">
                  <h2>Export Users to Excel</h2>
                  <p>Download all registered users with their roles and details.</p>
                  <button className="export-btn" onClick={() => handleExport("users", exportUsers)} disabled={exportLoading === "users"}>
                    {exportLoading === "users" ? "Exporting…" : "Download Users Excel"}
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
            {activeTab === "sku-management" && (
              <GlassmorphicContainer><ManageSKUs /></GlassmorphicContainer>
            )}
            {activeTab === "batch-inventory" && (
              <GlassmorphicContainer><BatchInventory /></GlassmorphicContainer>
            )}
            {activeTab === "scan-sku" && (
              <GlassmorphicContainer>
                <StockReceivePage />
              </GlassmorphicContainer>
            )}

            {activeTab === "analytics" && (
              <GlassmorphicContainer>
                <div className="analytics-container">
                  <h2 className="analytics-section-header">Overall Sales Analytics</h2>
                  <div className="analytics-grid">
                    <div className="analytics-section"><AnalyticsDay /></div>
                    <div className="analytics-section"><AnalyticsMonthly /></div>
                    <div className="analytics-section"><ProfitAnalyticsDay /></div>
                    <div className="analytics-section"><ProfitMonthly /></div>
                  </div>
                  <hr className="analytics-divider" />
                  <h2 className="product-analytics-header">Product Performance Analytics</h2>
                  <div className="product-analytics-section"><ProductAnalytics /></div>
                  <hr className="analytics-divider" />
                  <h2 className="pos-online-header">POS vs Online Sales Analytics</h2>
                  <div className="pos-online-comparison-grid">
                    <div className="comparison-section"><OrderTypeDailyComparison /></div>
                    <div className="comparison-section"><SalesByOrderType /></div>
                  </div>
                  <h3 className="sub-section-header">Daily Sales Comparison</h3>
                  <div className="daily-comparison-grid">
                    <div className="comparison-section"><POSDailySales /></div>
                    <div className="comparison-section"><OnlineDailySales /></div>
                  </div>
                  <h3 className="sub-section-header">Monthly Sales Comparison</h3>
                  <div className="monthly-comparison-grid">
                    <div className="comparison-section"><POSMonthlySales /></div>
                    <div className="comparison-section"><OnlineMonthlySales /></div>
                  </div>
                </div>
              </GlassmorphicContainer>
            )}

            {activeTab === "settings" && (
              <GlassmorphicContainer>
                <div className="settings-container">
                  <h2 className="settings-header">Admin Settings</h2>

                  <div className="settings-section">
                    <h3 className="settings-section-header">
                      <Image size={20} /> Wallpaper / Background
                    </h3>
                    <p className="settings-description">
                      Upload a custom background image for the admin section
                    </p>
                    <div className="wallpaper-preview">
                      <img src={adminBackground || elegantwaterBg} alt="Current wallpaper" />
                    </div>
                    <div className="wallpaper-actions">
                      <label className="wallpaper-upload-btn">
                        <Upload size={16} />
                        Upload New Wallpaper
                        <input type="file" accept="image/*" onChange={handleWallpaperUpload} style={{ display: "none" }} />
                      </label>
                      {adminBackground && (
                        <button className="wallpaper-reset-btn" onClick={handleWallpaperReset}>
                          Reset to Default
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3 className="settings-section-header"><User size={20} /> Current User</h3>
                    {user ? (
                      <div className="user-info-display">
                        <div className="user-info-row">
                          <span className="user-info-label">Name:</span>
                          <span className="user-info-value">{user.name || user.username}</span>
                        </div>
                        <div className="user-info-row">
                          <span className="user-info-label">Email:</span>
                          <span className="user-info-value">{user.email}</span>
                        </div>
                        {user.role && (
                          <div className="user-info-row">
                            <span className="user-info-label">Role:</span>
                            <span className="user-info-value">{user.role}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="no-user-info">No user information available</p>
                    )}
                  </div>

                  <div className="settings-section">
                    <button className="logout-btn-large" onClick={handleLogout}>
                      <LogOut size={20} /> Logout
                    </button>
                  </div>
                </div>
              </GlassmorphicContainer>
            )}
          </main>
        </div>
      </div>

      {scannerOpen && (
        <StandaloneBarcodeScanner
          onClose={() => setScannerOpen(false)}
          onProductFound={handleScannerProductFound}
        />
      )}
    </div>
  );
}