import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

export const getLowStockProducts = async (stockThreshold = 5) => {
    try {
        const [rows] = await db.execute(
            `SELECT
                p.product_id,
                p.title,
                p.category_id,
                MIN(pv.stock) AS lowest_stock
            FROM products p
            JOIN product_variants pv ON p.product_id = pv.product_id
            WHERE p.is_deleted = FALSE
            GROUP BY p.product_id, p.title, p.category_id
            HAVING lowest_stock <= ?
            ORDER BY lowest_stock ASC, p.title ASC`,
            [stockThreshold]
        );
        return rows;
    } catch (err) {
        console.error("Error fetching low stock products:", err);
        return [];
    }
};


export const addStock = async () =>{
    
}