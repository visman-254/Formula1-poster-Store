// src/components/OrderItems.jsx
import React, { useState, useMemo } from "react";
import { API_URL, getAuthHeaders } from "../api/orders";
import axios from "axios";
import { useOrders } from "../hooks/useOrders";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

import "./OrderItems.css";

const OrderItems = () => {
  const { orders, refetch } = useOrders(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all"); // all | pos | online

  // Filter orders by search query and type
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (orderTypeFilter === "pos") {
      filtered = filtered.filter((o) => o.order_type === "pos");
    } else if (orderTypeFilter === "online") {
      filtered = filtered.filter((o) => o.order_type === "online");
    }

    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return filtered;

    return filtered.filter((order) =>
      String(order.id).toLowerCase().includes(needle) ||
      String(order.status).toLowerCase().includes(needle) ||
      (order.user?.username || "").toLowerCase().includes(needle) ||
      (order.user?.email || "").toLowerCase().includes(needle)
    );
  }, [orders, searchQuery, orderTypeFilter]);

  // Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/${orderId}/status`,
        { status: newStatus },
        getAuthHeaders()
      );
      await refetch();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating status. Try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  const groupItems = (items = []) => {
    const groups = {};
    items.forEach((item) => {
      const key = item.bundle_variant_id || `single-${item.variant_id}`;
      if (!groups[key]) {
        groups[key] = {
          items: [],
          is_bundle: !!item.bundle_variant_id,
          total_quantity: 0,
          total_price: 0,
          names: [],
          images: [],
        };
      }
      groups[key].items.push(item);
      groups[key].total_quantity += item.quantity || 0;
      groups[key].total_price += parseFloat(item.price) || 0;
      groups[key].names.push(item.name);
      if (item.image) groups[key].images.push(item.image);
    });
    return Object.values(groups);
  };

  return (
    <div className="order-items-root">
      <h2 className="text-2xl font-bold mb-4 text-center">Orders</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter} className="w-40">
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pos">POS Orders</SelectItem>
            <SelectItem value="online">Online Orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        <ScrollArea className="h-[600px] pr-4">
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const displayStatus = order.order_type === "pos" ? "delivered" : order.status;

              return (
                <Card key={order.id} className="shadow-md">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle>Order #{order.id}</CardTitle>
                        {order.order_type === "pos" && (
                          <Badge className="bg-blue-600 hover:bg-blue-700">POS</Badge>
                        )}
                      </div>
                      <Badge className={getStatusColor(displayStatus)}>
                        {displayStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.user?.username} ({order.user?.email})
                    </p>
                    {order.mpesa_details?.phone && (
                      <p className="text-sm font-semibold text-blue-600">
                        M-Pesa Phone: {order.mpesa_details.phone}
                      </p>
                    )}
                    {order.mpesa_details?.merchant_request_id && (
                      <p className="text-sm font-semibold text-green-600">
                        Transaction Code: {order.mpesa_details.merchant_request_id}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Date: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </CardHeader>

                  <CardContent>
                    {/* Status Update */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="font-semibold">Update Status:</span>
                      <Select
                        defaultValue={displayStatus}
                        onValueChange={(val) => handleStatusChange(order.id, val)}
                        className="select"
                      >
                        <SelectTrigger className="select-trigger">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Items Table */}
                    {order.items?.length > 0 ? (
                      <Table className="order-items-table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupItems(order.items).map((group) => (
                            <TableRow key={group.items[0]?.variant_id}>
                              <TableCell className="flex items-center gap-2">
                                {group.images.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={group.names[idx]}
                                    className="w-10 h-10 object-cover rounded-md"
                                  />
                                ))}
                                {group.is_bundle
                                  ? `Bundle: ${group.names.join(" + ")}`
                                  : group.names[0]}
                              </TableCell>
                              <TableCell>x{group.total_quantity}</TableCell>
                              <TableCell>Kshs {group.total_price.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="mt-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
                        <p className="font-semibold">⚠️ Item Data Missing</p>
                        <p className="text-sm">This order has no items. Check backend for Order #{order.id}.</p>
                      </div>
                    )}

                    {/* Delivery Info */}
                    {order.paid_for_delivery ? (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold mb-2">Delivery Details</h4>
                        <p>Fee: Kshs {parseFloat(order.delivery_fee).toFixed(2)}</p>
                        <p>Address: {order.delivery_address}</p>
                      </div>
                    ) : (
                      <p className="mt-4 pt-4 border-t text-sm text-gray-500">
                        No delivery for this order.
                      </p>
                    )}

                    <p className="mt-4 font-bold text-right">Total: Kshs {order.total}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default OrderItems;
