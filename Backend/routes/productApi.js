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
  toggleProductFeatured,
  migrateProductsToBatches,
} from "../controllers/productController.js";

import { getBatchesForVariant, getAverageCostFromBatches, getAllBatches } from "../services/product.js";
import db from "../config/db.js";

import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// configure multer storage with debug logging
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`[Multer] Saving file to: uploads/images`);
    cb(null, path.join(process.cwd(), "uploads", "images"));
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    console.log(`[Multer] Filename: ${filename}, Original: ${file.originalname}`);
    cb(null, filename);
  },
});

// Regular upload for single file routes
const upload = multer({ storage });

// Custom upload middleware that logs all fields and handles errors gracefully
const uploadWithLogging = (req, res, next) => {
  // Increased limit to 50 to handle large image uploads
  const uploadMiddleware = upload.array("images", 50);
  
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error(`[Multer Error] Code: ${err.code}, Message: ${err.message}`);
      console.error(`[Multer Error] Field: ${err.field}`);
      return next(err);
    }
    
    // Log what was received
    console.log(`[Multer] Files received: ${req.files?.length || 0}`);
    console.log(`[Multer] Body fields:`, Object.keys(req.body));
    
    next();
  });
};


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

// Migrate existing products to batches (admin only)
router.post(
  "/migrate-to-batches",
  verifyToken,
  verifyAdmin,
  migrateProductsToBatches
);

// Get all batches for a variant
router.get(
  "/variants/:variantId/batches",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { variantId } = req.params;
      const batches = await getBatchesForVariant(variantId);
      res.json(batches);
    } catch (err) {
      console.error("Error fetching batches:", err);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  }
);

// Get all batches with product details (for batch inventory view)
router.get(
  "/batches/all",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const batches = await getAllBatches();
      res.json(batches);
    } catch (err) {
      console.error("Error fetching all batches:", err);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  }
);

// Get average cost from batches
router.get(
  "/variants/:variantId/average-cost",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { variantId } = req.params;
      const avgCost = await getAverageCostFromBatches(variantId);
      res.json({ averageCost: avgCost });
    } catch (err) {
      console.error("Error calculating average cost:", err);
      res.status(500).json({ error: "Failed to calculate average cost" });
    }
  }
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
  uploadWithLogging, 
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

router.put(
  "/:id/toggle-featured",
  verifyToken,
  verifyAdmin,
  toggleProductFeatured
);

// ===== BARCODE / PRODUCT CODE ROUTES =====

// Debug endpoint: List all product_codes in the database
router.get("/debug/product-codes", async (req, res) => {
  try {
    const [variants] = await db.execute(
      `SELECT pv.variant_id, pv.product_code, pv.color, pv.storage, pv.ram, p.title as product_name 
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.product_id 
       WHERE pv.product_code IS NOT NULL AND pv.product_code != ''
       ORDER BY pv.variant_id DESC
       LIMIT 50`
    );
    
    console.log(`[Debug] Found ${variants.length} variants with product_codes`);
    res.json({ count: variants.length, variants });
  } catch (err) {
    console.error('[Debug] Error fetching product_codes:', err);
    res.status(500).json({ error: 'Failed to fetch product_codes' });
  }
});

// Lookup product by barcode/product_code
router.get("/barcode/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    console.log(`[BarcodeLookup] Searching for code: "${code}"`);
    
    // First try to find by product_code
    const [variants] = await db.execute(
      `SELECT pv.*, p.title as product_name, p.category_id, c.category_name
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.product_id 
       LEFT JOIN categories c ON p.category_id = c.category_id
       WHERE pv.product_code = ?`,
      [code]
    );
    
    console.log(`[BarcodeLookup] Found ${variants.length} variant(s) by product_code`);
    if (variants.length > 0) {
      console.log(`[BarcodeLookup] Found variant:`, {
        variant_id: variants[0].variant_id,
        product_code: variants[0].product_code,
        color: variants[0].color,
        storage: variants[0].storage,
        ram: variants[0].ram,
        product_name: variants[0].product_name
      });
      return res.json({
        found: true,
        type: 'product_code',
        variant: variants[0]
      });
    }
    
    // If not found, try to find by IMEI
    console.log(`[BarcodeLookup] Not found by product_code, trying IMEI...`);
    const [imeiResult] = await db.execute(
      `SELECT it.imei_id, it.imei_number, it.status, pv.variant_id, pv.product_code, 
              pv.color, pv.price, pv.stock, pv.buying_price, p.title as product_name
       FROM imei_tracking it
       JOIN product_variants pv ON it.variant_id = pv.variant_id
       JOIN products p ON pv.product_id = p.product_id
       WHERE it.imei_number = ?`,
      [code]
    );
    
    if (imeiResult.length > 0) {
      console.log(`[BarcodeLookup] Found by IMEI:`, imeiResult[0]);
      return res.json({
        found: true,
        type: 'imei',
        imei: imeiResult[0]
      });
    }
    
    console.log(`[BarcodeLookup] Product not found for code: "${code}"`);
    res.json({ found: false, message: 'Product not found' });
  } catch (err) {
    console.error('[BarcodeLookup] Barcode lookup error:', err);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});

