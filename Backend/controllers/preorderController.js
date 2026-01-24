import * as preorderService from '../services/preorder.js';
import { sendPreorderNotificationEmail } from "../services/emailService.js";

export const createPreorder = async (req, res) => {
    try {
        const { name, email, phone, device } = req.body;

        // Basic validation
        if (!name || !phone || !device) {
            return res.status(400).json({
                message: 'Name, phone, and device are required'
            });
        }

        const preorder = await preorderService.createPreorder(
            name,
            email,
            phone,
            device
        );

        sendPreorderNotificationEmail({
            name,
            email,
            phone,
            device,
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

export const getPreorders = async (req, res) => {
    try {
        const preorders = await preorderService.getAllPreorders();
        res.status(200).json(preorders);
    } catch (error) {
        console.error('Error fetching preorders:', error);
        res.status(500).json({
            message: 'Error fetching preorders',
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
            const preorders = await preorderService.getAllPreorders();
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
