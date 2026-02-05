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
  Legend,
} from "recharts";

const OrderTypeDailyComparison = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/order-type-analytics/order-type-daily-comparison`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching comparison data:", err);
        setLoading(false);
      });
  }, []);

  const totalPos = data.reduce((sum, item) => sum + (item.pos || 0), 0);
  const totalOnline = data.reduce((sum, item) => sum + (item.online || 0), 0);

  return (
    <Card className="font-sans bg-glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>POS vs Online Daily Sales</span>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#8884d8]" />
              POS: Kshs {totalPos.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#82ca9d]" />
              Online: Kshs {totalOnline.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-gray-500">Loading data...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-gray-500">No data available</div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="order_date" 
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(1, Math.floor(data.length / 7))}
                  angle={-30}
                  textAnchor="end"
                  height={70}
                  fontSize={12}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000 ? `Kshs ${(value/1000).toFixed(0)}k` : `Kshs ${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`Kshs ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="pos" 
                  name="POS Sales" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="online" 
                  name="Online Sales" 
                  fill="#82ca9d" 
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

export default OrderTypeDailyComparison;