// src/controllers/heroSlideController.js

import {
    getActiveHeroSlides,
    getAllHeroSlides,
    createHeroSlide,
    deleteHeroSlide,
    toggleHeroSlideStatus
} from "../services/heroslide.js";

import sharp from "sharp";
// CRITICAL FIX: Use the 'promises' version of fs for 'await fs.unlink()'
import { promises as fs } from "fs"; 
import path from "path";

// -------------------- Helpers --------------------

/**
 * Constructs the full image URL for the frontend.
 */
const formatHeroSlideImage = (req, image) => {
    if (!image) return null;

    // Already a full URL → leave unchanged
    if (/^https?:\/\//i.test(image)) return image;

    // Remove leading slashes/backslashes
    const cleaned = String(image).replace(/^\\+|^\/+/, "");

    // Ensure the path correctly points to the 'uploads/hero' directory
    const normalizedPath = cleaned.includes("uploads/hero")
        ? cleaned
        : `uploads/hero/${cleaned}`;

    return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};


const formatHeroSlide = (req, slide) => ({
    ...slide,
    // Ensure the image URL is correctly retrieved from the DB field 'image_url'
    image_url: formatHeroSlideImage(req, slide.image_url),
});



export const getUserHeroSlides = async (req, res) => {
    try {
        const heroSlides = await getActiveHeroSlides();
        
        
        res.json(heroSlides.map(slide => formatHeroSlide(req, slide)));
        
    } catch (err) {
        console.error("Error fetching active hero slides:", err);
        res.status(500).json({ error: "Failed to fetch active hero slides" });
    }
}

export const getFullHeroSlides = async (req, res) => {
    try {
        const heroSlides = await getAllHeroSlides();
        
        
        res.json(heroSlides.map(slide => formatHeroSlide(req, slide)));
        
    } catch (err) {
        console.error("Error fetching all hero slides:", err);
        res.status(500).json({ error: "Failed to fetch all hero slides" });
    }
}


export const newHeroSlide = async (req, res) => {
    
    const MIN_REQUIRED_HEIGHT = 350; // New minimum height (down from 500)
    const MIN_ASPECT_RATIO = 1.5;    // Must be at least 1.5 times wider than it is tall (e.g., 1500x1000)
    const MAX_ASPECT_RATIO = 4.0;    // Maximum width limit

    try {
      
        if (req.user?.role !== "admin") {
            if (req.file) await fs.unlink(req.file.path);
            return res.status(403).json({ error: "Access denied. Admin only." });
        }

        const { title, description } = req.body;
        
        
        if (!req.file) {
            return res.status(400).json({ 
                error: "Image is required." 
            });
        }
        
      
        const imageMetadata = await sharp(req.file.path).metadata();
        const { width, height } = imageMetadata;
        
        const currentRatio = width / height;

        
        const isHeightMet = height >= MIN_REQUIRED_HEIGHT;
        const isWideEnough = currentRatio >= MIN_ASPECT_RATIO;
        const isNotTooWide = currentRatio <= MAX_ASPECT_RATIO;
        
        
      
        if (!isHeightMet || !isWideEnough || !isNotTooWide) {
            
          
            let errorMessage = "Image validation failed: ";
            
            if (!isHeightMet) {
                errorMessage += `Height must be at least ${MIN_REQUIRED_HEIGHT}px (Current: ${height}px). `;
            }
            if (!isWideEnough) {
                errorMessage += `Image must be rectangular with a minimum aspect ratio of ${MIN_ASPECT_RATIO}:1 (Current: ${currentRatio.toFixed(2)}:1). `;
            }
             if (!isNotTooWide) {
                errorMessage += `Image is too wide. Maximum allowed aspect ratio is ${MAX_ASPECT_RATIO}:1 (Current: ${currentRatio.toFixed(2)}:1).`;
            }
            
           
            await fs.unlink(req.file.path); 
            return res.status(400).json({ 
                error: errorMessage 
            });
        }
        
      
        const imagePath = `uploads/hero/${req.file.filename}`;
        const newSlide = await createHeroSlide({ 
            title: title || null, 
            description: description || null, 
            imagePath 
        });
        
       
        res.status(201).json({ 
            message: "Hero slide created successfully",
            slide: formatHeroSlide(req, newSlide) 
        });

    } catch (err) {
       
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(e => console.error("Failed to delete temp file:", e));
        }
        console.error("Error creating hero slide:", err);
        res.status(500).json({ error: "Failed to create hero slide" });
    }
}


export const generateHeroSlideStatus = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Access denied. Admin only." });
        }
    
        const { id } = req.params;
        const { status } = req.body; 

        // CRITICAL FIX: The database service expects a value for 'is_active', 
        // which should be 1 for active and 0 for inactive.
        // Assuming your frontend sends `true` or `false` for status.
        const dbStatus = status ? 1 : 0; 

        if (status === undefined || typeof status !== 'boolean') {
             return res.status(400).json({ error: "A boolean 'status' is required in the request body." });
        }

        const result = await toggleHeroSlideStatus(id, dbStatus);
        res.json(result);
        
    } catch (err) {
        console.error("Error toggling hero slide status:", err);
        res.status(500).json({ error: "Failed to toggle hero slide status" });
    }
}


export const removeHeroSlide = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Access denied. Admin only." });
        }
    
        const { id } = req.params;
        
        // TODO: ADD LOGIC HERE TO DELETE THE ACTUAL IMAGE FILE FROM DISK
        // BEFORE DELETING THE DATABASE ENTRY.
        
        const result = await deleteHeroSlide(id); 
        
        res.json({ message: `Hero slide ${id} deleted successfully`, ...result });
        
    } catch (err) {
        console.error("Error deleting hero slide:", err);
        res.status(500).json({ error: err.message || "Failed to delete hero slide" });
    }
}