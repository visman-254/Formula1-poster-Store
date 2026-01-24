import React, { useState, useEffect } from "react";
import { getOrders } from "../api/orders";
import { useUser } from "../context/UserContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, Truck, CheckCircle, XCircle, Calendar, ShoppingBag } from "lucide-react";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      getOrders()
        .then(data => {
          console.log('Orders data from API:', data);
          const sortedOrders = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setOrders(sortedOrders);
        })
        .catch((err) => {
          console.error("Failed to fetch orders:", err);
        });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Card className="w-full max-w-md mx-4 shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-6 border border-gray-200 dark:border-gray-800">
              <ShoppingBag className="w-10 h-10 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to view your order history
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        label: "Pending",
        color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        dotColor: "bg-amber-500"
      },
      processing: {
        icon: Package,
        label: "Processing",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        dotColor: "bg-blue-500"
      },
      shipped: {
        icon: Truck,
        label: "Shipped",
        color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        dotColor: "bg-purple-500"
      },
      delivered: {
        icon: CheckCircle,
        label: "Delivered",
        color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800",
        dotColor: "bg-green-500"
      },
      cancelled: {
        icon: XCircle,
        label: "Cancelled",
        color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
        dotColor: "bg-red-500"
      }
    };
    return configs[status] || configs.pending;
  };

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} px-3 py-1.5 font-medium flex items-center gap-2 border`}>
        <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`}></span>
        <Icon className="w-4 h-4" />
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(order => order.status === filter);

  const filterButtons = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-3">
            Order History
          </h1>
          <p className="text-gray-600 dark:text-black text-lg">
            Track and manage all your purchases
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 ${
                filter === btn.value
                  ? "bg-white text-black dark:bg-white dark:text-black shadow-lg"
                  : "bg-white dark:bg-white text-white dark:text-white hover:shadow-md border border-gray-200 dark:border-gray-800"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <CardContent className="py-20 text-center">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-6 border border-gray-200 dark:border-gray-800">
                <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-black dark:text-white mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === "all" ? "Start shopping to see your orders here" : `No ${filter} orders at the moment`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:scale-[1.01] overflow-hidden"
              >
                <CardHeader className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-sm border border-gray-200 dark:border-gray-800">
                        #{order.id}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-black dark:text-white">
                          Order #{order.id}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-3 mb-5">
                      {order.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                          <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <img className="w-full h-full object-cover rounded-lg" src={item.image} alt={item.name} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-black dark:text-white mb-1">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Qty: <span className="font-medium">{item.quantity}</span> × 
                              <span className="font-medium ml-1">Kshs {item.price}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-black dark:text-white">
                              Kshs {(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      Order Total
                    </span>
                    <span className="text-2xl font-bold text-black dark:text-white">
                      Kshs {order.total}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;