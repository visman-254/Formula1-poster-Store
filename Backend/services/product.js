import db from "../config/db.js";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const UNCATEGORIZED_ID = 35;

const groupProducts = async (rows) => {
    const productMap = new Map();
    const variantRows = [];
    const bundleComponentVariantIds = new Set();

    // First pass: create product entries and identify variants
    for (const row of rows) {
        if (!productMap.has(row.product_id)) {
            productMap.set(row.product_id, {
                product_id: row.product_id,
                title: row.title,
                description: row.description,
                category_id: row.category_id,
                category_name: row.category_name,
                is_visible: row.is_visible,
                is_bundle: row.is_bundle,
                bundle_of: row.bundle_of,
                variants: [],
                images: [],
                bundle_products: []
            });
        }
        if (row.variant_id) {
            variantRows.push(row);
        }
        if (row.is_bundle && row.bundle_of) {
            try {
                const bundleItems = JSON.parse(row.bundle_of);
                bundleItems.forEach(item => {
                    if (item.variant_id) {
                        bundleComponentVariantIds.add(item.variant_id);
                    }
                });
            } catch (e) {
                console.error(`Failed to parse bundle_of for product ${row.product_id}`, e);
            }
        }
    }

    // Fetch all component variant stocks in one go
    const componentStocks = new Map();
    if (bundleComponentVariantIds.size > 0) {
        const [stockRows] = await db.query(
            'SELECT variant_id, stock FROM product_variants WHERE variant_id IN (?)',
            [[...bundleComponentVariantIds]]
        );
        for (const stockRow of stockRows) {
            componentStocks.set(stockRow.variant_id, stockRow.stock);
        }
    }

    // Second pass: assemble variants and calculate effective bundle stock
    for (const product of productMap.values()) {
        for (const variant of variantRows) {
            if (variant.product_id === product.product_id) {
                product.variants.push({
                    variant_id: variant.variant_id,
                    color: variant.color,
                    price: variant.price,
                    stock: variant.stock,
                    image: variant.image,
                    buying_price: variant.buying_price,
                    profit_margin: variant.profit_margin,
                    discount: variant.discount,
                });
            }
        }

        if (product.is_bundle && product.bundle_of) {
            try {
                const bundleItems = JSON.parse(product.bundle_of);
                let effective_stock = Infinity;

                for (const item of bundleItems) {
                    const componentStock = componentStocks.get(item.variant_id) || 0;
                    const maxBundlesFromComponent = Math.floor(componentStock / item.quantity);
                    if (maxBundlesFromComponent < effective_stock) {
                        effective_stock = maxBundlesFromComponent;
                    }
                }
                
                // A bundle product is assumed to have only one variant
                if (product.variants.length > 0) {
                    product.variants[0].stock = (effective_stock === Infinity) ? 0 : effective_stock;
                }

            } catch (e) {
                console.error(`Failed to calculate effective stock for bundle ${product.product_id}`, e);
                 if (product.variants.length > 0) {
                    product.variants[0].stock = 0;
                }
            }
        }
    }

    // Fetch and assign additional images
    const productIds = Array.from(productMap.keys());
    if (productIds.length > 0) {
        const [imageRows] = await db.query(
            "SELECT * FROM product_images WHERE product_id IN (?)",
            [productIds]
        );
        for (const imageRow of imageRows) {
            const product = productMap.get(imageRow.product_id);
            if (product) {
                product.images.push(imageRow.image_url);
            }
        }
    }

    return Array.from(productMap.values());
};


