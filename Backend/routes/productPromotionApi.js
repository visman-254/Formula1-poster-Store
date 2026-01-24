import express from "express";
import {
  getUserPromotions,
  getFullPromotions,
  newPromotion,
  generatePromotionStatus,
  removePromotion
} from "../controllers/productPromotionController.js";

import { verifyAdmin, verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

/* ============================
   MULTER SETUP
============================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "promotions"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* USER */
router.get("/", getUserPromotions);

/* ADMIN */
router.get("/all", verifyToken, verifyAdmin, getFullPromotions);
router.post("/", verifyToken, verifyAdmin, upload.single("image"), newPromotion);
router.put("/:id/status", verifyToken, verifyAdmin, generatePromotionStatus);
router.delete("/:id", verifyToken, verifyAdmin, removePromotion);

export default router;
