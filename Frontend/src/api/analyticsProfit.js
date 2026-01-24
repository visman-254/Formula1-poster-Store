import axios from 'axios';
import API_BASE from '../config';

export const fetchDailyProfit = async () => 
    axios.get(`${API_BASE}/api/profit/total-daily-profit`).then(res => res.data);

export const fetchMonthlyProfit = async () => 
    axios.get(`${API_BASE}/api/profit/total-monthly-profit`).then(res => res.data);

export const fetchProfitAnalytics = async () => 
    axios.get(`${API_BASE}/api/profit/profit-analytics`).then(res => res.data);