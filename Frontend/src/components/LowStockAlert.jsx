import React, { useEffect, useState } from 'react';
import { getLowStockProducts } from '../api/stock';
import { TrendingDown, Package, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

const LowStockAlert = () => {
  const [lowStock, setLowStock] = useState([]);
  const STOCK_THRESHOLD = 5;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getLowStockProducts();
        setLowStock(products);
      } catch (error) {
        console.error("Error fetching low stock products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-6 ">
        <div className="max-w-7xl mx-auto ">
          <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center font-sans">
                <RefreshCw className="h-10 w-10 text-gray-400 dark:text-zinc-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-zinc-400 text-lg">Loading Stock Data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (lowStock.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventory Monitor</h1>
            <p className="text-gray-600 dark:text-zinc-400">Samsung Admin Dashboard</p>
          </div>

          {/* Success Card */}
          <Card className="bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-500/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-emerald-600"></div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-2xl text-gray-900 dark:text-white">
                <CheckCircle className="mr-3 h-7 w-7 text-emerald-500" />
                All Systems Operational
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                  <Package className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-gray-700 dark:text-zinc-300 text-base mb-2">
                    Stock levels are healthy across all products.
                  </p>
                  <p className="text-gray-500 dark:text-zinc-500 text-sm">
                    No items currently at or below threshold of <span className="text-gray-900 dark:text-white font-semibold">{STOCK_THRESHOLD} units</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 ">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventory Monitor</h1>
          <p className="text-gray-600 dark:text-zinc-400">Panna Stocks</p>
        </div>

        {/* Alert Summary Card */}
        <Card className="bg-white dark:bg-zinc-900 border-red-200 dark:border-red-500/30 overflow-hidden relative mb-6">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600"></div>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-2xl text-gray-900 dark:text-white">
              <div className="flex items-center">
                <AlertTriangle className="mr-3 h-7 w-7 text-red-500 animate-pulse" />
                Low Stock Alert
              </div>
              <span className="text-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-4 py-1 rounded-full font-semibold">
                {lowStock.length} {lowStock.length === 1 ? 'Item' : 'Items'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4 mb-4">
              <div className="flex-shrink-0 p-3 bg-red-100 dark:bg-red-500/10 rounded-lg">
                <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <p className="text-gray-700 dark:text-zinc-300 text-base mb-2">
                  Critical stock levels detected. Immediate restocking recommended.
                </p>
                <p className="text-gray-500 dark:text-zinc-500 text-sm">
                  Products below threshold of <span className="text-gray-900 dark:text-white font-semibold">{STOCK_THRESHOLD} units</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lowStock.map((product) => (
            <Card
              key={product.product_id}
              className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/5"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-base mb-1 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-gray-500 dark:text-zinc-500 text-xs">
                      ID: {product.product_id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-zinc-800">
                  <span className="text-gray-600 dark:text-zinc-400 text-sm">Stock Level</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${
                      product.stock === 0 ? 'text-red-600 dark:text-red-500' : 
                      product.stock <= 2 ? 'text-orange-600 dark:text-orange-500' : 
                      'text-yellow-600 dark:text-yellow-500'
                    }`}>
                      {product.stock}
                    </span>
                    <span className="text-gray-500 dark:text-zinc-500 text-sm">units</span>
                  </div>
                </div>

                {/* Stock Status Bar */}
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        product.stock === 0 ? 'bg-red-600 dark:bg-red-500' :
                        product.stock <= 2 ? 'bg-orange-600 dark:bg-orange-500' :
                        'bg-yellow-600 dark:bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((product.stock / STOCK_THRESHOLD) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LowStockAlert;