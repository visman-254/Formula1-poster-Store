import React, { useEffect, useState } from "react";
import { fetchMonthlySales } from "../api/analytics";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const AnalyticsMonthly = () => {
  const [monthlySales, setMonthlySales] = useState([]);

  useEffect(() => {
    fetchMonthlySales().then((data) => {
      setMonthlySales(data);
    });
  }, []);

  const reversedData = [...monthlySales].reverse();

  return (
    <Card data-radix-card="" className="font-sans bg-glass ">
      <CardHeader data-radix-card-header="">
        <CardTitle data-radix-card-title="">Monthly Sales</CardTitle>
      </CardHeader>
      <CardContent data-radix-card-content="">
        <p className="text-3xl font-bold">Kshs {monthlySales[0]?.total_revenue || 0}</p>
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reversedData}>
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
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar 
                dataKey="total_revenue" 
                fill="#8b5cf6" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsMonthly;