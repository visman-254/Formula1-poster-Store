import {
  getActivePromotions,
  getAllPromotions,
  createPromotion,
  togglePromotionStatus,
  deletePromotion
} from "../services/productPromotion.js";

import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

/* ============================
   IMAGE URL FORMATTER
============================ */
const formatPromotionImage = (req, image) => {
  if (!image) return null;

  if (/^https?:\/\//i.test(image)) return image;

  const cleaned = String(image).replace(/^\\+|^\/+/, "");
  const normalizedPath = cleaned.includes("uploads/promotions")
    ? cleaned
    : `uploads/promotions/${cleaned}`;

  return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

const formatPromotion = (req, promotion) => ({
  ...promotion,
  image_url: formatPromotionImage(req, promotion.image_url)
});

/* ============================
   USER – ACTIVE PROMOTIONS
============================ */
export const getUserPromotions = async (req, res) => {
  try {
    const promotions = await getActivePromotions();
    res.json(promotions.map(p => formatPromotion(req, p)));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
};

/* ============================
   ADMIN – ALL PROMOTIONS
============================ */
export const getFullPromotions = async (req, res) => {
  try {
    const promotions = await getAllPromotions();
    res.json(promotions.map(p => formatPromotion(req, p)));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
};

/* ============================
   CREATE PROMOTION (IMAGE ONLY)
============================ */
export const newPromotion = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      if (req.file) await fs.unlink(req.file.path);
      return res.status(403).json({ error: "Admin only" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Promotion image is required" });
    }

    /* Optional image validation */
    const meta = await sharp(req.file.path).metadata();
    if (meta.width < 300) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: "Image too small" });
    }

    const imagePath = `uploads/promotions/${req.file.filename}`;

    const promotion = await createPromotion({ imagePath });

    res.status(201).json({
      message: "Promotion created successfully",
      promotion: formatPromotion(req, promotion)
    });

  } catch (err) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: "Failed to create promotion" });
  }
};

/* ============================
   TOGGLE STATUS
============================ */
export const generatePromotionStatus = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({ error: "Boolean status required" });
    }

    await togglePromotionStatus(id, status ? 1 : 0);
    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

/* ============================
   DELETE PROMOTION
============================ */
export const removePromotion = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { id } = req.params;
    await deletePromotion(id);

    res.json({ message: "Promotion deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
