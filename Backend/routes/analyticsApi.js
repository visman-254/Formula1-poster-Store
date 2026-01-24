import express from "express";
import { getProductSalesVolumeController, getProductProfitController, getProductRevenueController, getProductPerformanceController, getTotalRevenueController, getTotalMonthlySalesController, getTotalDailySalesController } from "../controllers/analyticsContoller.js";

const router = express.Router();

router.get("/total-revenue", getTotalRevenueController);
router.get("/daily-sales", getTotalDailySalesController);
router.get("/monthly-sales", getTotalMonthlySalesController);
router.get("/product-sales-volume", getProductSalesVolumeController);
router.get("/product-profit", getProductProfitController);
router.get("/product-revenue", getProductRevenueController);
router.get("/product-performance", getProductPerformanceController);

export default router;
