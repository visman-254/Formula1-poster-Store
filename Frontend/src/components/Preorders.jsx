import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import API_BASE from "../config";
import { useUser } from "../context/UserContext";

const Preorders = () => {
  const { token } = useUser();
  const [preorders, setPreorders] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPreorders = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/preorders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPreorders(data);
    } catch (err) {
      console.error("Error fetching preorders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreorders();
  }, [token]);

  const handleStatusChange = async (preorderId, newStatus) => {
    try {
      // You might want to create this endpoint in your backend
      await axios.patch(
        `${API_BASE}/api/preorders/${preorderId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchPreorders(); // Refetch to show updated status
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating status. Try again.");
    }
  };

  const filteredPreorders = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return preorders;

    return preorders.filter(preorder =>
      String(preorder.product_title).toLowerCase().includes(needle) ||
      String(preorder.email).toLowerCase().includes(needle) ||
      String(preorder.phone_number).toLowerCase().includes(needle)
    );
  }, [preorders, q]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "fulfilled":
        return "bg-green-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  if (loading) {
    return <p>Loading preorders...</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Preorders</h2>

      <Input
        placeholder="Search preorders..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4"
      />

      {filteredPreorders.length === 0 ? (
        <p className="text-center text-gray-500">No preorders found.</p>
      ) : (
        <ScrollArea className="h-[600px] pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPreorders.map((preorder) => (
                <TableRow key={preorder.preorder_id}>
                  <TableCell>
                    {preorder.product_title} ({preorder.variant_color})
                  </TableCell>
                  <TableCell>
                    <div>{preorder.username || "Guest"}</div>
                    <div>{preorder.email}</div>
                    <div>{preorder.phone_number}</div>
                  </TableCell>
                  <TableCell>{preorder.quantity}</TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(value) => handleStatusChange(preorder.preorder_id, value)}
                      defaultValue={preorder.status}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          <Badge className={getStatusColor(preorder.status)}>{preorder.status}</Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="fulfilled">Fulfilled</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(preorder.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
};

export default Preorders;
