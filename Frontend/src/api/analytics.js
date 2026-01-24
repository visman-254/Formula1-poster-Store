import axios from "axios";
import API_BASE from "../config";


export const fetchDailySales = async () => 
    axios.get(`${API_BASE}/api/analytics/daily-sales`).then(res => res.data);

export const fetchMonthlySales = async () => 
    axios.get(`${API_BASE}/api/analytics/monthly-sales`).then(res => res.data);

export const fetchProductSalesVolume = async () => 
    axios.get(`${API_BASE}/api/analytics/product-sales-volume`).then(res => res.data);

export const fetchProductProfit = async () => 
    axios.get(`${API_BASE}/api/analytics/product-profit`).then(res => res.data);

export const fetchProductRevenue = async () => 
    axios.get(`${API_BASE}/api/analytics/product-revenue`).then(res => res.data);
