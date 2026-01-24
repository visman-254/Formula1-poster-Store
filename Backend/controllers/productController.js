import {
  getProductById,
  getProducts,
  getProductsAdmin,
  getProductsByCategoryName,
  getProductsByCategoryNameAdmin,
  createProduct,
  getCategoryByNameAndParentId,
  createCategory,
  getCategories,
  getCategoriesByAdmin,
  updateProduct,
  deleteProduct,
  deleteCategory,
  receiveStockForVariant as receiveStockForVariantService,
  getBackorderedProducts,
  restoreProduct,
  permanentlyDeleteProduct,
   updateStockForVariant as updateStockForVariantService,
   toggleProductVisibility as toggleProductVisibilityService,
} from "../services/product.js";

import { addProductImages } from "../services/gallery.js";


import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const formatProductImage = (req, image) => {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image; 

  // Normalize path separators to forward slashes
  const normalizedImage = String(image).replace(/\\/g, "/");

  const cleaned = normalizedImage.replace(/^\/+/, "");
  const normalizedPath = cleaned.includes("uploads/images")
    ? cleaned
    : `uploads/images/${cleaned}`;

  return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

const formatProduct = (req, product) => {
  const formattedProduct = { ...product };

  // 1. Format all standard variant images first 
  if (formattedProduct.variants) {
    formattedProduct.variants = formattedProduct.variants.map(variant => ({
      ...variant,
      image: formatProductImage(req, variant.image),
    }));
  }

  // 2. Handle Bundle Image Splicing
  if (formattedProduct.is_bundle) {
    // Format child products recursively
    if (formattedProduct.bundle_products) {
      formattedProduct.bundle_products = formattedProduct.bundle_products.map(bp => formatProduct(req, bp));
    }

    // Get images from product.images (gallery) first, then fallback to bundle_products
    let bundleImages = [];
    if (formattedProduct.images && formattedProduct.images.length >= 2) {
      bundleImages = formattedProduct.images.slice(0, 2).map(img => formatProductImage(req, img));
    } else if (formattedProduct.bundle_products && formattedProduct.bundle_products.length > 0) {
      bundleImages = formattedProduct.bundle_products
        .map(bp => bp.primaryImage)
        .filter(img => img !== null)
        .slice(0, 2);
    }

    // Set a new property 'bundleImages' for the frontend to use
    if (bundleImages.length >= 2) {
      formattedProduct.bundleImages = bundleImages;
    }

    // Set primaryImage
    formattedProduct.primaryImage = bundleImages.length > 0 ? bundleImages[0] : null;

  } else {
    // Standard product logic
    const firstVariantWithImage = formattedProduct.variants?.find(v => v.image);
    if (firstVariantWithImage) {
      formattedProduct.primaryImage = firstVariantWithImage.image;
    } else if (formattedProduct.images && formattedProduct.images.length > 0) {
      formattedProduct.primaryImage = formatProductImage(req, formattedProduct.images[0]);
    } else {
      formattedProduct.primaryImage = null;
    }
  }

  return formattedProduct;
};
export const fetchProducts = async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products.map((p) => formatProduct(req, p)));
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export const fetchProductsAdmin = async (req, res) => {
  try {
    const products = await getProductsAdmin();
    res.json(products.map((p) => formatProduct(req, p)));
  } catch (err) {
    console.error("Error fetching products for admin:", err);
    res.status(500).json({ error: "Failed to fetch products for admin" });
  }
};


export const fetchProductById = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product || product.is_deleted) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(formatProduct(req, product));
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};


export const addProduct = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const { title, description, categoryName, variants: variantsJson, is_bundle, bundle_of: bundleOfJson } = req.body;
    const variants = JSON.parse(variantsJson || '[]');
    const bundle_of = JSON.parse(bundleOfJson || 'null');
    const isBundleBool = is_bundle === 'true' || is_bundle === true;

    if (!title || !categoryName) {
      return res.status(400).json({ error: "Title and categoryName are required" });
    }
    if (!isBundleBool && variants.length === 0) {
      return res.status(400).json({ error: "Simple products must have at least one variant" });
    }

    let category_id = null;
    let parent_id = null;

    if (categoryName.includes(' > ')) {
      const parts = categoryName.split(' > ').map(p => p.trim());
      const parentCategoryName = parts[0];
      const finalCategoryName = parts[parts.length - 1];

      parent_id = await getCategoryByNameAndParentId(parentCategoryName, null);
      if (!parent_id) {
        const newParent = await createCategory(parentCategoryName, null);
        parent_id = newParent.category_id;
      }

      category_id = await getCategoryByNameAndParentId(finalCategoryName, parent_id);
      if (!category_id) {
        const newCategory = await createCategory(finalCategoryName, parent_id);
        category_id = newCategory.category_id;
      }
    } else {
      category_id = await getCategoryByNameAndParentId(categoryName, null);
      if (!category_id) {
        const newCategory = await createCategory(categoryName, null);
        category_id = newCategory.category_id;
      }
    }
    
    let fileIndex = 0;
    const processedVariants = [];

    // Use a for...of loop to allow await inside
    for (const variant of variants) {
        let imagePath = null;
        if (isBundleBool) {
            // For bundles, grab the image from the first component product as a fallback/primary image.
            if (bundle_of && bundle_of.length > 0) {
                const firstVariantId = bundle_of[0].variant_id;
                if (firstVariantId) {
                    const [[variantRow]] = await db.query("SELECT image FROM product_variants WHERE variant_id = ?", [firstVariantId]);
                    if (variantRow) {
                        imagePath = variantRow.image;
                    }
                }
            }
        } else {
            // For simple products, use the hasImage flag to associate files correctly.
            if (variant.hasImage && req.files && req.files[fileIndex]) {
                imagePath = `uploads/images/${req.files[fileIndex].filename}`;
                fileIndex++;
            }
        }
        processedVariants.push({ ...variant, image: imagePath });
    }

    const newProductData = {
      title,
      description,
      category_id,
      is_bundle: isBundleBool,
      bundle_of,
      variants: processedVariants
    };

    const newProduct = await createProduct(newProductData);

    if (isBundleBool && bundle_of && bundle_of.length > 0) {
      const bundleImages = [];
      for (const item of bundle_of) {
        const [[row]] = await db.query("SELECT image FROM product_variants WHERE variant_id = ?", [item.variant_id]);
        if (row && row.image) {
          bundleImages.push(row.image);
        }
      }
      if (bundleImages.length > 0) {
        await addProductImages(newProduct.product_id, bundleImages);
      }
    }

    res.status(201).json({
      message: "Product added successfully",
      product: formatProduct(req, newProduct),
    });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: err.message || "Failed to add product" });
  }
};


export const fetchBackorders = async (req, res) => {
    try {
        if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

        const products = await getBackorderedProducts();
     
        res.json(products); 
    } catch (err) {
        console.error("Error fetching backorders:", err);
        res.status(500).json({ error: "Failed to fetch backorders" });
    }
};


export const fetchProductsByCategoryName = async (req, res) => {
  try {
    const products = await getProductsByCategoryName(req.params.categoryName);
    res.json(products.map((p) => formatProduct(req, p)));
  } catch (err) {
    console.error("Error fetching products by category:", err);
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
};


export const fetchProductsByCategoryNameAdmin = async (req, res) => {
  try {
    const products = await getProductsByCategoryNameAdmin(req.params.categoryName);
    res.json(products.map((p) => formatProduct(req, p)));
  } catch (err) {
    console.error("Error fetching products by category for admin:", err);
    res.status(500).json({ error: "Failed to fetch products by category for admin" });
  }
};


export const addCategory = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const { categoryName, parentId } = req.body;
    if (!categoryName) return res.status(400).json({ error: "Category name is required" });

    const newCategory = await createCategory(categoryName, parentId || null);
    res.status(201).json({ message: "Category added successfully", category: newCategory });
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ error: "Failed to add category" });
  }
};


export const fetchCategories = async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};


export const fetchCategoriesByAdmin = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const categories = await getCategoriesByAdmin();
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories (admin):", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};


export const updateProductById = async (req, res) => {
  try {
    if (req.user?.role !== "admin")
      return res.status(403).json({ error: "Admin only" });

    const { id } = req.params;
    const { title, description, categoryName, variants: variantsJson, is_bundle, bundle_of: bundleOfJson } = req.body;
    const variants = variantsJson ? JSON.parse(variantsJson) : undefined;
    const bundle_of = bundleOfJson ? JSON.parse(bundleOfJson) : undefined;

    const updateData = { variants, is_bundle, bundle_of };

    if (title) {
      updateData.title = title;
    }
    if (description) {
      updateData.description = description;
    }

    if (categoryName) {
      const categoryParts = categoryName.split(' > ').map(p => p.trim());
      const finalName = categoryParts[categoryParts.length - 1];

      let category_id = await getCategoryByNameAndParentId(finalName, null);
      if (!category_id) {
        const newCategory = await createCategory(finalName, null);
        category_id = newCategory.category_id;
      }
      updateData.category_id = category_id;
    }
    
    if (req.files && variants) {
        updateData.variants = variants.map((variant, index) => ({
            ...variant,
            image: req.files[index] ? `uploads/images/${req.files[index].filename}` : variant.image,
        }));
    }

    const updatedProduct = await updateProduct(id, updateData);

    if (!updatedProduct)
      return res.status(404).json({ error: "Product not found" });

    res.json({
      message: "Product updated successfully",
      product: formatProduct(req, updatedProduct),
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
};




export const deleteProductById = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
    await deleteProduct(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
};


export const deleteCategoryById = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
    await deleteCategory(req.params.categoryId);
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

export const restoreProductById = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const { id } = req.params;
    const { newCategoryId } = req.body;

    if (!newCategoryId) {
      return res.status(400).json({ error: "New category ID is required" });
    }

    const restoredProduct = await restoreProduct(id, newCategoryId);

    res.json({
      message: "Product restored successfully", 
      product: formatProduct(req, restoredProduct)
    });
  } catch (err) {
    console.error("Error restoring product:", err);
    res.status(500).json({ error: err.message || "Failed to restore product" });
  }
};

export const permanentlyDeleteProductById = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const { id } = req.params;
    await permanentlyDeleteProduct(id);

    res.json({ message: "Product permanently deleted" });
  } catch (err) {
    console.error("Error permanently deleting product:", err);
    res.status(500).json({ error: err.message || "Failed to permanently delete product" });
  }
};




export const receiveStockForVariant = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const { variantId } = req.params;
    const { quantityReceived, buyingPrice } = req.body;

    if (!quantityReceived || isNaN(Number(quantityReceived)) || Number(quantityReceived) <= 0) {
      return res.status(400).json({ error: "A positive quantity is required." });
    }

    if (!buyingPrice || isNaN(Number(buyingPrice)) || Number(buyingPrice) < 0) {
      return res.status(400).json({ error: "A valid buying price is required." });
    }

    const updatedVariant = await receiveStockForVariantService(variantId, Number(quantityReceived), Number(buyingPrice));

    if (!updatedVariant) {
        return res.status(404).json({ error: "Variant not found or could not be updated." });
    }

    updatedVariant.image = formatProductImage(req, updatedVariant.image);

    res.json({
      message: "Stock received successfully",
      variant: updatedVariant,
    });

  } catch (err) {
    console.error("Error receiving stock for variant:", err);
    res.status(500).json({ error: err.message || "Failed to receive stock" });
  }
};

export const updateVariantById = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { variantId } = req.params;
    const { buying_price, profit_margin, discount, price } = req.body;
    const image = req.file;

    const fieldsToUpdate = {};
    if (buying_price) fieldsToUpdate.buying_price = buying_price;
    if (profit_margin) fieldsToUpdate.profit_margin = profit_margin;
    if (discount) fieldsToUpdate.discount = discount;
    if (price) fieldsToUpdate.price = price;
    if (image) fieldsToUpdate.image = `uploads/images/${image.filename}`;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [result] = await db.query(
      "UPDATE product_variants SET ? WHERE variant_id = ?",
      [fieldsToUpdate, variantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Variant not found" });
    }

    const [[variant]] = await db.query("SELECT product_id FROM product_variants WHERE variant_id = ?", [variantId]);
    const updatedProduct = await getProductById(variant.product_id);

    res.json({
      message: "Variant updated successfully",
      product: formatProduct(req, updatedProduct),
    });
  } catch (err) {
    console.error("Error updating variant:", err);
    res.status(500).json({ error: "Failed to update variant" });
  }
};

export const updateStockForVariant = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const { variantId } = req.params;
    const { newStockQuantity } = req.body;

    if (newStockQuantity === undefined || newStockQuantity === null || isNaN(Number(newStockQuantity))) {
      return res.status(400).json({ error: "A valid stock quantity is required." });
    }

    const updatedVariant = await updateStockForVariantService(variantId, Number(newStockQuantity));

    if (!updatedVariant) {
        return res.status(404).json({ error: "Variant not found or could not be updated." });
    }

    updatedVariant.image = formatProductImage(req, updatedVariant.image);

    res.json({
      message: "Stock updated successfully",
      variant: updatedVariant,
    });

    } catch (err) {

      console.error("Error updating stock for variant:", err);

      res.status(500).json({ error: err.message || "Failed to update stock" });

    }

  };

  export const toggleProductVisibility = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { id } = req.params;
    const { is_visible } = req.body;

    if (is_visible === undefined) {
      return res.status(400).json({ error: "is_visible is required" });
    }

    const updatedProduct = await toggleProductVisibilityService(id, is_visible);

    res.json({
      message: "Product visibility updated successfully",
      product: formatProduct(req, updatedProduct),
    });
  } catch (err) {
    console.error("Error toggling product visibility:", err);
    res.status(500).json({ error: "Failed to toggle product visibility" });
  }
};

  

  export const updateVariantColor = async (req, res) => {

    try {

      if (req.user?.role !== "admin") {

        return res.status(403).json({ error: "Admin only" });

      }

  

      const { variantId } = req.params;

      const { color } = req.body;

  

      if (!color) {

        return res.status(400).json({ error: "Color is required" });

      }

  

      const [result] = await db.query(

        "UPDATE product_variants SET color = ? WHERE variant_id = ?",

        [color, variantId]

      );

  

      if (result.affectedRows === 0) {

        return res.status(404).json({ error: "Variant not found" });

      }

  

      const [[variant]] = await db.query("SELECT product_id FROM product_variants WHERE variant_id = ?", [variantId]);

      const updatedProduct = await getProductById(variant.product_id);

  

      res.json({

        message: "Variant color updated successfully",

        product: formatProduct(req, updatedProduct),

      });

    } catch (err) {

      console.error("Error updating variant color:", err);

      res.status(500).json({ error: "Failed to update variant color" });

    }

  };

  