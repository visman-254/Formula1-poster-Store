import React, { useState, useEffect } from "react";
import { fetchMonthlyProfit } from "../api/analyticsProfit";
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

const ProfitMonthly = () => {
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    fetchMonthlyProfit().then((data) => setMonthly(data));
  }, []);

  const sortedMonthly = [...monthly].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  return (
    <Card data-radix-card="" className="font-sans bg-glass ">
      <CardHeader data-radix-card-header="">
        <CardTitle data-radix-card-title="">Monthly Profit</CardTitle>
      </CardHeader>
      <CardContent data-radix-card-content="">
        <p className="text-3xl font-bold">Kshs {monthly[0]?.total_profit || 0}</p>
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedMonthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="order_date" 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `Kshs ${value}`}
              />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="total_profit" 
                stroke="#343d37" 
                fill="#343d37" 
                fillOpacity={0.2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitMonthly;