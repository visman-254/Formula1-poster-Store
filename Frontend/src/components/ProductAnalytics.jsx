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
                .filter((d) => Math.abs(d[key] || 0) >= 1)
                .slice(0, 8)
                .map((item) => ({
                  name:
                    item.product_name?.length > 18
                      ? item.product_name.slice(0, 18) + "…"
                      : item.product_name || "Unknown",
                  value: item[key],
                }))
            : [];

        setSalesVolume(processData(salesData, "total_quantity_sold"));
        setProfit(processData(profitData, "total_profit"));
        setRevenue(processData(revenueData, "total_revenue"));
      } catch {
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const total = (arr) =>
    arr.reduce((sum, item) => sum + (item.value || 0), 0);

  const formatCurrency = (v) => `KES ${Number(v).toFixed(2)}`;

  if (loading) return <div className="p-6">Loading analytics…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("pie")}
            className={`px-4 py-2 rounded ${
              viewMode === "pie" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Pie Charts
          </button>
          <button
            onClick={() => setViewMode("bar")}
            className={`px-4 py-2 rounded ${
              viewMode === "bar" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Bar Charts
          </button>
        </div>
      </div>

      {/* ================= PIE VIEW ================= */}
      {viewMode === "pie" && (
        <div
          className="grid gap-6"
          style={{
            gridAutoFlow: "column",
            gridTemplateRows: "repeat(2, minmax(0, 1fr))",
          }}
        >
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
            { title: "Sales Volume", data: salesVolume, fill: "#8884d8" },
            { title: "Profit", data: profit, fill: "#82ca9d" },
            { title: "Revenue", data: revenue, fill: "#ffc658" },
          ].map(({ title, data, fill }) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer>
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-30}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={fill} />
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
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={70}
              paddingAngle={2}
              label={({ name, percent }) =>
                percent > 0.06
                  ? `${name} (${(percent * 100).toFixed(0)}%)`
                  : null
              }
            >
              {data.map((item, i) => (
                <Cell
                  key={i}
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
              
              wrapperStyle={{ fontSize: "12px", paddingTop: 10 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-sm text-gray-600">{totalLabel}</p>
    </CardContent>
  </Card>
);

export default ProductAnalytics;
