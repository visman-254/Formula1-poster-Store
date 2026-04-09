import * as preorderService from '../services/preorder.js';
import { sendPreorderNotificationEmail } from "../services/emailService.js";

export const createPreorder = async (req, res) => {
    try {
        const { name, email, phone, items, address, city, zipcode, user_id, notes } = req.body;

        // Validate
        if (!name || !phone) {
            return res.status(400).json({
                message: 'Name and phone are required'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: 'At least one product is required'
            });
        }

        // Validate each item has required fields
        for (const item of items) {
            if (!item.variant_id || !item.quantity || item.quantity < 1) {
                return res.status(400).json({
                    message: 'Each item must have a valid variant_id and quantity'
                });
            }
        }

        // Calculate total
        let total_amount = 0;
        for (const item of items) {
            total_amount += item.price * item.quantity;
        }

        const preorderData = {
            name,
            email: email || '',
            phone,
            user_id: user_id || null,
            address: address || null,
            city: city || null,
            zipcode: zipcode || null,
            notes: notes || null,
            total_amount,
            is_backorder: false
        };

        const preorder = await preorderService.createPreorderWithProducts(
            preorderData,
            items
        );

        // Send notification email (don't await, let it run in background)
        sendPreorderNotificationEmail({
            name,
            email,
            phone,
            items,
            total_amount,
            createdAt: new Date()
        }).catch(err => {
            console.error("Failed to send preorder email:", err);
        });

        res.status(201).json({
            message: 'Pre-order submitted successfully',
            data: preorder
        });
    } catch (error) {
        console.error('Error creating preorder:', error);
        res.status(500).json({
            message: 'Error creating preorder',
            error: error.message
        });
    }
};

// Public method - no authentication required
export const getPreorderProducts = async (req, res) => {
    try {
        const products = await preorderService.getPreorderEligibleProducts();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching preorder products:', error);
        res.status(500).json({
            message: 'Error fetching preorder products',
            error: error.message
        });
    }
};

export const getPreorders = async (req, res) => {
    try {
        const preorders = await preorderService.getAllPreordersWithProducts();
        res.status(200).json(preorders);
    } catch (error) {
        console.error('Error fetching preorders:', error);
        res.status(500).json({
            message: 'Error fetching preorders',
            error: error.message
        });
    }
};

export const getPreorderById = async (req, res) => {
    try {
        const { preorderId } = req.params;
        const preorder = await preorderService.getPreorderById(preorderId);
        
        if (!preorder) {
            return res.status(404).json({ message: 'Preorder not found' });
        }
        
        res.status(200).json(preorder);
    } catch (error) {
        console.error('Error fetching preorder:', error);
        res.status(500).json({
            message: 'Error fetching preorder',
            error: error.message
        });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { preorderId } = req.params;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({
                message: 'Status is required'
            });
        }

        const updated = await preorderService.updatePreorderStatus(
            preorderId,
            status,
            notes
        );

        if (updated) {
            res.status(200).json({
                message: 'Preorder status updated successfully'
            });
        } else {
            res.status(404).json({
                message: 'Preorder not found'
            });
        }
    } catch (error) {
        console.error('Error updating preorder status:', error);
        res.status(500).json({
            message: 'Error updating preorder status',
            error: error.message
        });
    }
};

export const deletePreorder = async (req, res) => {
    try {
        const { preorderId } = req.params;
        const deleted = await preorderService.deletePreorder(preorderId);

        if (deleted) {
            res.status(200).json({
                message: 'Preorder deleted successfully'
            });
        } else {
            res.status(404).json({
                message: 'Preorder not found'
            });
        }
    } catch (error) {
        console.error('Error deleting preorder:', error);
        res.status(500).json({
            message: 'Error deleting preorder',
            error: error.message
        });
    }
};

export const searchPreorders = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            const preorders = await preorderService.getAllPreordersWithProducts();
            return res.status(200).json(preorders);
        }

        const preorders = await preorderService.searchPreorders(query);
        res.status(200).json(preorders);
    } catch (error) {
        console.error('Error searching preorders:', error);
        res.status(500).json({
            message: 'Error searching preorders',
            error: error.message
        });
    }
};

// Admin: Create a new preorder product
export const createPreorderProduct = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Admin only" });
        }

        const { title, description, category_id, variants, additional_images } = req.body;

        if (!title) {
            return res.status(400).json({
                message: 'Product title is required'
            });
        }

        if (!variants || variants.length === 0) {
            return res.status(400).json({
                message: 'At least one variant is required'
            });
        }

        // Create product using the service
        const product = await preorderService.createPreorderProduct({
            title,
            description,
            category_id: category_id || 127,
            variants,
            additional_images: additional_images || []
        });

        res.status(201).json({
            message: 'Preorder product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Error creating preorder product:', error);
        res.status(500).json({
            message: 'Error creating preorder product',
            error: error.message
        });
    }
};