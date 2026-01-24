import { useState, useEffect, useCallback } from "react";
import { getOrders, getUserOrders } from "../api/orders";

export const useOrders = (isUser) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = isUser ? await getOrders() : await getUserOrders();
      console.log("Fetched orders data:", data);
      const sortedOrders = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sortedOrders);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch orders:", err);
    }
  }, [isUser]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, error, refetch: fetchOrders };
};