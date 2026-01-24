// src/routes/heroSlideApi.js (Improved)

import express from "express";
import { getUserHeroSlides, getFullHeroSlides, newHeroSlide, generateHeroSlideStatus, removeHeroSlide } from "../controllers/heroslidecontroller.js";
import { verifyAdmin, verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer"; 
import path from "path";


const router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), "uploads", "hero"));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

router.get("/", getUserHeroSlides);


router.get("/all", verifyToken, verifyAdmin, getFullHeroSlides);


router.post("/", verifyToken, verifyAdmin, upload.single('image'), newHeroSlide);


router.put("/:id/status", verifyToken, verifyAdmin, generateHeroSlideStatus);


router.delete("/:id", verifyToken, verifyAdmin, removeHeroSlide);

export default router;