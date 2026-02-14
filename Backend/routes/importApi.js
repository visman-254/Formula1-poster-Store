import express from 'express';
import { importProductsFromCSV, importInventoryFromCSV } from '../services/importService.js';

const router = express.Router();

// POST /api/import/products
// Import products from CSV
// CSV Format: title, description, category, color, buying_price, selling_price, stock, discount
router.post('/import/products', async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }
    
    const results = await importProductsFromCSV(csvData);
    
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

export default router;
