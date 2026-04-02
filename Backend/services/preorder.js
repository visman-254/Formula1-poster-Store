import db from "../config/db.js";

export const createPreorderWithProducts = async (preorderData, items) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Insert main preorder record
        const [preorderResult] = await connection.execute(
            `INSERT INTO preorders 
            (name, email, phone, user_id, address, city, zipcode, notes, status, total_amount, is_backorder) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
            [
                preorderData.name,
                preorderData.email,
                preorderData.phone,
                preorderData.user_id || null,
                preorderData.address || null,
                preorderData.city || null,
                preorderData.zipcode || null,
                preorderData.notes || null,
                preorderData.total_amount,
                preorderData.is_backorder || false
            ]
        );

        const preorderId = preorderResult.insertId;

        // Insert each preordered product
        for (const item of items) {
            await connection.execute(
                `INSERT INTO preorder_products 
                (preorder_id, variant_id, quantity, price_at_preorder) 
                VALUES (?, ?, ?, ?)`,
                [preorderId, item.variant_id, item.quantity, item.price]
            );
        }

        await connection.commit();
        
        return { preorder_id: preorderId, ...preorderData };
    } catch (err) {
        await connection.rollback();
        console.error("Error creating preorder with products:", err);
        throw err;
    } finally {
        connection.release();
    }
};

export const getPreorderById = async (preorderId) => {
    try {
        const [preorderRows] = await db.execute(
            `SELECT p.*, 
                    GROUP_CONCAT(DISTINCT pp.variant_id) as variant_ids,
                    GROUP_CONCAT(DISTINCT pp.quantity) as quantities
             FROM preorders p
             LEFT JOIN preorder_products pp ON p.preorder_id = pp.preorder_id
             WHERE p.preorder_id = ?
             GROUP BY p.preorder_id`,
            [preorderId]
        );

        if (preorderRows.length === 0) return null;

        const preorder = preorderRows[0];
        
        // Get products for this preorder
        const [productRows] = await db.execute(
            `SELECT pp.*, pv.color, pv.price, pv.storage, pv.ram, pr.title as product_name
             FROM preorder_products pp
             JOIN product_variants pv ON pp.variant_id = pv.variant_id
             JOIN products pr ON pv.product_id = pr.product_id
             WHERE pp.preorder_id = ?`,
            [preorderId]
        );

        preorder.products = productRows;
        return preorder;
    } catch (err) {
        console.error("Error fetching preorder by ID:", err);
        return null;
    }
};

export const getAllPreordersWithProducts = async () => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                p.preorder_id,
                p.name,
                p.email,
                p.phone,
                p.status,
                p.created_at,
                p.total_amount,
                p.is_backorder,
                p.address,
                p.city,
                p.zipcode,
                p.notes,
                GROUP_CONCAT(
                    CONCAT(pr.title, ' (', pv.color, '): ', pp.quantity, 'x @ ', pp.price_at_preorder)
                    SEPARATOR ' | '
                ) as product_summary
            FROM preorders p
            LEFT JOIN preorder_products pp ON p.preorder_id = pp.preorder_id
            LEFT JOIN product_variants pv ON pp.variant_id = pv.variant_id
            LEFT JOIN products pr ON pv.product_id = pr.product_id
            GROUP BY p.preorder_id
            ORDER BY p.created_at DESC
        `);
        
        return rows;
    } catch (err) {
        console.error("Error fetching preorders with products:", err);
        return [];
    }
};