export const getProducts = async () => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, c.category_name, pv.variant_id, pv.color, pv.price, pv.stock, pv.image, pv.buying_price, pv.profit_margin, pv.discount
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_deleted = FALSE AND p.is_visible = TRUE
        `);
        const grouped = await groupProducts(rows);
        // Filter out bundles that are out of stock
        return grouped.filter(p => {
            if (!p.is_bundle) {
                return true; // Always include non-bundle products
            }
            // For bundles, check if any variant has stock > 0
            return p.variants.some(v => v.stock > 0);
        });
    } catch (err) {
        console.error("Error fetching products:", err);
        return [];
    }
};

export const getProductsAdmin = async () => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, c.category_name, pv.variant_id, pv.color, pv.price, pv.stock, pv.image, pv.buying_price, pv.profit_margin, pv.discount
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_deleted = FALSE
        `);
        return groupProducts(rows);
    } catch (err) {
        console.error("Error fetching products for admin:", err);
        return [];
    }
};

export const getProductById = async (id) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, c.category_name, pv.variant_id, pv.color, pv.price, pv.stock, pv.image, pv.buying_price, pv.profit_margin, pv.discount
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = ?
        `, [id]);

        if (rows.length === 0) return null;

        const grouped = await groupProducts(rows);
        return grouped[0] || null;
    } catch (err) {
        console.error("Error fetching product by ID:", err);
        return null;
    }
};

export const getProductByVariantId = async (variantId) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, c.category_name, pv.variant_id, pv.color, pv.price, pv.stock, pv.image, pv.buying_price, pv.profit_margin, pv.discount
            FROM products p
            JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE pv.variant_id = ?
        `, [variantId]);

        if (rows.length === 0) return null;

        const grouped = await groupProducts(rows);
        return grouped[0] || null;
    } catch (err) {
        console.error("Error fetching product by variant ID:", err);
        return null;
    }
};

export const createProduct = async ({ title, description, category_id, variants, is_bundle = false, bundle_of = null }) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const bundleOfValue = (is_bundle && bundle_of) ? JSON.stringify(bundle_of) : null;

        const [productResult] = await connection.execute(
            "INSERT INTO products (title, description, category_id, is_bundle, bundle_of) VALUES (?, ?, ?, ?, ?)",
            [title, description, category_id, is_bundle, bundleOfValue]
        );
        const productId = productResult.insertId;

        const variantsToInsert = (is_bundle && (!variants || variants.length === 0))
            ? [{ color: 'Bundle', price: 0, buying_price: 0, profit_margin: 0, discount: 0, stock: 1, image: null }]
            : variants;

        for (const variant of variantsToInsert) {
            await connection.execute(
                "INSERT INTO product_variants (product_id, color, price, buying_price, profit_margin, discount, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    productId,
                    variant.color || (is_bundle ? 'Bundle' : 'Default'),
                    variant.price || 0,
                    variant.buying_price || 0,
                    variant.profit_margin || 0,
                    variant.discount || 0,
                    variant.stock === undefined ? 1 : variant.stock,
                    variant.image || null
                ]
            );
        }

        await connection.commit();
        return getProductById(productId); // Return full product object
    } catch (err) {
        await connection.rollback();
        console.error("Error creating product:", err);
        throw err;
    } finally {
        connection.release();
    }
};

export const getProductsByCategoryName = async (categoryName) => {
    try {
        const query = categoryName === "Uncategorized"
            ? `SELECT p.*, c.category_name, pv.* FROM products p LEFT JOIN product_variants pv ON p.product_id = pv.product_id LEFT JOIN categories c ON p.category_id = c.category_id WHERE (p.category_id = ? OR c.is_deleted = 1) AND p.is_deleted = FALSE`
            : `SELECT p.*, c.category_name, pv.* FROM products p LEFT JOIN product_variants pv ON p.product_id = pv.product_id LEFT JOIN categories c ON p.category_id = c.category_id WHERE c.category_name = ? AND p.is_deleted = FALSE AND p.is_visible = TRUE`;
        
        const params = categoryName === "Uncategorized" ? [UNCATEGORIZED_ID] : [categoryName];

        const [rows] = await db.execute(query, params);
        const grouped = await groupProducts(rows);
        // Filter out bundles that are out of stock
        return grouped.filter(p => {
            if (!p.is_bundle) {
                return true; // Always include non-bundle products
            }
            // For bundles, check if any variant has stock > 0
            return p.variants.some(v => v.stock > 0);
        });
    } catch (err) {
        console.error("Error fetching products by category name:", err);
        return [];
    }
};

