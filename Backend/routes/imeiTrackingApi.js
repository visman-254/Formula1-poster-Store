import express from 'express';
import { imeiController } from '../controllers/imeiTrackingController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All IMEI routes require authentication
router.use(verifyToken);

/**
 * IMEI Tracking Routes
 */

// Add IMEIs to a variant
router.post('/:variantId', imeiController.addIMEIs);

// Bulk add IMEIs from text
router.post('/:variantId/bulk', imeiController.bulkAddIMEIs);

// Get all IMEIs for a variant
router.get('/:variantId', imeiController.getVariantIMEIs);

// Get available count for a variant
router.get('/:variantId/count', imeiController.getAvailableCount);

// Validate an IMEI
router.post('/validate', imeiController.validateIMEI);

// Reserve an IMEI for an order
router.post('/reserve', imeiController.reserveIMEI);

// Mark IMEI as used
router.post('/mark-used', imeiController.markIMEIAsUsed);

// Auto-assign available IMEI
router.post('/auto-assign', imeiController.autoAssignIMEI);

// Release IMEIs for cancelled order
router.post('/release/:orderId', imeiController.releaseIMEIs);

// Get IMEIs for an order
router.get('/order/:orderId', imeiController.getOrderIMEIs);

// Delete an IMEI
router.delete('/:imeiId', imeiController.deleteIMEI);

export default router;
