import React, { useState, useEffect } from "react";
import { fetchDailyProfit } from "../api/analyticsProfit";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const ProfitAnalyticsDay = () => {
  const [dailyProfit, setDailyProfit] = useState([]);

  useEffect(() => {
    fetchDailyProfit().then((data) => {
      setDailyProfit(data);
    });
  }, []);

  const sortedData = [...dailyProfit].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  return (
    <Card data-radix-card="" className="font-sans bg-glass ">
      <CardHeader data-radix-card-header="">
        <CardTitle data-radix-card-title="">Daily Profit</CardTitle>
      </CardHeader>
      <CardContent data-radix-card-content="">
        <p className="text-3xl font-bold">Kshs {dailyProfit[0]?.total_profit || 0}</p>
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sortedData}>
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
              <Line 
                type="monotone" 
                dataKey="total_profit" 
                stroke="#22c55e" 
                strokeWidth={2} 
                dot={{r: 4}} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitAnalyticsDay;