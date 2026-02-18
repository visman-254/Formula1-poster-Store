import { imeiService } from '../services/imeiTracking.js';

/**
 * IMEI Tracking Controller
 * Handles HTTP requests for IMEI management
 */

// Admin middleware (you may need to adjust based on your auth system)
const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated and is admin
    // This is a placeholder - adjust based on your auth middleware
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Add your JWT verification here
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const imeiController = {
  /**
   * Add IMEI numbers to a variant
   * POST /api/imei/:variantId
   */
  addIMEIs: async (req, res) => {
    try {
      const { variantId } = req.params;
      const { imeis } = req.body;

      console.log(`[IMEI Controller] addIMEIs called with variantId: ${variantId}, imeis:`, imeis);

      if (!imeis || !Array.isArray(imeis) || imeis.length === 0) {
        return res.status(400).json({ error: 'IMEI array is required' });
      }

      const result = await imeiService.addIMEIs(parseInt(variantId), imeis);

      console.log(`[IMEI Controller] addIMEIs result:`, result);

      if (!result.success) {
        return res.status(400).json({
          error: 'Some IMEIs could not be added',
          ...result
        });
      }

      res.status(201).json({
        message: `Successfully added ${result.count} IMEI(s)`,
        ...result
      });
    } catch (err) {
      console.error('[IMEI Controller] Error adding IMEIs:', err);
      res.status(500).json({ error: 'Failed to add IMEIs' });
    }
  },

  /**
   * Bulk add IMEIs from text (comma or newline separated)
   * POST /api/imei/:variantId/bulk
   */
  bulkAddIMEIs: async (req, res) => {
    try {
      const { variantId } = req.params;
      const { imeiText } = req.body;

      console.log(`[IMEI Controller] bulkAddIMEIs called with variantId: ${variantId}, imeiText length: ${imeiText?.length}`);

      if (!imeiText || typeof imeiText !== 'string') {
        return res.status(400).json({ error: 'IMEI text is required' });
      }

      const result = await imeiService.bulkAddIMEIs(parseInt(variantId), imeiText);

      console.log(`[IMEI Controller] bulkAddIMEIs result:`, result);

      if (!result.success) {
        return res.status(400).json({
          error: 'Some errors occurred while adding IMEIs',
          ...result
        });
      }

      res.status(201).json({
        message: `Added ${result.added} IMEI(s)`,
        duplicates: result.duplicates,
        errors: result.errors
      });
    } catch (err) {
      console.error('[IMEI Controller] Error bulk adding IMEIs:', err);
      res.status(500).json({ error: 'Failed to add IMEIs' });
    }
  },

  /**
   * Get all IMEIs for a variant
   * GET /api/imei/:variantId
   */
  getVariantIMEIs: async (req, res) => {
    try {
      const { variantId } = req.params;
      const { status } = req.query;

      const imeis = await imeiService.getVariantIMEIs(
        parseInt(variantId),
        status || null
      );

      const availableCount = await imeiService.getAvailableCount(parseInt(variantId));

      res.json({
        variantId: parseInt(variantId),
        availableCount,
        totalCount: imeis.length,
        imeis
      });
    } catch (err) {
      console.error('Error fetching variant IMEIs:', err);
      res.status(500).json({ error: 'Failed to fetch IMEIs' });
    }
  },

  /**
   * Validate an IMEI number
   * POST /api/imei/validate
   */
  validateIMEI: async (req, res) => {
    try {
      const { imeiNumber, variantId, productId } = req.body;

      console.log('=== IMEI VALIDATION REQUEST ===');
      console.log('Received body:', req.body);
      console.log('imeiNumber:', imeiNumber, 'type:', typeof imeiNumber);
      console.log('variantId:', variantId, 'type:', typeof variantId);
      console.log('productId:', productId, 'type:', typeof productId);

      // Handle all falsy values
      if (imeiNumber === null || imeiNumber === undefined || imeiNumber === '') {
        console.log('ERROR: IMEI number is missing');
        return res.status(400).json({ error: 'IMEI number is required' });
      }

      const trimmedImei = String(imeiNumber).trim();
      
      // Allow any non-empty IMEI
      // if (trimmedImei.length < 5) {
      //   console.log('ERROR: IMEI too short');
      //   return res.status(400).json({ error: 'IMEI number is too short' });
      // }

      // Handle variantId - can be null/undefined (optional)
      let parsedVariantId = null;
      if (variantId !== null && variantId !== undefined && variantId !== '') {
        if (typeof variantId === 'number') {
          parsedVariantId = variantId;
        } else if (typeof variantId === 'string') {
          parsedVariantId = parseInt(variantId, 10);
        }
      }
      
      // Handle productId - can be null/undefined (optional)
      let parsedProductId = null;
      if (productId !== null && productId !== undefined && productId !== '') {
        if (typeof productId === 'number') {
          parsedProductId = productId;
        } else if (typeof productId === 'string') {
          parsedProductId = parseInt(productId, 10);
        }
      }
      
      console.log('Calling validateIMEI service with:', trimmedImei, parsedVariantId, parsedProductId);
      
      const result = await imeiService.validateIMEI(trimmedImei, parsedVariantId, parsedProductId);
      console.log('Validation result:', result);

      res.json({
        imei: trimmedImei,
        requestedVariantId: variantId,
        requestedProductId: productId,
        ...result
      });
    } catch (err) {
      console.error('Error validating IMEI:', err);
      res.status(500).json({ error: 'Failed to validate IMEI' });
    }
  },

  /**
   * Reserve an IMEI for an order
   * POST /api/imei/reserve
   */
  reserveIMEI: async (req, res) => {
    try {
      const { imeiNumber, orderId, variantId } = req.body;

      if (!imeiNumber || !orderId || !variantId) {
        return res.status(400).json({ error: 'IMEI number, order ID, and variant ID are required' });
      }

      const result = await imeiService.reserveIMEI(imeiNumber, parseInt(orderId), parseInt(variantId));

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({ message: 'IMEI reserved successfully', ...result });
    } catch (err) {
      console.error('Error reserving IMEI:', err);
      res.status(500).json({ error: 'Failed to reserve IMEI' });
    }
  },

  /**
   * Mark IMEI as used
   * POST /api/imei/mark-used
   */
  markIMEIAsUsed: async (req, res) => {
    try {
      const { imeiNumber, orderId } = req.body;

      if (!imeiNumber || !orderId) {
        return res.status(400).json({ error: 'IMEI number and order ID are required' });
      }

      const result = await imeiService.markIMEIAsUsed(imeiNumber, parseInt(orderId));

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({ message: 'IMEI marked as used', ...result });
    } catch (err) {
      console.error('Error marking IMEI as used:', err);
      res.status(500).json({ error: 'Failed to mark IMEI as used' });
    }
  },

  /**
   * Release reserved IMEIs (for cancelled orders)
   * POST /api/imei/release/:orderId
   */
  releaseIMEIs: async (req, res) => {
    try {
      const { orderId } = req.params;

      const result = await imeiService.releaseIMEIs(parseInt(orderId));

      res.json({
        message: `Released ${result.count} IMEI(s)`,
        ...result
      });
    } catch (err) {
      console.error('Error releasing IMEIs:', err);
      res.status(500).json({ error: 'Failed to release IMEIs' });
    }
  },

  /**
   * Get IMEIs for an order
   * GET /api/imei/order/:orderId
   */
  getOrderIMEIs: async (req, res) => {
    try {
      const { orderId } = req.params;

      const imeis = await imeiService.getOrderIMEIs(parseInt(orderId));

      res.json({
        orderId: parseInt(orderId),
        imeis
      });
    } catch (err) {
      console.error('Error fetching order IMEIs:', err);
      res.status(500).json({ error: 'Failed to fetch order IMEIs' });
    }
  },

  /**
   * Delete an IMEI
   * DELETE /api/imei/:imeiId
   */
  deleteIMEI: async (req, res) => {
    try {
      const { imeiId } = req.params;

      const result = await imeiService.deleteIMEI(parseInt(imeiId));

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({ message: 'IMEI deleted successfully', ...result });
    } catch (err) {
      console.error('Error deleting IMEI:', err);
      res.status(500).json({ error: 'Failed to delete IMEI' });
    }
  },

  /**
   * Auto-assign available IMEI
   * POST /api/imei/auto-assign
   */
  autoAssignIMEI: async (req, res) => {
    try {
      const { variantId, orderId } = req.body;
      
      console.log('=== IMEI AUTO-ASSIGN ===');
      console.log('Received body:', req.body);
      console.log('variantId:', variantId, 'type:', typeof variantId);
      console.log('orderId:', orderId, 'type:', typeof orderId);

      // Handle all falsy values (null, undefined, '', 0)
      if (variantId === null || variantId === undefined || variantId === '') {
        console.log('ERROR: Variant ID is missing or empty');
        return res.status(400).json({ error: 'Variant ID is required' });
      }

      // Try to parse variantId as integer
      let parsedVariantId;
      if (typeof variantId === 'number') {
        parsedVariantId = variantId;
      } else if (typeof variantId === 'string') {
        parsedVariantId = parseInt(variantId, 10);
      } else {
        console.log('ERROR: Invalid variantId type:', typeof variantId);
        return res.status(400).json({ error: 'Invalid variant ID' });
      }

      if (isNaN(parsedVariantId) || parsedVariantId <= 0) {
        console.log('ERROR: Invalid variant ID after parsing:', parsedVariantId);
        return res.status(400).json({ error: 'Invalid variant ID' });
      }

      // orderId can be 0 or null (temporary reservation for POS cart)
      const parsedOrderId = (orderId === null || orderId === undefined || orderId === '') 
        ? 0 
        : parseInt(orderId, 10);
      console.log('parsedVariantId:', parsedVariantId, 'parsedOrderId:', parsedOrderId);

      const result = await imeiService.autoAssignIMEI(parsedVariantId, parsedOrderId);
      console.log('Service result:', result);

      if (!result) {
        console.log('INFO: No available IMEIs for variant', parsedVariantId);
        // Return 200 with null IMEI instead of 400 - this is not an error
        return res.json({
          message: 'No available IMEIs',
          imei: null,
          imeiId: null
        });
      }

      res.json({
        message: 'IMEI auto-assigned successfully',
        ...result
      });
    } catch (err) {
      console.error('Error auto-assigning IMEI:', err);
      res.status(500).json({ error: 'Failed to auto-assign IMEI' });
    }
  },

  /**
   * Get available IMEI count for a variant
   * GET /api/imei/:variantId/count
   */
  getAvailableCount: async (req, res) => {
    try {
      const { variantId } = req.params;

      const count = await imeiService.getAvailableCount(parseInt(variantId));

      res.json({
        variantId: parseInt(variantId),
        availableCount: count
      });
    } catch (err) {
      console.error('Error counting available IMEIs:', err);
      res.status(500).json({ error: 'Failed to count available IMEIs' });
    }
  }
};

export default imeiController;