// Auto-generate product codes for all variants (including existing ones)
router.post("/barcode/regenerate-all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Get ALL variants with their color, storage, ram
    const [variants] = await db.execute(
      `SELECT pv.variant_id, pv.color, pv.storage, pv.ram, p.title 
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.product_id
       ORDER BY pv.variant_id`
    );
    
    console.log(`[Regenerate] Found ${variants.length} variants to process`);
    
    let generated = 0;
    const errors = [];
    
    // Hex color to abbreviation mapping
    const hexColors = {
      '#000000': 'BLK', '#007bff': 'BLU', '#ff0000': 'RED', 
      '#00ff00': 'GRN', '#ffff00': 'YLW', '#ff00ff': 'MGN',
      '#00ffff': 'CYN', '#ffffff': 'WHT', '#808080': 'GRY',
      '#ffa500': 'ORN', '#800080': 'PUR', '#ffc0cb': 'PNK'
    };
    
    for (const variant of variants) {
      try {
        // Generate prefix from product title
        const prefix = variant.title ? variant.title.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PRD';
        
        // Handle color - could be hex code or color name
        let colorCode = 'NO';
        if (variant.color) {
          if (variant.color.startsWith('#')) {
            // It's a hex code
            colorCode = hexColors[variant.color] || 'CL';
          } else {
            // It's a color name
            colorCode = variant.color.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'NO';
          }
        }
        
        // Handle storage and RAM
        const storageCode = variant.storage ? variant.storage.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
        const ramCode = variant.ram ? variant.ram.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
        
        // Build SKU: PREFIX-COLOR-STORAGE-RAM (e.g., TECN-BLK-256GB-8GB)
        let productCode = `${prefix}-${colorCode}`;
        if (storageCode) productCode += `-${storageCode}`;
        if (ramCode) productCode += `-${ramCode}`;
        
        console.log(`[Regenerate] Variant ${variant.variant_id}: ${variant.color} -> ${colorCode}, storage: ${variant.storage}, ram: ${variant.ram} -> SKU: ${productCode}`);
        
        await db.execute(
          'UPDATE product_variants SET product_code = ? WHERE variant_id = ?',
          [productCode, variant.variant_id]
        );
        generated++;
      } catch (err) {
        errors.push(`Variant ${variant.variant_id}: ${err.message}`);
      }
    }
    
    console.log(`[Regenerate] Successfully generated ${generated} product codes`);
    res.json({
      message: `Regenerated ${generated} product codes`,
      generated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('[Regenerate] Error:', err);
    res.status(500).json({ error: 'Failed to regenerate barcodes' });
  }
});

// Auto-generate product codes for all variants without codes
router.post("/barcode/generate-all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Get all variants without product_code
    const [variants] = await db.execute(
      `SELECT pv.variant_id, pv.color, p.title, p.sku_prefix
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.product_id
       WHERE pv.product_code IS NULL OR pv.product_code = ''
       ORDER BY pv.variant_id`
    );
    
    let generated = 0;
    const errors = [];
    
    for (const variant of variants) {
      try {
        // Generate product code: SKU_PREFIX-COLOR-VARIANT_ID
        // Example: S26-BLK-001 or IP15-256-042
        const cleanColor = (variant.color || 'DEF')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '-')
          .substring(0, 15);
        const prefix = (variant.sku_prefix || variant.title.substring(0, 4).toUpperCase())
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 8);
        const productCode = `${prefix}-${cleanColor}-${String(variant.variant_id).padStart(3, '0')}`;
        
        await db.execute(
          'UPDATE product_variants SET product_code = ? WHERE variant_id = ?',
          [productCode, variant.variant_id]
        );
        generated++;
      } catch (err) {
        errors.push(`Variant ${variant.variant_id}: ${err.message}`);
      }
    }
    
    res.json({
      message: `Generated ${generated} product codes`,
      generated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Generate barcodes error:', err);
    res.status(500).json({ error: 'Failed to generate barcodes' });
  }
});

// Generate product code for a single variant
router.post("/variants/:variantId/generate-code", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { variantId } = req.params;
    
    const [variant] = await db.execute(
      `SELECT pv.variant_id, pv.color, pv.product_code, p.title, p.sku_prefix
       FROM product_variants pv 
       JOIN products p ON pv.product_id = p.product_id
       WHERE pv.variant_id = ?`,
      [variantId]
    );
    
    if (variant.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    const v = variant[0];
    
    // If already has a code, return it
    if (v.product_code) {
      return res.json({ product_code: v.product_code, message: 'Code already exists' });
    }
    
    // Generate new code
    const cleanColor = (v.color || 'DEF')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .substring(0, 15);
    const prefix = (v.sku_prefix || v.title.substring(0, 4).toUpperCase())
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);
    const productCode = `${prefix}-${cleanColor}-${String(v.variant_id).padStart(3, '0')}`;
    
    await db.execute(
      'UPDATE product_variants SET product_code = ? WHERE variant_id = ?',
      [productCode, variantId]
    );
    
    res.json({ product_code: productCode, message: 'Code generated successfully' });
  } catch (err) {
    console.error('Generate code error:', err);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

export default router;