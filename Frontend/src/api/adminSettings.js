import axios from "axios";
import API_BASE from "../config";

// Get wallpaper from backend
export const getWallpaper = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/admin-settings/wallpaper`);
    return response.data;
  } catch (error) {
    console.error("Error getting wallpaper:", error);
    throw error;
  }
};

// Update wallpaper in backend (sends file via FormData)
export const updateWallpaper = async (file) => {
  try {
    const formData = new FormData();
    if (file) {
      formData.append("wallpaper", file);
    }
    
    const response = await axios.put(`${API_BASE}/api/admin-settings/wallpaper`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating wallpaper:", error);
    throw error;
  }
};

// Delete wallpaper (reset to default)
export const deleteWallpaper = async () => {
  try {
    const response = await axios.delete(`${API_BASE}/api/admin-settings/wallpaper`);
    return response.data;
  } catch (error) {
    console.error("Error deleting wallpaper:", error);
    throw error;
  }
};
