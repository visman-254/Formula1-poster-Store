import db from "../config/db.js";

/* ============================
   GET ACTIVE PROMOTIONS
============================ */
export const getActivePromotions = async () => {
  try {
    const [rows] = await db.execute(
      "SELECT id, image_url FROM product_promotions WHERE is_active = 1 ORDER BY id ASC"
    );
    return rows;
  } catch (err) {
    console.error("Error fetching active promotions:", err);
    return [];
  }
};

/* ============================
   GET ALL PROMOTIONS (ADMIN)
============================ */
export const getAllPromotions = async () => {
  try {
    const [rows] = await db.execute(
      "SELECT id, image_url, is_active FROM product_promotions ORDER BY id ASC"
    );
    return rows;
  } catch (err) {
    console.error("Error fetching all promotions:", err);
    return [];
  }
};

/* ============================
   CREATE PROMOTION
============================ */
export const createPromotion = async ({ imagePath }) => {
  try {
    const [result] = await db.execute(
      `INSERT INTO product_promotions (image_url)
       VALUES (?)`,
      [imagePath]
    );

    return {
      id: result.insertId,
      image_url: imagePath,
      is_active: 1
    };
  } catch (err) {
    console.error("Error creating promotion:", err);
    throw err;
  }
};

/* ============================
   TOGGLE STATUS
============================ */
export const togglePromotionStatus = async (id, status) => {
  try {
    await db.execute(
      "UPDATE product_promotions SET is_active = ? WHERE id = ?",
      [status, id]
    );
    return { success: true };
  } catch (err) {
    console.error("Error toggling promotion status:", err);
    throw err;
  }
};

/* ============================
   DELETE PROMOTION
============================ */
export const deletePromotion = async (id) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM product_promotions WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Promotion not found");
    }

    return { success: true };
  } catch (err) {
    console.error("Error deleting promotion:", err);
    throw err;
  }
};
