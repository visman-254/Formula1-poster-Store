import express from 'express';
import * as preorderController from '../controllers/preorderController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== PUBLIC ROUTES (no authentication required) =====
// Public route - anyone can submit a preorder
router.post('/preorders', preorderController.createPreorder);

// Public route - anyone can view available preorder products
router.get('/preorder-products', preorderController.getPreorderProducts);

// ===== ADMIN ROUTES (require authentication) =====
// Admin routes - require authentication and admin privileges
router.get('/preorders', verifyToken, verifyAdmin, preorderController.getPreorders);
router.get('/preorders/:preorderId', verifyToken, verifyAdmin, preorderController.getPreorderById);
router.get('/preorders/search', verifyToken, verifyAdmin, preorderController.searchPreorders);
router.patch('/preorders/:preorderId/status', verifyToken, verifyAdmin, preorderController.updateStatus);
router.delete('/preorders/:preorderId', verifyToken, verifyAdmin, preorderController.deletePreorder);

// ===== ADMIN: CREATE PREORDER PRODUCT (ADD THIS) =====
router.post('/preorder-products', verifyToken, verifyAdmin, preorderController.createPreorderProduct);

export default router;