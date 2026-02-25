import API_BASE from "../config";

// Helper to get auth header
const getAuthHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Fetch all batches with product details
export const fetchAllBatches = async (token) => {
  const response = await fetch(`${API_BASE}/api/products/batches/all`, {
    headers: {
      ...getAuthHeader(token),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch batches");
  }
  return response.json();
};

// Migrate existing products to batches
export const migrateProductsToBatches = async (token) => {
  const response = await fetch(`${API_BASE}/api/products/migrate-to-batches`, {
    method: "POST",
    headers: {
      ...getAuthHeader(token),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to migrate products to batches");
  }
  return response.json();
};
