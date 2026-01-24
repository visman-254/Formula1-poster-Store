import express from "express";
import multer from "multer";
import path from "path";

import {
    getPublicBanners,
    getAllBanners,
    createNewBanner,
    updateBannerStatus,
    removeBanner,
} from "../controllers/promotionalBannerController.js";

import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------- Multer Setup -------- */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), "uploads", "images"));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* -------- Routes -------- */

// Public – Get active banners by location
router.get("/:location", getPublicBanners);

// Admin – Get all banners
router.get("/", verifyToken, verifyAdmin, getAllBanners);

// Admin – Create new banner
router.post(
    "/",
    verifyToken,
    verifyAdmin,
    upload.single("image"),
    createNewBanner
);

// Admin – Update banner status
router.put("/:id/status", verifyToken, verifyAdmin, updateBannerStatus);

// Admin – Delete banner
router.delete("/:id", verifyToken, verifyAdmin, removeBanner);

export default router;