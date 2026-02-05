import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE from "../config";
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

const POSDailySales = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/order-type-analytics/pos-daily-sales`)
      .then(res => {
        const sorted = [...res.data].sort(
          (a, b) => new Date(a.order_date) - new Date(b.order_date)
        );
        setData(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching POS daily sales:", err);
        setLoading(false);
      });
  }, []);

  const latestData = data[data.length - 1];
  const totalSales = data.reduce((sum, item) => sum + (item.total_revenue || 0), 0);

  return (
    <Card className="font-sans bg-glass">
      <CardHeader>
        <CardTitle>POS Daily Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-3xl font-bold">Kshs {latestData?.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0}</p>
            <p className="text-sm text-gray-600">Latest day sales</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Kshs {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-600">Total in period</p>
          </div>
        </div>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-gray-500">Loading data...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-gray-500">No data available</div>
          </div>
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="order_date" 
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(1, Math.floor(data.length / 5))}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  fontSize={12}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000 ? `Kshs ${(value/1000).toFixed(0)}k` : `Kshs ${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`Kshs ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default POSDailySales;