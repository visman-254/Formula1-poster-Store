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
  Shuffle
} from "lucide-react";

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
import GlassmorphicContainer from "../components/GlassmorphicContainer";

import "./Admin.css";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("products");

  const tabs = [
    { value: "products", label: "Products", icon: <PackageSearch /> },
    { value: "add", label: "Add Product", icon: <BookmarkPlus /> },
    { value: "delete", label: "Delete Category", icon: <Delete /> },
    { value: "orders", label: "Orders", icon: <Forklift /> },
    { value: "backorders", label: "Backorders", icon: <Forklift /> },
    { value: "users", label: "Users", icon: <User /> },
    { value: "uncategorized", label: "Uncategorized", icon: <HeartCrack /> },
    { value: "analytics", label: "Analytics", icon: <ChartNoAxesCombined /> },
    { value: "create-hero", label: "Create Hero Slide", icon: <PackageSearch /> },
    { value: "create-promotion", label: "Create Promotion", icon: <PackageSearch /> },
    { value: "low-stock", label: "Low Stock Alert", icon: <BellElectric /> },
    { value: "preorders", label: "Preorders", icon: <Shuffle /> },
  ];

  // 🔥 FORCE DARK MODE FOR ADMIN AND ALL CHILD COMPONENTS
  useEffect(() => {
    const root = document.documentElement;

    // Force dark mode
    root.classList.add("dark");
    root.classList.remove("light");

    // Prevent removal of dark mode by any child
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
      <div
        className="admin-background"
        style={{ backgroundImage: `url(${elegantwaterBg})` }}
      >
        <div className="background-overlay" />
      </div>

      <div className="admin-container">
        {/* Sidebar */}
        <aside className="sidebar">
          {tabs.map(tab => (
            <button
              key={tab.value}
              className={`tab ${activeTab === tab.value ? "active" : ""}`}
              onClick={() => setActiveTab(tab.value)}
              type="button"
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {activeTab === "products" && <GlassmorphicContainer><ProductsGrids /></GlassmorphicContainer>}
          {activeTab === "add" && <GlassmorphicContainer><AddProductForm /></GlassmorphicContainer>}
          {activeTab === "delete" && <GlassmorphicContainer><DeleteCategory /></GlassmorphicContainer>}
          {activeTab === "orders" && <GlassmorphicContainer><OrderItems /></GlassmorphicContainer>}
          {activeTab === "users" && <GlassmorphicContainer><Users /></GlassmorphicContainer>}
          {activeTab === "uncategorized" && <GlassmorphicContainer><UncategorizedProducts /></GlassmorphicContainer>}
          {activeTab === "create-hero" && <GlassmorphicContainer><CreateHero /></GlassmorphicContainer>}
          {activeTab === "create-promotion" && <GlassmorphicContainer><CreatePromotion /></GlassmorphicContainer>}
          {activeTab === "low-stock" && <GlassmorphicContainer><LowStockAlert /></GlassmorphicContainer>}
          {activeTab === "backorders" && <GlassmorphicContainer><Backorders /></GlassmorphicContainer>}
          {activeTab === "preorders" && <GlassmorphicContainer><AdminPreorders /></GlassmorphicContainer>}

          {activeTab === "analytics" && (
            <GlassmorphicContainer>
              <div className="analytics-container">
                <div className="analytics-grid">
                  <div className="analytics-section"><AnalyticsDay /></div>
                  <div className="analytics-section"><AnalyticsMonthly /></div>
                  <div className="analytics-section"><ProfitAnalyticsDay /></div>
                  <div className="analytics-section"><ProfitMonthly /></div>
                </div>

                <div className="product-analytics-section">
                  <ProductAnalytics />
                </div>
              </div>
            </GlassmorphicContainer>
          )}
        </main>
      </div>
    </div>
  );
}
