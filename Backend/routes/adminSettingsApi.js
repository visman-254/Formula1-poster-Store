import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import adminSettingsController from "../controllers/adminSettingsController.js";

const router = express.Router();

// Define upload directory for admin wallpapers
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "wallpaper");

// Create directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for wallpaper uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "wallpaper-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

// Get all admin settings
router.get("/", adminSettingsController.getSettings);

// Get wallpaper
router.get("/wallpaper", adminSettingsController.getWallpaper);

// Update wallpaper (with file upload)
router.put("/wallpaper", upload.single("wallpaper"), adminSettingsController.updateWallpaper);

// Delete wallpaper (reset to default)
router.delete("/wallpaper", adminSettingsController.deleteWallpaper);

export default router;
