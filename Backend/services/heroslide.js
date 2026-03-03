import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

export const getActiveHeroSlides = async () =>{
    try{
        const [rows] = await db.execute(
            `SELECT 
                h.id, h.title, h.description, h.image_url, h.category_id, 
                COALESCE(
                    (SELECT c2.category_name 
                     FROM categories c2 
                     JOIN products p ON p.category_id = c2.category_id 
                     WHERE c2.parent_id = h.category_id AND p.is_deleted = 0 AND p.is_visible = 1
                     LIMIT 1),
                    c.category_name
                ) as category_name
            FROM hero_slides h 
            LEFT JOIN categories c ON h.category_id = c.category_id 
            WHERE h.is_active = TRUE 
            ORDER BY h.id ASC`
        );
        return rows;

    }catch(err){

    console.error("Error fetching active hero slides:", err);
     return [];
    }
        
    }


export const getAllHeroSlides = async () =>{
    try{
        
        const [rows] = await db.execute(
            "SELECT h.id, h.title, h.description, h.image_url, h.is_active, h.category_id, c.category_name FROM hero_slides h LEFT JOIN categories c ON h.category_id = c.category_id ORDER BY h.id ASC"
        )
        return rows;

    } catch(err){
        console.error("Error fetching all hero slides:", err);
        return [];
    }
}



export const createHeroSlide = async ({ title, description, imagePath, categoryId }) => {
    try {
        const [result] = await db.execute(`
            INSERT INTO hero_slides
                (title, description, image_url, category_id)
            VALUES (?, ?, ?, ?)
        `, [title, description, imagePath, categoryId || null]);

        return {
            id: result.insertId,
            title,
            description,
            image_url: imagePath,
            category_id: categoryId || null,
            is_active: 1,
        };
    } catch (err) {
        console.error("Error creating hero slide:", err);
        throw err;
    }
};


export const toggleHeroSlideStatus = async (id, status) => {
    try {
        await db.execute(
            "UPDATE hero_slides SET is_active = ? WHERE id = ?",
            [status, id]
        );
        return { success: true };
    } catch (err) {
        console.error("Error toggling hero slide status:", err);
        throw err;
    }
};
export const deleteHeroSlide = async (id) => {
   
    try {
        const [result] = await db.execute(
            "DELETE FROM hero_slides WHERE id = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            throw new Error("Hero slide not found");
        }
        return { success: true };
    } catch (err) {
        console.error("Error deleting hero slide:", err);
        throw err;
    }
};

export const updateHeroSlide = async (id, { title, description, categoryId }) => {
    try {
        await db.execute(
            "UPDATE hero_slides SET title = ?, description = ?, category_id = ? WHERE id = ?",
            [title, description, categoryId || null, id]
        );
        return { success: true };
    } catch (err) {
        console.error("Error updating hero slide:", err);
        throw err;
    }
};



