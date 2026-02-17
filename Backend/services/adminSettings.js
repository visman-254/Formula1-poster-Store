import db from "../config/db.js";

// Get admin setting by key
const getSetting = async (key) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM admin_settings WHERE setting_key = ?",
      [key]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Error getting admin setting:", error);
    throw error;
  }
};

// Get all admin settings
const getAllSettings = async () => {
  try {
    const [rows] = await db.execute("SELECT * FROM admin_settings");
    return rows;
  } catch (error) {
    console.error("Error getting all admin settings:", error);
    throw error;
  }
};

// Update admin setting
const updateSetting = async (key, value) => {
  try {
    const [result] = await db.execute(
      `INSERT INTO admin_settings (setting_key, setting_value) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, value, value]
    );
    return result;
  } catch (error) {
    console.error("Error updating admin setting:", error);
    throw error;
  }
};

// Delete admin setting (reset to default)
const deleteSetting = async (key) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM admin_settings WHERE setting_key = ?",
      [key]
    );
    return result;
  } catch (error) {
    console.error("Error deleting admin setting:", error);
    throw error;
  }
};

export default {
  getSetting,
  getAllSettings,
  updateSetting,
  deleteSetting,
};
