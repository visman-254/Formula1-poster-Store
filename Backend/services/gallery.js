import db from "../config/db.js";

export const addProductImages = async (productId, images) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const image of images) {
      await connection.execute(
        "INSERT INTO product_images (product_id, image_url) VALUES (?, ?)",
        [productId, image]
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error("Error adding product images:", err);
    throw err;
  } finally {
    connection.release();
  }
};

export const getProductImages = async (productId) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM product_images WHERE product_id = ? ORDER BY created_at DESC",
      [productId]
    );
    return rows;
  } catch (err) {
    console.error("Error getting product images:", err);
    throw err;
  }
};

export const deleteProductImage = async (imageId) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM product_images WHERE image_id = ?",
      [imageId]
    );
    return result.affectedRows > 0;
  } catch (err) {
    console.error("Error deleting product image:", err);
    throw err;
  }
};