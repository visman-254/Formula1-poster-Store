import db from "../config/db.js";

export const createPreorder = async (name, email, phone, device) => {
    try {
        const [result] = await db.execute(
            "INSERT INTO preorders (name, email, phone, device) VALUES (?, ?, ?, ?)",
            [name, email, phone, device]
        );
        return { 
            preorder_id: result.insertId, 
            name, 
            email, 
            phone, 
            device 
        };
    } catch (err) {
        console.error("Error creating preorder:", err);
        throw err;
    }
};

export const getAllPreorders = async () => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM preorders ORDER BY created_at DESC"
        );
        return rows;
    } catch (err) {
        console.error("Error fetching preorders:", err);
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
            `SELECT * FROM preorders 
             WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR device LIKE ? OR status LIKE ?
             ORDER BY created_at DESC`,
            [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
        );
        return rows;
    } catch (err) {
        console.error("Error searching preorders:", err);
        return [];
    }
};

// Keep the original getPreorders function for backward compatibility
export const getPreorders = getAllPreorders;