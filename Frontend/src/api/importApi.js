import axios from 'axios';
import API_BASE from '../config';

const importProductsFromCSV = async (csvData, token, imageMapping = {}) => {
  const response = await axios.post(
    `${API_BASE}/api/import/products`,
    { csvData, imageMapping },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

const importInventoryFromCSV = async (csvData, token) => {
  const response = await axios.post(
    `${API_BASE}/api/import/inventory`,
    { csvData },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// Import inventory by barcode (product_code)
// CSV Format: product_code, stock, buying_price, imei_number (optional)
const importInventoryByBarcode = async (csvData, token) => {
  const response = await axios.post(
    `${API_BASE}/api/import/barcode`,
    { csvData },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// Lookup product by barcode
const lookupByBarcode = async (code, token) => {
  const response = await axios.get(
    `${API_BASE}/api/products/barcode/${code}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Generate product codes for all variants without codes
const generateAllBarcodes = async (token) => {
  const response = await axios.post(
    `${API_BASE}/api/products/barcode/generate-all`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Generate product code for a single variant
const generateBarcode = async (variantId, token) => {
  const response = await axios.post(
    `${API_BASE}/api/products/variants/${variantId}/generate-code`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Save batch stock entries from barcode scanner
const saveBatchStock = async (items, token) => {
  const response = await axios.post(
    `${API_BASE}/api/import/stock-batch`,
    { items },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export { importProductsFromCSV, importInventoryFromCSV, importInventoryByBarcode, lookupByBarcode, generateAllBarcodes, generateBarcode, saveBatchStock };
