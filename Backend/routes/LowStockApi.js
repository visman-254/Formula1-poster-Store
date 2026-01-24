import express from "express"

import {fetchLowStockProducts } from "../controllers/LowStockController.js"

import{ verifyToken, verifyAdmin } from "../middleware/authMiddleware.js"

const router = express.Router();


router.get("/", verifyToken, verifyAdmin, fetchLowStockProducts);

export default router;