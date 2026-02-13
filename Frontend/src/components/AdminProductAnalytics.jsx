import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import GlassmorphicContainer from "./GlassmorphicContainer";
import {
  fetchProductSalesVolume,
  fetchProductProfit,
  fetchProductRevenue,
} from "../api/analytics";
import { ArrowRight } from "lucide-react";

/* ========================================
   Clean Neutral High-Contrast Palette
======================================== */
const GREY_COLORS = [
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
  "#e2e8f0",
  "#f1f5f9",
  "#64748b",
];

/* ========================================
   Custom Outside Label (Adjusted Radius)
======================================== */
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
}) => {
  if (percent < 0.03) return null;

  const RADIAN = Math.PI / 180;

  // Reduced offset so top label doesn't hit header
  const radius = outerRadius + 12;

  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#f8fafc"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const AdminProductAnalytics = ({ onNavigate }) => {
  const [salesVolume, setSalesVolume] = useState([]);
  const [profit, setProfit] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [salesData, profitData, revenueData] = await Promise.all([
          fetchProductSalesVolume(),
          fetchProductProfit(),
          fetchProductRevenue(),
        ]);

        const processData = (data, key) =>
          Array.isArray(data)
            ? data
                .filter((d) => Math.abs(Number(d[key]) || 0) >= 1)
                .slice(0, 8)
                .map((item, index) => ({
                  name:
                    item.product_name?.length > 22
                      ? item.product_name.slice(0, 22) + "…"
                      : item.product_name || "Unknown",
                  value: Number(item[key]),
                  color: GREY_COLORS[index % GREY_COLORS.length],
                }))
            : [];

        setSalesVolume(processData(salesData, "total_quantity_sold"));
        setProfit(processData(profitData, "total_profit"));
        setRevenue(processData(revenueData, "total_revenue"));
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const total = (arr) =>
    arr.reduce((sum, item) => sum + (item.value || 0), 0);

  const formatCurrency = (v) =>
    `KES ${Number(v).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  if (loading) {
    return (
      <div className="admin-product-analytics-loading">
        <div className="loading-spinner" />
        <p>Loading product analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-product-analytics-error">
        <p>{error}</p>
      </div>
    );
  }

  const renderPieCard = (title, data, totalValue, isCurrency) => (
    <div className="analytics-pie-card">
      <div className="analytics-pie-header">
        <h3 className="analytics-pie-title">{title}</h3>
        <p className="analytics-pie-total">
          {isCurrency
            ? formatCurrency(totalValue)
            : `Total: ${totalValue.toLocaleString()}`}
        </p>
      </div>

      <div className="analytics-pie-container">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="55%"   
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                labelLine={true}
                label={renderCustomLabel}
              >
                {data.map((item, index) => (
                  <Cell key={`cell-${index}`} fill={item.color} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) =>
                  isCurrency ? formatCurrency(value) : value
                }
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.98)",
                  borderRadius: "10px",
                  border: "none",
                  color: "#0f172a",
                  fontWeight: 600,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                }}
                itemStyle={{ color: "#0f172a" }}
                labelStyle={{ color: "#475569", marginBottom: 6 }}
              />

              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  fontSize: "12px",
                  paddingTop: "14px",
                }}
                formatter={(value) => (
                  <span
                    style={{
                      color: "#e2e8f0",
                      fontWeight: 500,
                    }}
                  >
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="analytics-pie-empty">
            <p>No data available</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="admin-product-analytics">
      <GlassmorphicContainer>
        <div className="analytics-section-header">
          <h2 className="analytics-header-title">
            Product Performance
          </h2>
          <button
            className="analytics-view-all"
            onClick={() =>
              onNavigate && onNavigate("analytics")
            }
          >
            View Full Analytics <ArrowRight size={14} />
          </button>
        </div>

        <div className="analytics-pies-grid">
          {renderPieCard(
            "Sales Volume",
            salesVolume,
            total(salesVolume),
            false
          )}
          {renderPieCard(
            "Revenue",
            revenue,
            total(revenue),
            true
          )}
          {renderPieCard(
            "Profit",
            profit,
            total(profit),
            true
          )}
        </div>
      </GlassmorphicContainer>
    </div>
  );
};

export default AdminProductAnalytics;
