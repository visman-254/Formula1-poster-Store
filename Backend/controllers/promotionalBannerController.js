import {
    createPromotionalBanner,
    getActiveBannersByLocation,
    getAllPromotionalBanners,
    deletePromotionalBanner,
    updateBannerStatusService,
} from "../services/promotionalBanner.js";

import { promises as fs } from "fs";

/* -------------------- Helpers -------------------- */

/**
 * Constructs the full image URL for the frontend.
 */
const formatBannerImage = (req, image) => {
    if (!image) return null;

    // Already a full URL → leave unchanged
    if (/^https?:\/\//i.test(image)) return image;

    // Remove leading slashes/backslashes
    const cleaned = String(image).replace(/^\\+|^\/+/, "");

    // Ensure the path correctly points to the 'uploads/images' directory
    const normalizedPath = cleaned.includes("uploads/images")
        ? cleaned
        : `uploads/images/${cleaned}`;

    return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

const formatBanner = (req, banner) => ({
    ...banner,
    image_url: formatBannerImage(req, banner.image_url),
});

/* -------------------- Controllers -------------------- */

/**
 * GET – Public banners by location
 */
export const getPublicBanners = async (req, res) => {
    try {
        const { location } = req.params;
        const banners = await getActiveBannersByLocation(location);
        res.json(banners.map((b) => formatBanner(req, b)));
    } catch (err) {
        console.error("Error fetching banners by location:", err);
        res.status(500).json({ error: "Failed to fetch banners" });
    }
};

/**
 * GET – All banners (Admin)
 */
export const getAllBanners = async (req, res) => {
    try {
        const banners = await getAllPromotionalBanners();
        res.json(banners.map((b) => formatBanner(req, b)));
    } catch (err) {
        console.error("Error fetching all banners:", err);
        res.status(500).json({ error: "Failed to fetch banners" });
    }
};

/**
 * POST – Create new banner (Admin)
 */
export const createNewBanner = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            if (req.file) await fs.unlink(req.file.path);
            return res.status(403).json({ error: "Admin access only" });
        }

        const { title, link_url, display_location } = req.body;

        if (!title || !display_location) {
            if (req.file) await fs.unlink(req.file.path);
            return res.status(400).json({
                error: "Title and display_location are required",
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Image is required" });
        }

        const imagePath = `uploads/images/${req.file.filename}`;

        const banner = await createPromotionalBanner({
            title,
            imagePath,
            linkUrl: link_url,
            displayLocation: display_location,
        });

        res.status(201).json({
            message: "Promotional banner created successfully",
            banner: formatBanner(req, banner),
        });
    } catch (err) {
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        console.error("Error creating banner:", err);
        res.status(500).json({ error: "Failed to create banner" });
    }
};

/**
 * PUT – Update banner status (Admin)
 */
export const updateBannerStatus = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Admin access only" });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined || typeof status !== 'boolean') {
            return res.status(400).json({ 
                error: "A boolean 'status' is required in the request body." 
            });
        }

        const dbStatus = status ? 1 : 0;
        await updateBannerStatusService(id, dbStatus);
        
        res.json({ 
            success: true, 
            message: `Banner ${status ? 'activated' : 'deactivated'}` 
        });
    } catch (err) {
        console.error("Error updating banner status:", err);
        res.status(500).json({ error: "Failed to update banner status" });
    }
};

/**
 * DELETE – Remove banner (Admin)
 */
export const removeBanner = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Admin access only" });
        }

        const { id } = req.params;
        await deletePromotionalBanner(id);
        
        // TODO: Add logic to delete the actual image file from disk
        
        res.json({ 
            success: true, 
            message: "Banner deleted successfully" 
        });
    } catch (err) {
        console.error("Error deleting banner:", err);
        res.status(500).json({ error: err.message || "Failed to delete banner" });
    }
};