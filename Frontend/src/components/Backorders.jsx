import React, { useMemo, useState } from "react";
import { useBackorders } from "../hooks/useBackorders";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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

const Backorders = () => {
  const { backorders, error, refetch } = useBackorders();
  const [q, setQ] = useState("");

  
  const filteredBackorders = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return backorders;

    return backorders.filter((item) =>
     
      String(item.order_id).includes(needle) ||
      item.product_name.toLowerCase().includes(needle) ||
      item.username.toLowerCase().includes(needle)
    );
  }, [backorders, q]);

  return (
    <div>
      
      <h2 className="text-2xl font-bold mb-4 text-center text-black dark:text-white">
        Backordered Items (Fulfillment Priority)
      </h2>

      <Input
        
        placeholder="Search by Order ID, Product Name, or Customer..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 text-amber-700"
      />

      {error && <p className="text-red-500">{error.message}</p>}

      {filteredBackorders.length === 0 ? (
        <p className="text-center text-gray-500">No active backordered items found in pending orders.</p>
      ) : (
        <ScrollArea className="h-[600px] pr-4">
          <Card className="shadow-md">
            <CardContent>
              <Table>
                
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Qty Ordered</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBackorders.map((item) => (
                    
                    <TableRow key={`${item.order_id}-${item.product_id}`}>
                      <TableCell className="font-medium">{item.order_id}</TableCell>
                      <TableCell>{new Date(item.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.username} ({item.email})</TableCell>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-right font-bold text-lg">{item.ordered_quantity}</TableCell>
                      <TableCell className="text-right text-red-600 font-bold">{item.current_product_stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </ScrollArea>
      )}
    </div>
  );
};

export default Backorders;