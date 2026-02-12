import React, { useState, useEffect } from "react";
import { fetchDailyProfit, fetchMonthlyProfit, fetchPOSDailyProfit, fetchOnlineDailyProfit, fetchPOSMonthlyProfit, fetchOnlineMonthlyProfit } from "../api/analyticsProfit";
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
import { Calendar, CalendarRange } from "lucide-react"; 
import { CiFilter } from "react-icons/ci";

const AnalyticsProfit = () => {
  const [dailyProfit, setDailyProfit] = useState([]);
  const [monthlyProfit, setMonthlyProfit] = useState([]);
  const [posDailyProfit, setPOSDailyProfit] = useState([]);
  const [onlineDailyProfit, setOnlineDailyProfit] = useState([]);
  const [posMonthlyProfit, setPOSMonthlyProfit] = useState([]);
  const [onlineMonthlyProfit, setOnlineMonthlyProfit] = useState([]);
  const [profitType, setProfitType] = useState("all"); // 'all', 'pos', 'online'
  const [timePeriod, setTimePeriod] = useState("day"); // 'day', 'monthly'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [allDaily, allMonthly, posDaily, onlineDaily, posMonthly, onlineMonthly] = await Promise.all([
          fetchDailyProfit(),
          fetchMonthlyProfit(),
          fetchPOSDailyProfit(),
          fetchOnlineDailyProfit(),
          fetchPOSMonthlyProfit(),
          fetchOnlineMonthlyProfit()
        ]);
        console.log("DEBUG: Daily Profit Data:", JSON.stringify(allDaily, null, 2));
        console.log("DEBUG: POS Daily Profit:", JSON.stringify(posDaily, null, 2));
        console.log("DEBUG: Online Daily Profit:", JSON.stringify(onlineDaily, null, 2));
        setDailyProfit(allDaily);
        setMonthlyProfit(allMonthly);
        setPOSDailyProfit(posDaily);
        setOnlineDailyProfit(onlineDaily);
        setPOSMonthlyProfit(posMonthly);
        setOnlineMonthlyProfit(onlineMonthly);
      } catch (error) {
        console.error("Error fetching profit data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const sortedDailyProfit = [...dailyProfit].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const sortedMonthlyProfit = [...monthlyProfit].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const sortedPOSDailyProfit = [...posDailyProfit].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const sortedOnlineDailyProfit = [...onlineDailyProfit].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const sortedPOSMonthlyProfit = [...posMonthlyProfit].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const sortedOnlineMonthlyProfit = [...onlineMonthlyProfit].sort(
    (a, b) => new Date(a.order_date) - new Date(b.order_date)
  );

  const getCurrentData = () => {
    if (timePeriod === "day") {
      switch (profitType) {
        case "pos":
          return sortedPOSDailyProfit;
        case "online":
          return sortedOnlineDailyProfit;
        default:
          return sortedDailyProfit;
      }
    } else {
      switch (profitType) {
        case "pos":
          return sortedPOSMonthlyProfit;
        case "online":
          return sortedOnlineMonthlyProfit;
        default:
          return sortedMonthlyProfit;
      }
    }
  };

  const getTotalProfit = () => {
    const data = getCurrentData();
    return data.length > 0 ? data[data.length - 1]?.total_profit || 0 : 0;
  };

  const getTypeLabel = () => {
    switch (profitType) {
      case "pos":
        return "POS";
      case "online":
        return "Online";
      default:
        return "Total";
    }
  };

  const currentData = getCurrentData();

  // Icon button styles
  const iconButtonClass = (isActive) => 
    `p-2 rounded-md transition-colors ${
      isActive 
        ? "bg-gray-600 text-white" 
        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
    }`;

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
        {/* Dynamic title based on time period */}
        <CardTitle data-radix-card-title="">
          {timePeriod === "day" ? "Daily Profit" : "Monthly Profit"}
        </CardTitle>
        <div className="flex gap-2">
          {/* Time Period Filters */}
          <button
            className={iconButtonClass(timePeriod === "day")}
            onClick={() => setTimePeriod("day")}
            title="Daily View"
          >
            <Calendar size={16} />
          </button>
          <button
            className={iconButtonClass(timePeriod === "monthly")}
            onClick={() => setTimePeriod("monthly")}
            title="Monthly View"
          >
            <CalendarRange size={16} />
          </button>
          {/* Filter between All/POS/Online */}
          <div className="relative group ml-2 border-l border-gray-700 pl-2">
            <button
              className={iconButtonClass(true)}
              title="Filter Profit Type"
            >
              <CiFilter size={18} />
            </button>
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-md shadow-lg hidden group-hover:block z-10">
              <button
                className={`block w-full text-left px-4 py-2 text-sm rounded-t-md ${
                  profitType === "all" ? "bg-gray-600 text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setProfitType("all")}
              >
                All Profit
              </button>
              <button
                className={`block w-full text-left px-4 py-2 text-sm ${
                  profitType === "pos" ? "bg-gray-600 text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setProfitType("pos")}
              >
                POS
              </button>
              <button
                className={`block w-full text-left px-4 py-2 text-sm rounded-b-md ${
                  profitType === "online" ? "bg-gray-600 text-white" : "text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setProfitType("online")}
              >
                Online
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent data-radix-card-content="">
        <p className="text-3xl font-bold text-white">Kshs {getTotalProfit().toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-1">{getTypeLabel()} Profit</p>
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
                formatter={(value) => [`Kshs ${value.toLocaleString()}`, 'Profit']}
              />
              <Area 
                type="monotone" 
                dataKey="total_profit" 
                stroke="#ffffff" 
                fill="#ffffff" 
                fillOpacity={0.15} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsProfit;
