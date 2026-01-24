import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

export const getFeaturedProducts = async (limit = 10) => {
  try {
    const sql = `
      SELECT 
        p.product_id,
        p.title,
        v.image,
        p.description,
        p.category_id,
        c.category_name,
        COALESCE(MIN(v.price), MIN(v.price)) AS price,
        SUM(oi.quantity) AS total_sold
      FROM order_items oi
      INNER JOIN product_variants v ON oi.variant_id = v.variant_id
      INNER JOIN products p ON v.product_id = p.product_id
      INNER JOIN orders o ON oi.order_id = o.id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.is_deleted = FALSE
        AND o.status IN ('delivered', 'shipped')
        AND c.is_deleted = 0
      GROUP BY p.product_id
      ORDER BY total_sold DESC
      LIMIT ${limit}
    `;

    const [rows] = await db.execute(sql);
    return rows;
  } catch (err) {
    console.error("Error fetching featured products:", err);
    return [];
  }
};