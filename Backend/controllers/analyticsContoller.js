import { getTotalRevenue, getTotalMonthlySales, getTotalDailySales,getproductSalesVolume, getProductProfit, getProductRevenue, getProductPerformance } from "../services/analytics.js"; 

export const getTotalRevenueController = async (req, res) => {
    try {
        const totalRevenue = await getTotalRevenue();
        res.json(totalRevenue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTotalMonthlySalesController = async (req, res) => {
    try {
        const totalMonthlySales = await getTotalMonthlySales();
        res.json(totalMonthlySales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTotalDailySalesController = async (req, res) => {
    try {
        const totalDailySales = await getTotalDailySales();
        res.json(totalDailySales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const getProductSalesVolumeController = async (req, res) => {
  try {
    const data = await getproductSalesVolume();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductProfitController = async (req, res) => {
  try {
    const data = await getProductProfit();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductRevenueController = async (req, res) => {
  try {
    const data = await getProductRevenue();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductPerformanceController = async (req, res) => {
  try {
    const data = await getProductPerformance();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};