export const getProductsByCategoryNameAdmin = async (categoryName) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, c.category_name, pv.*
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE c.category_name = ?
        `, [categoryName]);
        return groupProducts(rows);
    } catch (err) {
        console.error("Error fetching products by category name (admin):", err);
        return [];
    }
};

export const getCategoryByNameAndParentId = async (categoryName, parentId = null) => {
  try {
    const [results] = await db.execute(
      "SELECT category_id, is_deleted FROM categories WHERE category_name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))",
      [categoryName, parentId, parentId]
    );

    if (!results[0]) return null;

    if (results[0].is_deleted === 1) {
      await db.execute(
        "UPDATE categories SET is_deleted = 0 WHERE category_id = ?",
        [results[0].category_id]
      );
    }

    return results[0].category_id;
  } catch (err) {
    console.error("Error fetching category by name and parent ID:", err);
    return null;
  }
};

export const createCategory = async (categoryName, parentId = null) => {
  try {
    const [result] = await db.execute(
      "INSERT INTO categories (category_name, parent_id) VALUES (?, ?)",
      [categoryName, parentId]
    );
    return {
      category_id: result.insertId,
      category_name: categoryName,
      parent_id: parentId,
    };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new Error("A category with this name already exists in this scope.");
    }
    console.error("Error creating category:", err);
    throw err;
  }
};

export const getCategories = async () => {
  try {
    const [rows] = await db.execute(`SELECT category_id, category_name, parent_id
      FROM categories
      WHERE is_deleted = 0 AND category_id <> ?
      ORDER BY category_name`, [UNCATEGORIZED_ID]);

    const categories = [];
    const categoryMap = {};

    rows.forEach(row => {
      categoryMap[row.category_id] = { ...row, subcategories: [] };
    });

    rows.forEach(row => {
      if (row.parent_id) {
        const parent = categoryMap[row.parent_id];
        if (parent) {
          parent.subcategories.push(categoryMap[row.category_id]);
        }
      } else {
        categories.push(categoryMap[row.category_id]);
      }
    });

    return categories;
  } catch (err) {
    console.error("Error fetching categories:", err);
    return [];
  }
};

export const getCategoriesByAdmin = async () => {
  try {
    const [rows] = await db.execute(`SELECT category_id, category_name, parent_id
      FROM categories
      WHERE is_deleted = 0 OR category_id = ?
      ORDER BY category_name`, [UNCATEGORIZED_ID]);

    const categories = [];
    const categoryMap = {};

    rows.forEach(row => {
      categoryMap[row.category_id] = { ...row, subcategories: [] };
    });

    rows.forEach(row => {
      if (row.parent_id) { 
        const parent = categoryMap[row.parent_id];
        if (parent) {
          parent.subcategories.push(categoryMap[row.category_id]);
        }
      } else {
        categories.push(categoryMap[row.category_id]);
      }
    });

    return categories;
  } catch (err) {
    console.error("Error fetching categories for admin:", err);
    return [];
  }
};

export const deleteCategory = async (id) => {
  try {
    if (id === UNCATEGORIZED_ID)
      throw new Error("Cannot delete the Uncategorized category");

    await db.execute(
      "UPDATE products SET category_id = ? WHERE category_id = ?",
      [UNCATEGORIZED_ID, id]
    );

    await db.execute(
      "UPDATE categories SET is_deleted = 1 WHERE category_id = ? OR parent_id = ?",
      [id, id]
    );

    return {
      success: true,
      message: "Category and its subcategories deleted. Products moved to Uncategorized",
    };
  } catch (err) {
    console.error("Error deleting category:", err);
    throw err;
  }
};

export const restoreProduct = async (productId, newCategoryId) => {
  try {
    await db.execute(
      "UPDATE products SET category_id = ?, is_deleted = FALSE WHERE product_id = ?",
      [newCategoryId, productId]
    );

    const [rows] = await db.execute(
      "SELECT * FROM products WHERE product_id = ?",
      [productId]
    );
    return rows[0];
  } catch (err) {
    console.error("Error restoring product:", err);
    throw err;
  }
};

export const permanentlyDeleteProduct = async (id) => {
  try {
    const [variants] = await db.execute("SELECT image FROM product_variants WHERE product_id = ?", [id]);
    for (const variant of variants) {
      if (variant.image) {
        const fullPath = path.join(process.cwd(), variant.image);
        try {
          await fs.unlink(fullPath);
        } catch (fileErr) {
          console.error("Failed to delete image file:", fullPath, fileErr);
        }
      }
    }

    await db.execute("DELETE FROM products WHERE product_id = ?", [id]);

    return { success: true };
  } catch (err) {
    console.error("Error permanently deleting product:", err);
    throw err;
  }
};

export const deleteProduct = async (id) => {
  try {
    await db.execute("UPDATE products SET is_deleted = TRUE WHERE product_id = ?", [id]);
    return { success: true };
  } catch (err) {
    console.error("Error deleting product:", err);
    throw err;
  }
};

export const updateProduct = async (id, updates = {}) => {
  const connection = await db.getConnection();

  const safe = (v) => (v === undefined ? null : v);

  try {
    await connection.beginTransaction();

    const { title, description, category_id, variants, is_bundle, bundle_of } = updates;

    if (title !== undefined || description !== undefined || category_id !== undefined || is_bundle !== undefined || bundle_of !== undefined) {
      await connection.execute(
        `
        UPDATE products
        SET 
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          category_id = COALESCE(?, category_id),
          is_bundle = COALESCE(?, is_bundle),
          bundle_of = COALESCE(?, bundle_of)
        WHERE product_id = ?
        `,
        [safe(title), safe(description), safe(category_id), safe(is_bundle), JSON.stringify(bundle_of), id]
      );
    }
    
    if (is_bundle) {
        // If it's a bundle, ensure it has a variant for pricing, but remove others.
        if (variants && variants.length > 0) {
            // Keep/Update the first variant for the bundle, remove the rest.
            const bundleVariant = variants[0];
            await connection.execute(
                `DELETE FROM product_variants WHERE product_id = ? AND variant_id != ?`,
                [id, bundleVariant.variant_id || -1]
            );
            
            // Now update or insert the bundle's primary variant
            if (bundleVariant.variant_id) {
                 await connection.execute(
                    `UPDATE product_variants SET color = ?, price = ?, buying_price = ?, profit_margin = ?, discount = ?, stock = ?, image = ? WHERE variant_id = ?`,
                    [
                        bundleVariant.color || 'Bundle', bundleVariant.price || 0, bundleVariant.buying_price || 0,
                        bundleVariant.profit_margin || 0, bundleVariant.discount || 0, bundleVariant.stock === undefined ? 1 : bundleVariant.stock,
                        bundleVariant.image || null, bundleVariant.variant_id
                    ]
                );
            } else {
                 await connection.execute(
                    `INSERT INTO product_variants (product_id, color, price, buying_price, profit_margin, discount, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id, bundleVariant.color || 'Bundle', bundleVariant.price || 0, bundleVariant.buying_price || 0,
                        bundleVariant.profit_margin || 0, bundleVariant.discount || 0, bundleVariant.stock === undefined ? 1 : bundleVariant.stock,
                        bundleVariant.image || null
                    ]
                );
            }
        }
    } else if (variants !== undefined) {
      const [existingVariants] = await connection.execute(
        `SELECT variant_id FROM product_variants WHERE product_id = ?`,
        [id]
      );
      const existingIds = existingVariants.map(v => v.variant_id);
      const incomingIds = [];

      for (const variant of variants) {
        if (variant.variant_id && existingIds.includes(variant.variant_id)) {
          incomingIds.push(variant.variant_id);
          await connection.execute(
            `
            UPDATE product_variants
            SET 
              color = COALESCE(?, color), price = COALESCE(?, price), buying_price = COALESCE(?, buying_price),
              profit_margin = COALESCE(?, profit_margin), discount = COALESCE(?, discount), stock = COALESCE(?, stock),
              image = COALESCE(?, image)
            WHERE variant_id = ?
            `,
            [
              safe(variant.color), safe(variant.price), safe(variant.buying_price), safe(variant.profit_margin),
              safe(variant.discount), safe(variant.stock), safe(variant.image), variant.variant_id
            ]
          );
        } else {
          const [result] = await connection.execute(
            `
            INSERT INTO product_variants
            (product_id, color, price, buying_price, profit_margin, discount, stock, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              id, safe(variant.color), safe(variant.price), safe(variant.buying_price),
              safe(variant.profit_margin), safe(variant.discount), safe(variant.stock), safe(variant.image)
            ]
          );
          incomingIds.push(result.insertId);
        }
      }

      const variantsToDelete = existingIds.filter(vId => !incomingIds.includes(vId));
      if (variantsToDelete.length > 0) {
        await connection.query(
          `DELETE FROM product_variants WHERE variant_id IN (?)`,
          [variantsToDelete]
        );
      }
    }

    await connection.commit();

    return getProductById(id);

  } catch (err) {
    await connection.rollback();
    console.error("Error updating product:", err);
    throw err;
  } finally {
    connection.release();
  }
};


export const receiveStockForVariant = async (variantId, quantityReceived, buyingPrice) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get current variant data
    const [variantRows] = await connection.execute(
      'SELECT stock, buying_price FROM product_variants WHERE variant_id = ?',
      [variantId]
    );
    
    if (variantRows.length === 0) {
      throw new Error("Variant not found");
    }
    
    const currentStock = variantRows[0].stock || 0;
    const currentAvgPrice = variantRows[0].buying_price || 0;
    
    // Calculate new average price
    const totalValue = (currentStock * currentAvgPrice) + (quantityReceived * buyingPrice);
    const newTotalStock = currentStock + quantityReceived;
    const newAvgPrice = newTotalStock > 0 ? totalValue / newTotalStock : 0;
    
    // Update variant stock and average price
    await connection.execute(
      'UPDATE product_variants SET stock = ?, buying_price = ? WHERE variant_id = ?',
      [newTotalStock, newAvgPrice, variantId]
    );
    
    // Create batch record
    await connection.execute(
      'INSERT INTO product_batches (variant_id, quantity_received, buying_price, remaining_quantity) VALUES (?, ?, ?, ?)',
      [variantId, quantityReceived, buyingPrice, quantityReceived]
    );
    
    await connection.commit();
    
    const [updatedVariant] = await connection.execute(
      'SELECT * FROM product_variants WHERE variant_id = ?',
      [variantId]
    );
    
    return updatedVariant[0];
  } catch (err) {
    await connection.rollback();
    console.error("Error receiving stock:", err);
    throw err;
  } finally {
    connection.release();
  }
};


export const getBackorderedProducts = async () => {
  try {
    const [rows] = await db.execute(`
        SELECT p.product_id, p.title, pv.variant_id, pv.color, pv.stock, pv.buying_price
        FROM products p
        JOIN product_variants pv ON p.product_id = pv.product_id
        WHERE pv.stock <= 0 AND p.is_deleted = FALSE
        ORDER BY pv.stock ASC
    `); 
    return rows;
  } catch (err) {
    console.error("Error fetching backordered products:", err);
    return [];
  }
};

export const reduceProductStock = async (variantId, quantity, connection = null) => {
    const dbConnection = connection || await db.getConnection();
    try {
        if (!connection) {
            await dbConnection.beginTransaction();
        }

        const [batches] = await dbConnection.execute(
            'SELECT batch_id, remaining_quantity, buying_price FROM product_batches WHERE variant_id = ? AND remaining_quantity > 0 ORDER BY date_received ASC',
            [variantId]
        );

        let remainingToReduce = quantity;
        let totalCOGS = 0;
        let totalQuantityReduced = 0;

        for (const batch of batches) {
            if (remainingToReduce <= 0) break;

            const reduceFromBatch = Math.min(remainingToReduce, batch.remaining_quantity);
            const newRemaining = batch.remaining_quantity - reduceFromBatch;

            await dbConnection.execute(
                'UPDATE product_batches SET remaining_quantity = ? WHERE batch_id = ?',
                [newRemaining, batch.batch_id]
            );

            totalCOGS += reduceFromBatch * batch.buying_price;
            totalQuantityReduced += reduceFromBatch;
            remainingToReduce -= reduceFromBatch;
        }

        if (remainingToReduce > 0) {
            throw new Error(`Insufficient stock for variant ${variantId}. Needed ${quantity}, but only ${totalQuantityReduced} available.`);
        }

        await dbConnection.execute(
            'UPDATE product_variants SET stock = stock - ? WHERE variant_id = ?',
            [quantity, variantId]
        );

        if (!connection) {
            await dbConnection.commit();
        }

        const averageCOGS = totalQuantityReduced > 0 ? totalCOGS / totalQuantityReduced : 0;
        return averageCOGS;

    } catch (err) {
        if (!connection) {
            await dbConnection.rollback();
        }
        console.error("Error reducing product stock:", err.message);
        throw err;
    } finally {
        if (!connection) {
            dbConnection.release();
        }
    }
}
export const updateStockForVariant = async (variantId, newStockQuantity) => {
    try {
        const [result] = await db.execute(
            `UPDATE product_variants SET stock = ? WHERE variant_id = ?`,
            [newStockQuantity, variantId]
        );

        if (result.affectedRows === 0) {
            throw new Error("Variant not found or stock not updated.");
        }

        // Get the product_id first
        const [[variant]] = await db.execute(
            `SELECT product_id FROM product_variants WHERE variant_id = ?`,
            [variantId]
        );

        if (!variant) {
            throw new Error("Variant not found.");
        }

        // Return the full product
        
                const updatedProduct = await getProductById(variant.product_id);
                return updatedProduct;
        
            } catch (err) {
                console.error("Error updating product stock for variant:", err);
                throw err;
            }
        };
        export const toggleProductVisibility = async (productId, isVisible) => {
          try {
            const [result] = await db.execute(
              "UPDATE products SET is_visible = ? WHERE product_id = ?",
              [isVisible, productId]
            );
        
            if (result.affectedRows === 0) {
              throw new Error("Product not found or visibility not updated.");
            }
        
            const updatedProduct = await getProductById(productId);
            return updatedProduct;
          } catch (err) {
            console.error("Error toggling product visibility:", err);
            throw err;
          }
        };
        export const createProductBatch = async (variantId, quantityReceived, buyingPrice) => {
  try {
    const [result] = await db.execute(
      'INSERT INTO product_batches (variant_id, quantity_received, buying_price, remaining_quantity) VALUES (?, ?, ?, ?)',
      [variantId, quantityReceived, buyingPrice, quantityReceived]
    );
    return result.insertId;
  } catch (err) {
    console.error("Error creating product batch:", err);
    throw err;
  }
};

export const getBatchesForVariant = async (variantId) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM product_batches WHERE variant_id = ? ORDER BY date_received ASC',
      [variantId]
    );
    return rows;
  } catch (err) {
    console.error("Error fetching batches:", err);
    throw err;
  }
};

export const updateBatchRemaining = async (batchId, remainingQuantity) => {
  try {
    await db.execute(
      'UPDATE product_batches SET remaining_quantity = ? WHERE batch_id = ?',
      [remainingQuantity, batchId]
    );
  } catch (err) {
    console.error("Error updating batch remaining:", err);
    throw err;
  }
};


        
        


