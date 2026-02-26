import express from 'express';
import { importProductsFromCSV, importInventoryFromCSV, importInventoryByBarcode } from '../services/importService.js';
import db from '../config/db.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/import/products
// Import products from CSV
// CSV Format: title, description, category, color, buying_price, selling_price, stock, discount, image
router.post('/import/products', async (req, res) => {
  try {
    const { csvData, imageMapping } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }
    
    const results = await importProductsFromCSV(csvData, imageMapping || {});
    
    res.json({
      message: `Import complete: ${results.success} products added, ${results.failed} failed`,
      ...results
    });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({ message: 'Failed to import products' });
  }
});

// POST /api/import/inventory
// Import/update inventory from CSV
// CSV Format: variant_id, stock, buying_price
router.post('/import/inventory', async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }
    
    const results = await importInventoryFromCSV(csvData);
    
    res.json({
      message: `Import complete: ${results.success} items updated, ${results.failed} failed`,
      ...results
    });
  } catch (error) {
    console.error('Import inventory error:', error);
    res.status(500).json({ message: 'Failed to import inventory' });
  }
});

// POST /api/import/barcode
// Import inventory by product_code (barcode) from CSV
// CSV Format: product_code, stock, buying_price, imei_number (optional)
router.post('/import/barcode', async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }
    
    const results = await importInventoryByBarcode(csvData);
    
    res.json({
      message: `Import complete: ${results.success} items updated, ${results.imeiAdded} IMEIs added, ${results.failed} failed`,
      ...results
    });
  } catch (error) {
    console.error('Import barcode error:', error);
    res.status(500).json({ message: 'Failed to import by barcode' });
  }
});

// POST /api/import/stock-batch
// Add stock directly from frontend barcode scanner
// Body: { items: [{ variant_id, stock, buying_price, imeis: [] }] }
router.post('/import/stock-batch', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [],
      imeiAdded: 0
    };

    for (const item of items) {
      try {
        const { variant_id, stock, buying_price, imeis } = item;
        
        // Update stock
        if (stock > 0) {
          await db.execute(
            'UPDATE product_variants SET stock = stock + ? WHERE variant_id = ?',
            [stock, variant_id]
          );
        }
        
        // Update buying price if provided
        if (buying_price && buying_price > 0) {
          const [current] = await db.execute(
            'SELECT price FROM product_variants WHERE variant_id = ?',
            [variant_id]
          );
          
          if (current.length > 0) {
            const profit = current[0].price - buying_price;
            await db.execute(
              'UPDATE product_variants SET buying_price = ?, profit_margin = ? WHERE variant_id = ?',
              [buying_price, profit, variant_id]
            );
          }
        }
        
        // Add IMEIs if provided
        if (imeis && Array.isArray(imeis)) {
          for (const imei of imeis) {
            if (!imei.trim()) continue;
            
            const [existing] = await db.execute(
              'SELECT imei_id FROM imei_tracking WHERE imei_number = ?',
              [imei.trim()]
            );
            
            if (existing.length === 0) {
              await db.execute(
                'INSERT INTO imei_tracking (variant_id, imei_number, status) VALUES (?, ?, "available")',
                [variant_id, imei.trim()]
              );
              results.imeiAdded++;
            }
          }
        }
        
        results.success++;
        
      } catch (err) {
        results.failed++;
        results.errors.push(`Variant ${item.variant_id}: ${err.message}`);
      }
    }
    
    res.json({
      message: `Stock added: ${results.success} items, ${results.imeiAdded} IMEIs added`,
      ...results
    });
  } catch (error) {
    console.error('Stock batch error:', error);
    res.status(500).json({ message: 'Failed to add stock' });
  }
});

export default router;
