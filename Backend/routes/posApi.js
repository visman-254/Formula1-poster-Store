import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import {
  getPOSProducts,
  checkoutAsCashier,
  getReceipt,
  getAllPOSOrders,
  getMySales,
  getCashierSalesAdmin,
  getPOSPaymentStatus, // Add this import
} from "../controllers/posController.js";

const router = express.Router();

// Middleware to verify user is a cashier
const verifyCashier = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: No user in token" });
  }
  if (req.user.role !== "cashier" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Cashier role required" });
  }
  next();
};

// ============= CASHIER ROUTES =============

/**
 * GET /api/pos/products
 * Get all products for POS interface
 * Access: Cashier, Admin
 */
router.get("/products", verifyToken, verifyCashier, getPOSProducts);

/**
 * POST /api/pos/checkout
 * Create POS order and reduce stock immediately
 * Access: Cashier, Admin
 */
router.post("/checkout", verifyToken, verifyCashier, checkoutAsCashier);

/**
 * GET /api/pos/payment-status/:checkoutId
 * Check the status of a POS M-Pesa transaction
 * Access: Cashier, Admin
 */
router.get("/payment-status/:checkoutId", verifyToken, verifyCashier, getPOSPaymentStatus);

/**
 * GET /api/pos/receipt/:orderId
 * Get receipt for a specific POS order
 * Access: Cashier, Admin
 */
router.get("/receipt/:orderId", verifyToken, verifyCashier, getReceipt);

/**
 * GET /api/pos/cashier/sales
 * Get current cashier's sales statistics
 * Access: Cashier (own sales)
 */
router.get("/cashier/sales", verifyToken, verifyCashier, getMySales);

// ============= ADMIN ROUTES =============

/**
 * GET /api/pos/orders
 * Get all POS orders
 * Access: Admin only
 */
router.get("/orders", verifyToken, verifyAdmin, getAllPOSOrders);

/**
 * GET /api/pos/cashier/:cashierId/sales
 * Get specific cashier's sales statistics
 * Access: Admin only
 */
router.get("/cashier/:cashierId/sales", verifyToken, verifyAdmin, getCashierSalesAdmin);

export default router;
