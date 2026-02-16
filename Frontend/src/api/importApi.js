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

export { importProductsFromCSV, importInventoryFromCSV };
