import React, { useState, useEffect } from "react";
import { fetchDailySales } from "../api/analytics";
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

  useEffect(() => {
    fetchDailySales().then((data) => {
      setDailySales(data);
    });
  }, []);

  const sortedSales = [...dailySales].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  return (
    <Card data-radix-card="" className="font-sans bg-glass ">
      <CardHeader data-radix-card-header="">
        <CardTitle data-radix-card-title="">Daily Sales</CardTitle>
      </CardHeader>
      <CardContent data-radix-card-content="">
        <p className="text-3xl font-bold">Kshs {dailySales[0]?.total_revenue || 0}</p>
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedSales}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="order_date" 
                tickLine={false} 
                axisLine={false}
                interval={0}
                angle={-18}
                textAnchor="end"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `Kshs ${value}`}
              />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="total_revenue" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDay;