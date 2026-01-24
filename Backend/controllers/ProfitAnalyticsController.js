import {
    getProfitAnalytics,
    getTotalDailyProfit,
    getTotalMonthlyProfit,
  

}
from '../services/ProfitAnalytics.js';


export const fetchProfitAnalytics = async (req, res) =>{
    try {
        const totalProfit = await getProfitAnalytics();
        res.json(totalProfit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const fetchTotalDailyProfit = async (req, res) =>{
    try {
        const totalDailyProfit = await getTotalDailyProfit();
        res.json(totalDailyProfit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export const fetchTotalMonthlyProfit = async (req, res) =>{
    try {
        const totalMonthlyProfit = await getTotalMonthlyProfit();
        res.json(totalMonthlyProfit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};




