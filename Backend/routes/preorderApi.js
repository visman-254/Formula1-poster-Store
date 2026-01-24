import express from 'express';
import * as preorderController from '../controllers/preorderController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - anyone can submit a preorder
router.post('/preorders', preorderController.createPreorder);

// Admin routes - require authentication and admin privileges
router.get('/preorders', verifyToken, verifyAdmin, preorderController.getPreorders);
router.get('/preorders/search', verifyToken, verifyAdmin, preorderController.searchPreorders);
router.patch('/preorders/:preorderId/status', verifyToken, verifyAdmin, preorderController.updateStatus);
router.delete('/preorders/:preorderId', verifyToken, verifyAdmin, preorderController.deletePreorder);

export default router;