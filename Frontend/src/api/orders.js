import axios from "axios";
import API_BASE from "../config";

export const API_URL = `${API_BASE}/api/orders`;

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};
console.log("Token:", localStorage.getItem("token"));

export const createOrder = async (orderData) => {
  const res = await axios.post(API_URL, orderData, getAuthHeaders());
  return res.data;
};

export const getOrders = async () => {
  const res = await axios.get(API_URL, getAuthHeaders());
  return res.data;
};

export const getOrderDetails = async (orderId) => {
  const res = await axios.get(`${API_URL}/${orderId}/details`, getAuthHeaders());
  return res.data;
};

export const getUserOrders = async () => {
  const res = await axios.get(`${API_URL}/all`, getAuthHeaders());
  return res.data;
};




export const fetchBackorderedOrders = async () => {
  const res = await axios.get(`${API_BASE}/api/orders/backorders`, getAuthHeaders());
  return res.data;
};