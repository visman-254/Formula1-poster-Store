
import express from "express";
import { fetchProfitAnalytics } from "../controllers/ProfitAnalyticsController.js";
import { fetchTotalDailyProfit } from "../controllers/ProfitAnalyticsController.js";
import { fetchTotalMonthlyProfit } from "../controllers/ProfitAnalyticsController.js";

const router = express.Router();

router.get("/profit-analytics",  fetchProfitAnalytics);
router.get("/total-daily-profit",  fetchTotalDailyProfit);
router.get("/total-monthly-profit",  fetchTotalMonthlyProfit);

export default router;


