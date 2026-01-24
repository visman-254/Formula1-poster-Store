import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

export const getActiveHeroSlides = async () =>{
    try{
        const [rows] = await db.execute(
            "SELECT id, title, description, image_url FROM hero_slides WHERE is_active = TRUE ORDER BY id ASC"
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
            "SELECT id, title, description, image_url, is_active FROM hero_slides ORDER BY id ASC"
        )
        return rows;

    } catch(err){
        console.error("Error fetching all hero slides:", err);
        return [];
    }
}



export const createHeroSlide = async ({ title, description, imagePath }) => {
    try {
        const [result] = await db.execute(`
            INSERT INTO hero_slides
                (title, description, image_url)
            VALUES (?, ?, ?)
        `, [title, description, imagePath]);

        return {
            id: result.insertId,
            title,
            description,
            image_url: imagePath,
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



