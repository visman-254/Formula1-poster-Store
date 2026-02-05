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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SalesByOrderType = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/order-type-analytics/sales-by-order-type`)
      .then(res => {
        console.log("API Response:", res.data); // Debug log
        
        // Check if data exists and is an array
        if (Array.isArray(res.data) && res.data.length > 0) {
          setData(res.data);
        } else {
          console.warn("No valid data received from API");
          setData([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching order type data:", err);
        setError("Failed to load sales data");
        setLoading(false);
        setData([]);
      });
  }, []);

  // Process and validate data
  const processedData = React.useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const totalRevenue = data.reduce((sum, item) => {
      const revenue = Number(item.total_revenue) || 0;
      return sum + revenue;
    }, 0);

    return data.map((item, index) => {
      const revenue = Number(item.total_revenue) || 0;
      const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      
      // Map order_type to display name
      let name = "Unknown";
      if (item.order_type === 'pos') name = 'POS';
      else if (item.order_type === 'online') name = 'Online';
      else if (item.order_type) name = String(item.order_type).toUpperCase();

      return {
        ...item,
        name: name,
        value: revenue, // Use 'value' key for consistency with PieChart
        total_revenue: revenue,
        percentage: Number(percentage.toFixed(1)),
        order_count: Number(item.order_count) || 0,
        total_quantity: Number(item.total_quantity) || 0,
        color: COLORS[index % COLORS.length]
      };
    });
  }, [data]);

  const totalRevenue = processedData.reduce((sum, item) => sum + (item.value || 0), 0);

  if (loading) {
    return (
      <Card className="font-sans bg-glass">
        <CardHeader>
          <CardTitle>Sales Distribution by Order Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-gray-500">Loading data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="font-sans bg-glass">
        <CardHeader>
          <CardTitle>Sales Distribution by Order Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-red-600">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="font-sans bg-glass">
      <CardHeader>
        <CardTitle>Sales Distribution by Order Type</CardTitle>
      </CardHeader>
      <CardContent>
        {processedData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-gray-500">No data available</div>
          </div>
        ) : (
          <>
            {/* Pie Chart Section */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    innerRadius={40} // Added inner radius for donut style
                    paddingAngle={3} // Added spacing between segments
                    dataKey="value" // Changed to 'value' for consistency
                    nameKey="name"
                  >
                    {processedData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [
                      `Kshs ${Number(value).toLocaleString(undefined, { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}`, 
                      'Revenue'
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

    

            {/* Total Revenue */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-2xl font-bold">
                  Kshs {totalRevenue.toLocaleString(undefined, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesByOrderType;