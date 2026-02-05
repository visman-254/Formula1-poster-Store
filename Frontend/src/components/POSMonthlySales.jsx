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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const POSMonthlySales = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/order-type-analytics/pos-monthly-sales`)
      .then(res => {
        const sorted = [...res.data].reverse();
        setData(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching POS monthly sales:", err);
        setLoading(false);
      });
  }, []);

  const latestData = data[0];
  const totalSales = data.reduce((sum, item) => sum + (item.total_revenue || 0), 0);

  return (
    <Card className="font-sans bg-glass">
      <CardHeader>
        <CardTitle>POS Monthly Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-3xl font-bold">Kshs {latestData?.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0}</p>
            <p className="text-sm text-gray-600">Latest month</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Kshs {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-600">Total sales</p>
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
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="order_date" 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000 ? `Kshs ${(value/1000).toFixed(0)}k` : `Kshs ${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`Kshs ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']}
                />
                <Bar 
                  dataKey="total_revenue" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default POSMonthlySales;