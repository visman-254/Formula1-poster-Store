import express from "express";
import { createOrder, getOrdersByVariant,fetchFullOrderDetails,fetchUserOrders, } from "../controllers/OrderItemsController.js";
import { verifyToken,verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createOrder);
router.get("/variant/:variantId",verifyToken, getOrdersByVariant);
router.get("/:orderId/details",verifyToken, verifyAdmin, fetchFullOrderDetails);
router.get("/", verifyToken, fetchUserOrders);

export default router;