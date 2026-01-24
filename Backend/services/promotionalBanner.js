import db from "../config/db.js";

/**
 * Get ACTIVE banners by display location (public)
 */
export const getActiveBannersByLocation = async (location) => {
    try {
        console.log("📊 [SERVICE] Fetching banners for location:", location);
        
        const [rows] = await db.execute(
            `
            SELECT id, title, image_url, link_url, display_location
            FROM promotional_banners
            WHERE is_active = TRUE AND display_location = ?
            ORDER BY id ASC
            `,
            [location]
        );
        
        console.log("✅ [SERVICE] Found", rows.length, "banners for location:", location);
        console.log("📋 [SERVICE] Banner data:", rows);
        
        return rows;
    } catch (err) {
        console.error("❌ [SERVICE] Error fetching banners by location:", err);
        return [];
    }
};
/**
 * Get ALL banners (admin)
 */
export const getAllPromotionalBanners = async () => {
    try {
        console.log("📊 [SERVICE] Fetching ALL promotional banners");
        
        const [rows] = await db.execute(
            `
            SELECT id, title, image_url, link_url, is_active, display_location, created_at
            FROM promotional_banners
            ORDER BY id DESC
            `
        );
        
        console.log("✅ [SERVICE] Found total", rows.length, "banners");
        console.log("📋 [SERVICE] Banner data:", rows);
        return rows;
    } catch (err) {
        console.error("❌ [SERVICE] Error fetching all promotional banners:", err);
        return [];
    }
};

/**
 * Create a new banner
 */
export const createPromotionalBanner = async ({ title, imagePath, linkUrl, displayLocation }) => {
    try {
        const [result] = await db.execute(
            `
            INSERT INTO promotional_banners
                (title, image_url, link_url, display_location)
            VALUES (?, ?, ?, ?)
            `,
            [title, imagePath, linkUrl || null, displayLocation]
        );

        return {
            id: result.insertId,
            title,
            image_url: imagePath,
            link_url: linkUrl || null,
            display_location: displayLocation,
            is_active: 1,
        };
    } catch (err) {
        console.error("Error creating promotional banner:", err);
        throw err;
    }
};

/**
 * Toggle banner status
 */
export const updateBannerStatusService = async (id, status) => {
    try {
        await db.execute(
            "UPDATE promotional_banners SET is_active = ? WHERE id = ?",
            [status, id]
        );
        return { success: true };
    } catch (err) {
        console.error("Error toggling banner status:", err);
        throw err;
    }
};

/**
 * Delete banner
 */
export const deletePromotionalBanner = async (id) => {
    try {
        const [result] = await db.execute(
            "DELETE FROM promotional_banners WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Banner not found");
        }
        return { success: true };
    } catch (err) {
        console.error("Error deleting promotional banner:", err);
        throw err;
    }
};