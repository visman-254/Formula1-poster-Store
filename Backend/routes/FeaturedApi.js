import express from "express";
const router = express.Router();
import { fetchFeaturedProducts } from "../controllers/FeaturedController.js";


router.get("/featured", fetchFeaturedProducts);

export default router;