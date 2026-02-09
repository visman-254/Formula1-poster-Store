import db from '../config/db.js';

/**
 * IMEI Tracking Service
 * Manages IMEI numbers for product variants
 */

export const imeiService = {
  /**
   * Add IMEI numbers to a product variant
   * @param {number} variantId - The variant ID
   * @param {string[]} imeiNumbers - Array of IMEI numbers to add
   * @returns {Promise<{success: boolean, count: number, error?: string}>}
   */
  addIMEIs: async (variantId, imeiNumbers) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const addedCount = 0;
      const errors = [];

      for (const imei of imeiNumbers) {
        const trimmedImei = imei.trim();
        if (!trimmedImei) continue;

        // Check if IMEI already exists
        const [existing] = await connection.execute(
          'SELECT imei_id FROM imei_tracking WHERE imei_number = ?',
          [trimmedImei]
        );

        if (existing.length > 0) {
          errors.push(`IMEI ${trimmedImei} already exists`);
          continue;
        }

        await connection.execute(
          'INSERT INTO imei_tracking (variant_id, imei_number, status) VALUES (?, ?, ?)',
          [variantId, trimmedImei, 'available']
        );
        addedCount++;
      }

      await connection.commit();
      return {
        success: errors.length === 0,
        count: addedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (err) {
      await connection.rollback();
      console.error('Error adding IMEIs:', err);
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Get all IMEIs for a variant
   * @param {number} variantId - The variant ID
   * @param {string} status - Optional status filter (available/reserved/used)
   * @returns {Promise<Array>}
   */
  getVariantIMEIs: async (variantId, status = null) => {
    try {
      let query = 'SELECT * FROM imei_tracking WHERE variant_id = ?';
      const params = [variantId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY imei_id ASC';

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (err) {
      console.error('Error fetching variant IMEIs:', err);
      throw err;
    }
  },

  /**
   * Get available IMEI count for a variant
   * @param {number} variantId - The variant ID
   * @returns {Promise<number>}
   */
  getAvailableCount: async (variantId) => {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM imei_tracking WHERE variant_id = ? AND status = ?',
        [variantId, 'available']
      );
      return rows[0].count;
    } catch (err) {
      console.error('Error counting available IMEIs:', err);
      throw err;
    }
  },

  /**
   * Validate an IMEI number
   * @param {string} imeiNumber - The IMEI number to validate
   * @param {number} variantId - The variant ID (optional, to check specific variant)
   * @returns {Promise<{valid: boolean, status?: string, error?: string}>}
   */
  validateIMEI: async (imeiNumber, variantId = null) => {
    try {
      let query = 'SELECT * FROM imei_tracking WHERE imei_number = ?';
      const params = [imeiNumber.trim()];

      if (variantId) {
        query += ' AND variant_id = ?';
        params.push(variantId);
      }

      const [rows] = await db.execute(query, params);

      if (rows.length === 0) {
        return { valid: false, error: 'IMEI not found' };
      }

      const imei = rows[0];
      return {
        valid: true,
        status: imei.status,
        variant_id: imei.variant_id,
        imei_id: imei.imei_id
      };
    } catch (err) {
      console.error('Error validating IMEI:', err);
      throw err;
    }
  },

  /**
   * Reserve an IMEI for an order
   * @param {string} imeiNumber - The IMEI number
   * @param {number} orderId - The order ID
   * @param {number} variantId - The variant ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  reserveIMEI: async (imeiNumber, orderId, variantId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if IMEI exists and is available
      const [existing] = await connection.execute(
        'SELECT * FROM imei_tracking WHERE imei_number = ? AND status = ? FOR UPDATE',
        [imeiNumber.trim(), 'available']
      );

      if (existing.length === 0) {
        await connection.rollback();
        return { success: false, error: 'IMEI not available' };
      }

      // Reserve the IMEI
      await connection.execute(
        'UPDATE imei_tracking SET status = ?, order_id = ? WHERE imei_id = ?',
        ['reserved', orderId, existing[0].imei_id]
      );

      await connection.commit();
      return { success: true };
    } catch (err) {
      await connection.rollback();
      console.error('Error reserving IMEI:', err);
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Mark IMEI as used (when order is completed/paid)
   * @param {string} imeiNumber - The IMEI number
   * @param {number} orderId - The order ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  markIMEIAsUsed: async (imeiNumber, orderId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if IMEI is reserved for this order
      const [existing] = await connection.execute(
        'SELECT * FROM imei_tracking WHERE imei_number = ? AND order_id = ? FOR UPDATE',
        [imeiNumber.trim(), orderId]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return { success: false, error: 'IMEI not found or not reserved for this order' };
      }

      // Mark as used
      await connection.execute(
        'UPDATE imei_tracking SET status = ?, used_at = CURRENT_TIMESTAMP WHERE imei_id = ?',
        ['used', existing[0].imei_id]
      );

      await connection.commit();
      return { success: true };
    } catch (err) {
      await connection.rollback();
      console.error('Error marking IMEI as used:', err);
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Release reserved IMEIs (when order is cancelled)
   * @param {number} orderId - The order ID
   * @returns {Promise<{success: boolean, count: number}>}
   */
  releaseIMEIs: async (orderId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get all reserved IMEIs for this order
      const [imeis] = await connection.execute(
        'SELECT imei_id FROM imei_tracking WHERE order_id = ? AND status = ? FOR UPDATE',
        [orderId, 'reserved']
      );

      const count = imeis.length;

      // Release them back to available
      await connection.execute(
        'UPDATE imei_tracking SET status = ?, order_id = NULL WHERE order_id = ? AND status = ?',
        ['available', orderId, 'reserved']
      );

      await connection.commit();
      return { success: true, count };
    } catch (err) {
      await connection.rollback();
      console.error('Error releasing IMEIs:', err);
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Get IMEIs for an order
   * @param {number} orderId - The order ID
   * @returns {Promise<Array>}
   */
  getOrderIMEIs: async (orderId) => {
    try {
      const [rows] = await db.execute(
        `SELECT it.*, pv.color, p.title as product_name 
         FROM imei_tracking it 
         JOIN product_variants pv ON it.variant_id = pv.variant_id 
         JOIN products p ON pv.product_id = p.product_id 
         WHERE it.order_id = ? 
         ORDER BY it.imei_id ASC`,
        [orderId]
      );
      return rows;
    } catch (err) {
      console.error('Error fetching order IMEIs:', err);
      throw err;
    }
  },

  /**
   * Delete an IMEI from tracking
   * @param {number} imeiId - The IMEI ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  deleteIMEI: async (imeiId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if IMEI is available or not used
      const [existing] = await connection.execute(
        'SELECT * FROM imei_tracking WHERE imei_id = ? FOR UPDATE',
        [imeiId]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return { success: false, error: 'IMEI not found' };
      }

      if (existing[0].status === 'used') {
        await connection.rollback();
        return { success: false, error: 'Cannot delete used IMEI' };
      }

      await connection.execute('DELETE FROM imei_tracking WHERE imei_id = ?', [imeiId]);
      await connection.commit();
      return { success: true };
    } catch (err) {
      await connection.rollback();
      console.error('Error deleting IMEI:', err);
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Bulk add IMEIs from a text area (comma or newline separated)
   * @param {number} variantId - The variant ID
   * @param {string} imeiText - Text containing IMEI numbers
   * @returns {Promise<{success: boolean, added: number, duplicates: number, errors: string[]}>}
   */
  bulkAddIMEIs: async (variantId, imeiText) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Split by comma or newline
      const imeiNumbers = imeiText.split(/[,\n]+/).map(i => i.trim()).filter(i => i);

      let added = 0;
      const duplicates = [];
      const errors = [];

      for (const imei of imeiNumbers) {
        if (!imei) continue;

        try {
          await connection.execute(
            'INSERT INTO imei_tracking (variant_id, imei_number, status) VALUES (?, ?, ?)',
            [variantId, imei, 'available']
          );
          added++;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            duplicates.push(imei);
          } else {
            errors.push(`Error adding ${imei}: ${err.message}`);
          }
        }
      }

      await connection.commit();
      return {
        success: errors.length === 0,
        added,
        duplicates,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (err) {
      await connection.rollback();
      console.error('Error bulk adding IMEIs:', err);
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Auto-assign available IMEI to an order item
   * @param {number} variantId - The variant ID
   * @param {number} orderId - The order ID
   * @returns {Promise<{imei: string, imeiId: number} | null>}
   */
  autoAssignIMEI: async (variantId, orderId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get first available IMEI
      const [imeis] = await connection.execute(
        'SELECT imei_id, imei_number FROM imei_tracking WHERE variant_id = ? AND status = ? FOR UPDATE',
        [variantId, 'available']
      );

      if (imeis.length === 0) {
        await connection.rollback();
        return null;
      }

      const imei = imeis[0];

      // Reserve it for the order
      await connection.execute(
        'UPDATE imei_tracking SET status = ?, order_id = ? WHERE imei_id = ?',
        ['reserved', orderId, imei.imei_id]
      );

      await connection.commit();
      return {
        imei: imei.imei_number,
        imeiId: imei.imei_id
      };
    } catch (err) {
      await connection.rollback();
      console.error('Error auto-assigning IMEI:', err);
      throw err;
    } finally {
      connection.release();
    }
  }
};

export default imeiService;
