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
  const { orders, error, refetch } = useOrders(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders;

    return orders.filter(order =>
      String(order.id).toLowerCase().includes(needle) ||
      String(order.status).toLowerCase().includes(needle) ||
      (order.user && String(order.user.username || "").toLowerCase().includes(needle)) ||
      (order.user && String(order.user.email || "").toLowerCase().includes(needle))
    );
  }, [orders, q]);

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

  const groupItems = (items) => {
    const groups = {};
    items.forEach(item => {
      const key = item.bundle_variant_id || `single-${item.variant_id}`;
      if (!groups[key]) {
        groups[key] = {
          items: [],
          is_bundle: !!item.bundle_variant_id,
          total_quantity: 0,
          total_price: 0,
          names: [],
          images: []
        };
      }
      groups[key].items.push(item);
      groups[key].total_quantity += item.quantity;
      groups[key].total_price += parseFloat(item.price) || 0;
      groups[key].names.push(item.name);
      if (item.image) groups[key].images.push(item.image);
    });
    return Object.values(groups);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Orders</h2>

      <Input
        placeholder="Search orders..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 text-green-600"
      />

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        <ScrollArea className="h-[600px] pr-4">
          <div className="min-h-screen bg-glass p-4 grid grid-cols-1 gap-4">
            {filtered.map((order) => {
              const displayStatus = order.order_type === 'pos' ? 'delivered' : order.status;

              return (
              <Card key={order.id} className="shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-center ">
                    <div className="flex items-center gap-2">
                      <CardTitle>Order #{order.id}</CardTitle>
                      {order.order_type === 'pos' && (
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
                  <div className="mb-4 flex items-center gap-2">
                    <span className="font-semibold">Update Status:</span>
                    <Select
                      onValueChange={(value) =>
                        handleStatusChange(order.id, value)
                      }
                      defaultValue={displayStatus}
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
                  
                  
                  {order.items?.length > 0 ? (
                    <div className="mb-4">
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
                              <TableRow key={group.items[0].variant_id}>
                                <TableCell data-label="Product" className="flex items-center gap-2">
                                  {group.images.map((img, idx) => (
                                    <img key={idx} src={img} alt={group.names[idx]} className="w-10 h-10 object-cover rounded-md" />
                                  ))}
                                  {group.is_bundle ? `Bundle: ${group.names.join(' + ')}` : group.names[0]}
                                </TableCell>
                                <TableCell data-label="Quantity">x{group.total_quantity}</TableCell>
                                <TableCell data-label="Price">Kshs {group.total_price.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
                      <p className="font-semibold">⚠️ Item Data Missing or Empty</p>
                      <p className="text-sm">
                        This order shows no items. Check the backend response for Order #{order.id}.
                        (order.items is: {order.items ? 'empty array' : 'undefined/null'})
                      </p>
                    </div>
                  )}
               
                  {order.paid_for_delivery ? (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">Delivery Details</h4>
                      <div className="text-sm">
                        <p>Fee: Kshs {parseFloat(order.delivery_fee).toFixed(2)}</p>
                        <p>Address: {order.delivery_address}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">No delivery for this order.</p>
                    </div>
                  )}
               
                  <p className="mt-4 font-bold text-right">
                    Total: Kshs {order.total}
                  </p>
                </CardContent>
              </Card>
            )})}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default OrderItems;