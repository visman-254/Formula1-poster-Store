import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
} from "lucide-react";
import "./AdminHome.css";
import { FaSackDollar } from "react-icons/fa6";
import { FaOpencart } from "react-icons/fa6";
import { FaBoxOpen } from "react-icons/fa6";
import { HiUsers } from "react-icons/hi2";
import { GiArrowed } from "react-icons/gi";
import { GiArrowWings } from "react-icons/gi";
import { toast } from "sonner";
import AnalyticsDay from "./AnalyticsDay";
import AnalyticsProfit from "./AnalyticsProfit";
import AdminProductAnalytics from "./AdminProductAnalytics";
import AddProductModal from "./AddProductModal";
import ViewUsersModal from "./ViewUsersModal";
import GlassmorphicContainer from "./GlassmorphicContainer";
import API_BASE from "../config";
export default function AdminHome({ onNavigate }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    totalProfit: 0,
    todayProfit: 0,
    yesterdayProfit: 0,
    totalOrders: 0,
    todayOrders: 0,
    yesterdayOrders: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingPreorders: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isViewUsersModalOpen, setIsViewUsersModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch all dashboard stats from unified endpoint
      const res = await fetch(`${API_BASE}/api/analytics/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Calculate profit growth percentage
      const profitGrowth = data.profit?.yesterday > 0 
        ? ((data.profit?.today - data.profit?.yesterday) / data.profit?.yesterday * 100)
        : data.profit?.today > 0 ? 100 : 0;

      // Calculate orders growth percentage
      const ordersGrowth = data.orders?.yesterday > 0 
        ? ((data.orders?.today - data.orders?.yesterday) / data.orders?.yesterday * 100)
        : data.orders?.today > 0 ? 100 : 0;

      setStats({
        totalRevenue: data.revenue?.total || 0,
        todayRevenue: data.revenue?.today || 0,
        yesterdayRevenue: data.revenue?.yesterday || 0,
        totalProfit: data.profit?.total || 0,
        todayProfit: data.profit?.today || 0,
        yesterdayProfit: data.profit?.yesterday || 0,
        revenueGrowth: parseFloat(profitGrowth.toFixed(1)),
        totalOrders: data.orders?.total || 0,
        todayOrders: data.orders?.today || 0,
        yesterdayOrders: data.orders?.yesterday || 0,
        ordersGrowth: parseFloat(ordersGrowth.toFixed(1)),
        lowStockCount: data.lowStock?.low || 0,
        outOfStockCount: data.lowStock?.outOfStock || 0,
        pendingPreorders: data.preorders?.total || 0,
        totalProducts: data.products?.total || 0,
        totalUsers: data.users?.total || 0,
        inventoryValueWAC: data.inventory?.valueWAC || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Show error toast notification
      toast.error("Failed to load dashboard stats. Showing zero values.");
      // Set default values on error - showing actual zeros when no data
      setStats({
        totalRevenue: 0,
        todayRevenue: 0,
        yesterdayRevenue: 0,
        totalProfit: 0,
        todayProfit: 0,
        yesterdayProfit: 0,
        revenueGrowth: 0,
        totalOrders: 0,
        todayOrders: 0,
        yesterdayOrders: 0,
        ordersGrowth: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        pendingPreorders: 0,
        totalProducts: 0,
        totalUsers: 0,
        inventoryValueWAC: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: "Today's Profit",
      value: formatCurrency(stats.todayProfit),
      icon: <FaSackDollar size={24} />,
      trend: stats.revenueGrowth,
      trendLabel: "vs yesterday",
      color: "revenue",
      navigateTo: "analytics",
      buttonLabel: "View Analytics",
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: <FaOpencart size={24} />,
      trend: stats.ordersGrowth,
      trendLabel: "vs yesterday",
      color: "orders",
      navigateTo: "orders",
      buttonLabel: "View Orders",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockCount,
      icon: <AlertTriangle size={24} />,
      subtitle: `${stats.outOfStockCount} out of stock`,
      color: "alert",
      navigateTo: "low-stock",
      buttonLabel: "Manage Stock",
    },
    {
      title: "Pending Preorders",
      value: stats.pendingPreorders,
      icon: <FaBoxOpen size={24} />,
      subtitle: "Awaiting fulfillment",
      color: "preorder",
      navigateTo: "preorders",
      buttonLabel: "Fulfill Preorders",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: <Package size={24} />,
      subtitle: "In catalog",
      color: "products",
      isAddProduct: true,
      buttonLabel: "Add New Product",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <HiUsers size={24} />,
      subtitle: "Registered customers",
      color: "users",
      isViewUsers: true,
      buttonLabel: "View Users",
    },
    {
      title: "Inventory Value (WAC)",
      value: formatCurrency(stats.inventoryValueWAC),
      icon: <Package size={24} />,
      subtitle: "Weighted Average Cost",
      color: "products",
      buttonLabel: "View Inventory",
    },
  ];

  if (loading) {
    return (
      <div className="admin-home-loading">
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-home">
      <div className="admin-home-header">
        <h1 className="admin-home-title">Dashboard Overview</h1>
        <p className="admin-home-subtitle">Welcome back! Here's what's happening with your store today.</p>
      </div>

      <div className="admin-home-stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card ${card.color}`}>
            <div className="stat-card-header">
              <div className={`stat-card-icon stat-card-icon--${card.color}`}>{card.icon}</div>
              <div className="stat-card-trend">
                {card.trend !== undefined && (
                  <>
                    {card.trend >= 0 ? (
                      <GiArrowWings size={14} className="stat-card-trend--up" />
                    ) : (
                      <GiArrowed size={14} className="stat-card-trend--down" />
                    )}
                    <span className={card.trend >= 0 ? "stat-card-trend--up" : "stat-card-trend--down"}>
                      {Math.abs(card.trend)}%
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="stat-card-body">
              <h3 className="stat-card-value">{card.value}</h3>
              <p className="stat-card-title">{card.title}</p>
              {card.trendLabel && <span className="stat-card-label">{card.trendLabel}</span>}
              {card.subtitle && <span className="stat-card-subtitle">{card.subtitle}</span>}
              {card.navigateTo && onNavigate && (
                <button 
                  className="stat-card-button"
                  onClick={() => onNavigate(card.navigateTo)}
                >
                  <span>{card.buttonLabel}</span>
                  <ArrowRight size={14} />
                </button>
              )}
              {card.isAddProduct && (
                <button 
                  className="stat-card-button"
                  onClick={() => setIsAddProductModalOpen(true)}
                >
                  <span>{card.buttonLabel}</span>
                  <ArrowRight size={14} />
                </button>
              )}
              {card.isViewUsers && (
                <button 
                  className="stat-card-button"
                  onClick={() => setIsViewUsersModalOpen(true)}
                >
                  <span>{card.buttonLabel}</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section - Side by Side Grid */}
      <div className="dashboard-charts-grid">
        {/* Daily Sales Chart */}
        <div className="dashboard-chart-section">
          <GlassmorphicContainer>
            <div className="chart-section-header">
              <h2 className="chart-title">Daily Sales Overview</h2>
              <button 
                className="chart-view-all"
                onClick={() => onNavigate && onNavigate("analytics")}
              >
                View Full Analytics <ArrowRight size={14} />
              </button>
            </div>
            <div className="chart-container">
              <AnalyticsDay />
            </div>
          </GlassmorphicContainer>
        </div>

        {/* Daily Profit Chart */}
        <div className="dashboard-chart-section">
          <GlassmorphicContainer>
            <div className="chart-section-header">
              <h2 className="chart-title">Daily Profit Overview</h2>
              <button 
                className="chart-view-all"
                onClick={() => onNavigate && onNavigate("analytics")}
              >
                View Full Analytics <ArrowRight size={14} />
              </button>
            </div>
            <div className="chart-container">
              <AnalyticsProfit />
            </div>
          </GlassmorphicContainer>
        </div>
      </div>

      {/* Product Performance Pie Charts */}
      <AdminProductAnalytics onNavigate={onNavigate} />

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={isAddProductModalOpen} 
        onClose={() => setIsAddProductModalOpen(false)} 
      />

      {/* View Users Modal */}
      <ViewUsersModal 
        isOpen={isViewUsersModalOpen} 
        onClose={() => setIsViewUsersModalOpen(false)} 
      />

      <div className="admin-home-footer">
        
      </div>
    </div>
  );
}
