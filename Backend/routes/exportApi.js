import express from 'express';
import { 
  exportOrdersToExcel, 
  exportProductsToExcel, 
  exportInventoryToExcel,
  exportOrderItemsToExcel,
  exportUsersToExcel,
  exportBatchesToExcel 
} from '../services/exportService.js';

const router = express.Router();

// GET /api/export/orders
// Export orders with optional filters
// Query params: status, startDate, endDate
router.get('/export/orders', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const buffer = await exportOrdersToExcel({ status, startDate, endDate });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({ message: 'Failed to export orders' });
  }
});

// GET /api/export/products
// Export all products with variants
router.get('/export/products', async (req, res) => {
  try {
    const buffer = await exportProductsToExcel();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=products_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({ message: 'Failed to export products' });
  }
});

// GET /api/export/inventory
// Export current stock levels with values
router.get('/export/inventory', async (req, res) => {
  try {
    const buffer = await exportInventoryToExcel();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventory_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({ message: 'Failed to export inventory' });
  }
});

// GET /api/export/order-items
// Export order items, optionally filtered by orderId
// Query params: orderId
router.get('/export/order-items', async (req, res) => {
  try {
    const { orderId } = req.query;
    const buffer = await exportOrderItemsToExcel(orderId ? parseInt(orderId) : null);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=order_items_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export order items error:', error);
    res.status(500).json({ message: 'Failed to export order items' });
  }
});

// GET /api/export/users
// Export all users/customers
router.get('/export/users', async (req, res) => {
  try {
    const buffer = await exportUsersToExcel();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ message: 'Failed to export users' });
  }
});

// GET /api/export/batches
// Export all batches with individual prices
router.get('/export/batches', async (req, res) => {
  try {
    const buffer = await exportBatchesToExcel();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=batches_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export batches error:', error);
    res.status(500).json({ message: 'Failed to export batches' });
  }
});

export default router;
