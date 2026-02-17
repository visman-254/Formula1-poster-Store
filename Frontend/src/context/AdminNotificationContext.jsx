import { createContext, useContext, useEffect, useState } from "react";
import API_BASE from "../config";

const AdminNotificationContext = createContext();

export const AdminNotificationProvider = ({ children }) => {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newPreordersCount, setNewPreordersCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/notifications`);
      const data = await res.json();

      if (data.success) {
        setNewOrdersCount(data.orders);
        setNewPreordersCount(data.preorders);
      }
    } catch (err) {
      console.error("Notification fetch failed", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const resetNewOrdersCount = async () => {
    await fetch(`${API_BASE}/api/admin/orders/mark-seen`, { method: "PATCH" });
    setNewOrdersCount(0);
  };

  const resetNewPreordersCount = async () => {
    await fetch(`${API_BASE}/api/admin/preorders/mark-seen`, { method: "PATCH" });
    setNewPreordersCount(0);
  };

  return (
    <AdminNotificationContext.Provider
      value={{
        newOrdersCount,
        newPreordersCount,
        resetNewOrdersCount,
        resetNewPreordersCount,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotification = () =>
  useContext(AdminNotificationContext);
