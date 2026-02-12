import React, { useState, useEffect } from "react";
import { fetchDailySales } from "../api/analytics";
import { fetchPOSDailySales, fetchOnlineDailySales } from "../api/orderTypeAnalytics";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const AnalyticsDay = () => {
  const [dailySales, setDailySales] = useState([]);
  const [posSales, setPOSSales] = useState([]);
  const [onlineSales, setOnlineSales] = useState([]);
  const [salesType, setSalesType] = useState("all"); // 'all', 'pos', 'online'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [allData, posData, onlineData] = await Promise.all([
          fetchDailySales(),
          fetchPOSDailySales(),
          fetchOnlineDailySales()
        ]);
        setDailySales(allData);
        setPOSSales(posData);
        setOnlineSales(onlineData);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const sortedSales = [...dailySales].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const sortedPOSSales = [...posSales].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const sortedOnlineSales = [...onlineSales].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const getCurrentData = () => {
    switch (salesType) {
      case "pos":
        return sortedPOSSales;
      case "online":
        return sortedOnlineSales;
      default:
        return sortedSales;
    }
  };

  const getTotalRevenue = () => {
    const data = getCurrentData();
    // Get the most recent date (today) which is at the end after sorting ASC
    return data.length > 0 ? data[data.length - 1]?.total_revenue || 0 : 0;
  };

  const getTypeLabel = () => {
    switch (salesType) {
      case "pos":
        return "POS";
      case "online":
        return "Online";
      default:
        return "All";
    }
  };

  const currentData = getCurrentData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
      </div>
    );
  }

  return (
    <Card data-radix-card="" className="font-sans bg-glass ">
      <CardHeader data-radix-card-header="" className="flex flex-row items-center justify-between">
        <CardTitle data-radix-card-title="">Daily Sales</CardTitle>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              salesType === "all"
                ? "bg-gray-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            onClick={() => setSalesType("all")}
          >
            All Sales
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              salesType === "pos"
                ? "bg-gray-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            onClick={() => setSalesType("pos")}
          >
            POS
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              salesType === "online"
                ? "bg-gray-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            onClick={() => setSalesType("online")}
          >
            Online
          </button>
        </div>
      </CardHeader>
      <CardContent data-radix-card-content="">
        <p className="text-3xl font-bold">Kshs {getTotalRevenue().toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-1">{getTypeLabel()} Sales</p>
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4b5563" />
              <XAxis 
                dataKey="order_date" 
                tickLine={false} 
                axisLine={false}
                interval={0}
                angle={-18}
                textAnchor="end"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `Kshs ${value}`}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #4b5563',
                  color: '#f1f5f9'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="total_revenue" 
                stroke="#9ca3af" 
                fill="#9ca3af" 
                fillOpacity={0.15} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDay;
