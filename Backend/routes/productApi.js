// productsRoutes.js - CORRECTED ROUTE ORDER

import express from "express";
import multer from "multer";
import path from "path";

import {
  fetchProducts,
  fetchProductsAdmin,
  fetchProductById,
  fetchProductsByCategoryName,
  fetchProductsByCategoryNameAdmin,
  addProduct, 
  addCategory,
  fetchCategories,
  fetchCategoriesByAdmin,
  updateProductById, 
  deleteProductById,
  deleteCategoryById,
  receiveStockForVariant,
  fetchBackorders, // Imported controller
  restoreProductById,
  permanentlyDeleteProductById,
  updateVariantById,
  updateStockForVariant,
  updateVariantColor,
  toggleProductVisibility,
} from "../controllers/productController.js";

import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// configure multer storage (omitted for brevity)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "images"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });


router.get("/categories", fetchCategories);
router.get("/category/name/:categoryName", fetchProductsByCategoryName);


router.get("/categories/admin", verifyToken, verifyAdmin, fetchCategoriesByAdmin);
router.get("/category/admin/name/:categoryName", verifyToken, verifyAdmin, fetchProductsByCategoryNameAdmin);
router.post("/categories", verifyToken, verifyAdmin, addCategory);
router.delete("/categories/:categoryId", verifyToken, verifyAdmin, deleteCategoryById);



router.get("/", fetchProducts);
router.get("/admin", verifyToken, verifyAdmin, fetchProductsAdmin);


router.get(
  "/backorders", 
  verifyToken, 
  verifyAdmin, 
  fetchBackorders
);

router.post(
  "/variants/:variantId/receive-stock", 
  verifyToken, 
  verifyAdmin, 
  receiveStockForVariant 
);

router.put(
  "/variants/:variantId",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  updateVariantById
);


router.get("/:id", fetchProductById);


router.post(
  "/", 
  verifyToken, 
  verifyAdmin, 
  upload.array("images", 10), 
  addProduct
);

router.put(
  "/:id", 
  verifyToken, 
  verifyAdmin, 
  upload.array("images", 10),
  updateProductById
);

router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  deleteProductById
);

router.post("/:id/restore", verifyToken, verifyAdmin, restoreProductById);

router.delete(
  "/:id/permanent",
  verifyToken,
  verifyAdmin,
  permanentlyDeleteProductById
);


router.get("/test", (req, res) => res.json({ message: "test successful" }));


router.post(
  "/variants/:variantId/update-stock", 
  verifyToken, 
  verifyAdmin, 
  updateStockForVariant 
);

router.put(
  "/variants/:variantId/color",
  verifyToken,
  verifyAdmin,
  updateVariantColor
);

router.put(
  "/:id/toggle-visibility",
  verifyToken,
  verifyAdmin,
  toggleProductVisibility
);

export default router;