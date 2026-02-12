import axios from 'axios';
import API_BASE from '../config';

export const fetchDailyProfit = async () => 
    axios.get(`${API_BASE}/api/profit/total-daily-profit`).then(res => res.data);

export const fetchMonthlyProfit = async () => 
    axios.get(`${API_BASE}/api/profit/total-monthly-profit`).then(res => res.data);

export const fetchProfitAnalytics = async () => 
    axios.get(`${API_BASE}/api/profit/profit-analytics`).then(res => res.data);

// POS/Online Profit API
export const fetchPOSDailyProfit = async () =>
    axios.get(`${API_BASE}/api/order-type-analytics/pos-daily-profit`).then(res => res.data);

export const fetchOnlineDailyProfit = async () =>
    axios.get(`${API_BASE}/api/order-type-analytics/online-daily-profit`).then(res => res.data);

export const fetchPOSMonthlyProfit = async () =>
    axios.get(`${API_BASE}/api/order-type-analytics/pos-monthly-profit`).then(res => res.data);

export const fetchOnlineMonthlyProfit = async () =>
    axios.get(`${API_BASE}/api/order-type-analytics/online-monthly-profit`).then(res => res.data);