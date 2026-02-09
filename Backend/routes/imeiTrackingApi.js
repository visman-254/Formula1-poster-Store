import express from 'express';
import { imeiController } from '../controllers/imeiTrackingController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All IMEI routes require authentication
router.use(verifyToken);

/**
 * IMEI Tracking Routes
 * IMPORTANT: Fixed-path routes must come BEFORE parameterized routes
 */

// Validate an IMEI (MUST be before /:variantId)
router.post('/validate', imeiController.validateIMEI);

// Reserve an IMEI for an order
router.post('/reserve', imeiController.reserveIMEI);

// Mark IMEI as used
router.post('/mark-used', imeiController.markIMEIAsUsed);

// Auto-assign available IMEI
router.post('/auto-assign', imeiController.autoAssignIMEI);

// Get IMEIs for an order
router.get('/order/:orderId', imeiController.getOrderIMEIs);

// Release IMEIs for cancelled order
router.post('/release/:orderId', imeiController.releaseIMEIs);

// Add IMEIs to a variant (MUST be after fixed-path routes)
router.post('/:variantId', imeiController.addIMEIs);

// Bulk add IMEIs from text
router.post('/:variantId/bulk', imeiController.bulkAddIMEIs);

// Get all IMEIs for a variant
router.get('/:variantId', imeiController.getVariantIMEIs);

// Get available count for a variant
router.get('/:variantId/count', imeiController.getAvailableCount);

// Delete an IMEI
router.delete('/:imeiId', imeiController.deleteIMEI);

export default router;
