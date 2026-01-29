import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import {
  fetchProductSalesVolume,
  fetchProductProfit,
  fetchProductRevenue,
} from "../api/analytics";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

const ProductAnalytics = () => {
  const [salesVolume, setSalesVolume] = useState([]);
  const [profit, setProfit] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [viewMode, setViewMode] = useState("pie");
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
                .filter((d) => Math.abs(Number(d[key]) || 0) >= 1) // Added Number() cast for safety
                .slice(0, 8)
                .map((item) => ({
                  name:
                    item.product_name?.length > 18
                      ? item.product_name.slice(0, 18) + "…"
                      : item.product_name || "Unknown",
                  value: Number(item[key]), // Ensure value is a number
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

  const formatCurrency = (v) => `KES ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="p-6 text-center">Loading analytics…</div>;
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("pie")}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === "pie" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Pie Charts
          </button>
          <button
            onClick={() => setViewMode("bar")}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === "bar" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Bar Charts
          </button>
        </div>
      </div>

      {/* ================= PIE VIEW ================= */}
      {viewMode === "pie" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* SALES */}
          <AnalyticsPieCard
            title="Sales Volume"
            data={salesVolume}
            totalLabel={`Total Units Sold: ${total(salesVolume)}`}
          />

          {/* PROFIT */}
          <AnalyticsPieCard
            title="Profit"
            data={profit}
            totalLabel={`Total Profit: ${formatCurrency(total(profit))}`}
            negativeAware
            formatter={formatCurrency}
          />

          {/* REVENUE */}
          <AnalyticsPieCard
            title="Revenue"
            data={revenue}
            totalLabel={`Total Revenue: ${formatCurrency(total(revenue))}`}
            formatter={formatCurrency}
          />
        </div>
      )}

      {/* ================= BAR VIEW ================= */}
      {viewMode === "bar" && (
        <div className="space-y-8">
          {[
            { title: "Sales Volume", data: salesVolume, fill: "#8884d8", formatter: (val) => val },
            { title: "Profit", data: profit, fill: "#82ca9d", formatter: formatCurrency },
            { title: "Revenue", data: revenue, fill: "#ffc658", formatter: formatCurrency },
          ].map(({ title, data, fill, formatter }) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full min-h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-30}
                        textAnchor="end"
                        height={70}
                        interval={0}
                        fontSize={12}
                      />
                      <YAxis tickFormatter={(val) => val > 1000 ? `${val/1000}k` : val} />
                      <Tooltip formatter={formatter} />
                      <Bar dataKey="value" fill={fill} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================= REUSABLE PIE CARD ================= */

const AnalyticsPieCard = ({
  title,
  data,
  totalLabel,
  formatter,
  negativeAware,
}) => (
  <Card className="flex flex-col">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-80 w-full min-h-[320px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                label={({ percent }) =>
                  percent > 0.05
                    ? `${(percent * 100).toFixed(0)}%`
                    : null
                }
              >
                {data.map((item, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={
                      negativeAware && item.value < 0
                        ? "#FF7C7C"
                        : COLORS[i % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip formatter={formatter} />
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 italic">
            No data available for this metric
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm font-bold text-gray-800">{totalLabel}</p>
      </div>
    </CardContent>
  </Card>
);

export default ProductAnalytics;