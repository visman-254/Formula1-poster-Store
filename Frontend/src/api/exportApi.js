import axios from 'axios';
import API_BASE from '../config';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Helper function to download Excel file
const downloadExcel = async (endpoint, filename, params = {}) => {
  try {
    const response = await api.get(endpoint, {
      params,
      responseType: 'blob', // Important for handling binary data
    });
    
    // Create a link element to trigger download
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    
    return { success: true };
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// Export orders with optional filters
export const exportOrders = async (filters = {}) => {
  return downloadExcel('/export/orders', 'orders', filters);
};

// Export all products
export const exportProducts = async () => {
  return downloadExcel('/export/products', 'products');
};

// Export inventory with stock values
export const exportInventory = async () => {
  return downloadExcel('/export/inventory', 'inventory');
};

// Export batches with individual prices
export const exportBatches = async () => {
  return downloadExcel('/export/batches', 'batches');
};

// Export order items (optionally filtered by orderId)
export const exportOrderItems = async (orderId = null) => {
  return downloadExcel('/export/order-items', 'order_items', { orderId });
};

// Export users/customers
export const exportUsers = async () => {
  return downloadExcel('/export/users', 'users');
};

export default {
  exportOrders,
  exportProducts,
  exportInventory,
  exportOrderItems,
  exportUsers,
};
