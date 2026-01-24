import express from "express";
import { createNewOrder, getAllOrders,fetchAllOrders,updateOrder, haveBackorders } from "../controllers/OrdersController.js";
import { verifyAdmin, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

//router.post("/", verifyToken, createNewOrder);
router.get("/", verifyToken, getAllOrders);
router.get("/all", verifyToken,verifyAdmin, fetchAllOrders);
router.patch("/:orderId/status", verifyToken, verifyAdmin, updateOrder);
router.get("/backorders", verifyToken, verifyAdmin, haveBackorders);



export default router;