export const updatePreorderStatus = async (preorderId, status, notes = null) => {
    try {
        if (notes) {
            const [result] = await db.execute(
                "UPDATE preorders SET status = ?, notes = ? WHERE preorder_id = ?",
                [status, notes, preorderId]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await db.execute(
                "UPDATE preorders SET status = ? WHERE preorder_id = ?",
                [status, preorderId]
            );
            return result.affectedRows > 0;
        }
    } catch (err) {
        console.error("Error updating preorder status:", err);
        throw err;
    }
};

export const deletePreorder = async (preorderId) => {
    try {
        const [result] = await db.execute(
            "DELETE FROM preorders WHERE preorder_id = ?",
            [preorderId]
        );
        return result.affectedRows > 0;
    } catch (err) {
        console.error("Error deleting preorder:", err);
        throw err;
    }
};

export const searchPreorders = async (query) => {
    try {
        const [rows] = await db.execute(
            `SELECT p.*, 
                    GROUP_CONCAT(DISTINCT pr.title) as products
             FROM preorders p
             LEFT JOIN preorder_products pp ON p.preorder_id = pp.preorder_id
             LEFT JOIN product_variants pv ON pp.variant_id = pv.variant_id
             LEFT JOIN products pr ON pv.product_id = pr.product_id
             WHERE p.name LIKE ? OR p.email LIKE ? OR p.phone LIKE ? 
                OR pr.title LIKE ? OR p.status LIKE ?
             GROUP BY p.preorder_id
             ORDER BY p.created_at DESC`,
            [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
        );
        return rows;
    } catch (err) {
        console.error("Error searching preorders:", err);
        return [];
    }
};

// Get all preorder-eligible products (for customer frontend)
export const getPreorderEligibleProducts = async () => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, pv.*, c.category_name
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_deleted = FALSE 
            AND p.is_visible = TRUE
            AND p.is_preorder_eligible = TRUE
            AND pv.preorder_available = 1
            ORDER BY p.product_id, pv.color
        `);
        
        // Group by product
        const productMap = new Map();
        for (const row of rows) {
            if (!productMap.has(row.product_id)) {
                productMap.set(row.product_id, {
                    product_id: row.product_id,
                    title: row.title,
                    description: row.description,
                    category_name: row.category_name,
                    variants: []
                });
            }
            if (row.variant_id) {
                productMap.get(row.product_id).variants.push({
                    variant_id: row.variant_id,
                    color: row.color,
                    color_hex: row.color_hex,
                    storage: row.storage,
                    ram: row.ram,
                    price: parseFloat(row.price),
                    preorder_price: row.preorder_price ? parseFloat(row.preorder_price) : parseFloat(row.price),
                    preorder_eta_days: row.preorder_eta_days || 14,
                    image: row.image,
                    product_code: row.product_code
                });
            }
        }
        
        return Array.from(productMap.values());
    } catch (err) {
        console.error("Error fetching preorder eligible products:", err);
        return [];
    }
};

// Admin function to create preorder products (like creating regular products)
export const createPreorderProduct = async (productData) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Insert product with preorder eligibility
        const [productResult] = await connection.execute(
            `INSERT INTO products 
            (title, description, category_id, is_preorder_eligible, is_visible, is_deleted) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                productData.title,
                productData.description || null,
                productData.category_id || 127,
                1, // is_preorder_eligible = true
                1, // is_visible = true
                0  // is_deleted = false
            ]
        );
        
        const productId = productResult.insertId;

        // Create preorder variants
        for (const variant of productData.variants) {
            await connection.execute(
                `INSERT INTO product_variants 
                (product_id, color, color_hex, storage, ram, price, buying_price, profit_margin, 
                 discount, stock, image, product_code, preorder_price, preorder_available, preorder_eta_days) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    productId,
                    variant.color,
                    variant.color_hex || null,
                    variant.storage || null,
                    variant.ram || null,
                    parseFloat(variant.price) || 0,
                    0, // buying_price (0 for preorder items)
                    0, // profit_margin
                    0, // discount
                    0, // stock (0 for preorder items)
                    variant.image || null,
                    variant.product_code || null,
                    parseFloat(variant.preorder_price) || parseFloat(variant.price) || 0,
                    1, // preorder_available = true
                    parseInt(variant.preorder_eta_days) || 14
                ]
            );
        }

        await connection.commit();
        
        // Return the created product
        return {
            product_id: productId,
            title: productData.title,
            description: productData.description,
            variants: productData.variants
        };
    } catch (err) {
        await connection.rollback();
        console.error("Error creating preorder product:", err);
        throw err;
    } finally {
        connection.release();
    }
};

// Admin function to update preorder product
export const updatePreorderProduct = async (productId, productData) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update product
        await connection.execute(
            `UPDATE products 
             SET title = ?, description = ?, category_id = ?
             WHERE product_id = ?`,
            [
                productData.title,
                productData.description || null,
                productData.category_id || 127,
                productId
            ]
        );

        // Delete existing variants
        await connection.execute(
            `DELETE FROM product_variants WHERE product_id = ?`,
            [productId]
        );

        // Insert updated variants
        for (const variant of productData.variants) {
            await connection.execute(
                `INSERT INTO product_variants 
                (product_id, color, color_hex, storage, ram, price, buying_price, profit_margin, 
                 discount, stock, image, product_code, preorder_price, preorder_available, preorder_eta_days) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    productId,
                    variant.color,
                    variant.color_hex || null,
                    variant.storage || null,
                    variant.ram || null,
                    parseFloat(variant.price) || 0,
                    0,
                    0,
                    0,
                    0,
                    variant.image || null,
                    variant.product_code || null,
                    parseFloat(variant.preorder_price) || parseFloat(variant.price) || 0,
                    1, // preorder_available = true
                    parseInt(variant.preorder_eta_days) || 14
                ]
            );
        }

        await connection.commit();
        
        return {
            product_id: productId,
            title: productData.title,
            description: productData.description,
            variants: productData.variants
        };
    } catch (err) {
        await connection.rollback();
        console.error("Error updating preorder product:", err);
        throw err;
    } finally {
        connection.release();
    }
};