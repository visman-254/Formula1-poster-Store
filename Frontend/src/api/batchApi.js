import axios from 'axios';
import API_BASE from '../config';

// Get all batches with product details
export const fetchAllBatches = async (token) => {
  try {
    const res = await axios.get(
      `${API_BASE}/api/products/batches/all`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (err) {
    console.error("Error fetching all batches:", err);
    throw err;
  }
};
