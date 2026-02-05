import axios from "axios";
import API_BASE from "../config";

export const fetchPOSDailySales = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/pos-daily-sales`).then(res => res.data);

export const fetchOnlineDailySales = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/online-daily-sales`).then(res => res.data);

export const fetchPOSMonthlySales = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/pos-monthly-sales`).then(res => res.data);

export const fetchOnlineMonthlySales = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/online-monthly-sales`).then(res => res.data);

export const fetchSalesByOrderType = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/sales-by-order-type`).then(res => res.data);

export const fetchOrderTypeDailyComparison = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/order-type-daily-comparison`).then(res => res.data);

export const fetchPOSDailyProfit = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/pos-daily-profit`).then(res => res.data);

export const fetchOnlineDailyProfit = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/online-daily-profit`).then(res => res.data);

export const fetchPOSMonthlyProfit = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/pos-monthly-profit`).then(res => res.data);

export const fetchOnlineMonthlyProfit = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/online-monthly-profit`).then(res => res.data);

export const fetchProfitByOrderType = async () => 
  axios.get(`${API_BASE}/api/order-type-analytics/profit-by-order-type`).then(res => res.data);