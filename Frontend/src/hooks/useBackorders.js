import { useState, useEffect, useCallback } from "react";
import {  fetchBackorderedOrders } from "../api/orders";

export const useBackorders = () => {
  const [backorders, setBackorders] = useState([]);
  const [error, setError] = useState(null);

  const getBackorders = useCallback(async () => {
    try {
      // Use the new function that points to the correct orders endpoint
      const data = await fetchBackorderedOrders(); 
      setBackorders(data);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch backorders:", err);
    }
  }, []);

  useEffect(() => {
    getBackorders();
  }, [getBackorders]);

  return { backorders, error, refetch: getBackorders };
};