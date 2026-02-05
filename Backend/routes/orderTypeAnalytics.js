import express from "express";
import {
  getPOSDailySalesController,
  getOnlineDailySalesController,
  getPOSMonthlySalesController,
  getOnlineMonthlySalesController,
  getSalesByOrderTypeController,
  getOrderTypeDailyComparisonController,
  getPOSDailyProfitController,
  getOnlineDailyProfitController,
  getPOSMonthlyProfitController,
  getOnlineMonthlyProfitController,
  getProfitByOrderTypeController,
} from "../controllers/OrderTypeAnalyticsController.js";

const router = express.Router();

// Sales endpoints
router.get("/pos-daily-sales", getPOSDailySalesController);
router.get("/online-daily-sales", getOnlineDailySalesController);
router.get("/pos-monthly-sales", getPOSMonthlySalesController);
router.get("/online-monthly-sales", getOnlineMonthlySalesController);
router.get("/sales-by-order-type", getSalesByOrderTypeController);
router.get("/order-type-daily-comparison", getOrderTypeDailyComparisonController);

// Profit endpoints
router.get("/pos-daily-profit", getPOSDailyProfitController);
router.get("/online-daily-profit", getOnlineDailyProfitController);
router.get("/pos-monthly-profit", getPOSMonthlyProfitController);
router.get("/online-monthly-profit", getOnlineMonthlyProfitController);
router.get("/profit-by-order-type", getProfitByOrderTypeController);

export default router;