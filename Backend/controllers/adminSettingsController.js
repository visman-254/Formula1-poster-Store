import adminSettingsService from "../services/adminSettings.js";
import fs from "fs";
import path from "path";

// Get admin settings
const getSettings = async (req, res) => {
  try {
    const settings = await adminSettingsService.getAllSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error in getSettings:", error);
    res.status(500).json({ success: false, message: "Failed to get settings" });
  }
};

// Get wallpaper setting
const getWallpaper = async (req, res) => {
  try {
    const setting = await adminSettingsService.getSetting("wallpaper");
    res.json({ 
      success: true, 
      wallpaper: setting ? setting.setting_value : null 
    });
  } catch (error) {
    console.error("Error in getWallpaper:", error);
    res.status(500).json({ success: false, message: "Failed to get wallpaper" });
  }
};

// Update wallpaper setting (with file upload)
const updateWallpaper = async (req, res) => {
  try {
    // Get current wallpaper to delete old file
    const currentSetting = await adminSettingsService.getSetting("wallpaper");
    const oldWallpaper = currentSetting ? currentSetting.setting_value : null;
    
    if (req.file) {
      // New file uploaded - save the path
      const wallpaperPath = `uploads/wallpaper/${req.file.filename}`;
      
      // Delete old wallpaper file if exists
      if (oldWallpaper) {
        const oldFilePath = path.join(process.cwd(), oldWallpaper);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      await adminSettingsService.updateSetting("wallpaper", wallpaperPath);
      
      return res.json({ 
        success: true, 
        message: "Wallpaper updated successfully",
        wallpaper: wallpaperPath 
      });
    } else {
      // No new file uploaded
      res.json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }
  } catch (error) {
    console.error("Error in updateWallpaper:", error);
    res.status(500).json({ success: false, message: "Failed to update wallpaper" });
  }
};

// Delete wallpaper (reset to default)
const deleteWallpaper = async (req, res) => {
  try {
    // Get current wallpaper to delete file
    const currentSetting = await adminSettingsService.getSetting("wallpaper");
    const oldWallpaper = currentSetting ? currentSetting.setting_value : null;
    
    // Delete old wallpaper file if exists
    if (oldWallpaper) {
      const oldFilePath = path.join(process.cwd(), oldWallpaper);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Delete from database
    await adminSettingsService.deleteSetting("wallpaper");
    
    res.json({ 
      success: true, 
      message: "Wallpaper reset to default",
      wallpaper: null 
    });
  } catch (error) {
    console.error("Error in deleteWallpaper:", error);
    res.status(500).json({ success: false, message: "Failed to delete wallpaper" });
  }
};

export default {
  getSettings,
  getWallpaper,
  updateWallpaper,
  deleteWallpaper,
};
