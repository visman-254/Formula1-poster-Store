import {
  getPOSDailySales,
  getOnlineDailySales,
  getPOSMonthlySales,
  getOnlineMonthlySales,
  getSalesByOrderType,
  getOrderTypeDailyComparison,
} from "../services/analytics.js";

import {
  getPOSDailyProfit,
  getOnlineDailyProfit,
  getPOSMonthlyProfit,
  getOnlineMonthlyProfit,
  getProfitByOrderType,
} from "../services/ProfitAnalytics.js";

export const getPOSDailySalesController = async (req, res) => {
  try {
    const data = await getPOSDailySales();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOnlineDailySalesController = async (req, res) => {
  try {
    const data = await getOnlineDailySales();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPOSMonthlySalesController = async (req, res) => {
  try {
    const data = await getPOSMonthlySales();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOnlineMonthlySalesController = async (req, res) => {
  try {
    const data = await getOnlineMonthlySales();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSalesByOrderTypeController = async (req, res) => {
  try {
    const data = await getSalesByOrderType();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrderTypeDailyComparisonController = async (req, res) => {
  try {
    const data = await getOrderTypeDailyComparison();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPOSDailyProfitController = async (req, res) => {
  try {
    const data = await getPOSDailyProfit();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOnlineDailyProfitController = async (req, res) => {
  try {
    const data = await getOnlineDailyProfit();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPOSMonthlyProfitController = async (req, res) => {
  try {
    const data = await getPOSMonthlyProfit();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOnlineMonthlyProfitController = async (req, res) => {
  try {
    const data = await getOnlineMonthlyProfit();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfitByOrderTypeController = async (req, res) => {
  try {
    const data = await getProfitByOrderType();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};