import express from "express";
import { getAdminNotifications } from "../controllers/adminNotificationController.js";
import {
  markOrdersSeen,
  markPreordersSeen,
} from "../controllers/adminMarkSeenController.js";

const router = express.Router();

// Get counts
router.get("/notifications", getAdminNotifications);

// Mark as seen
router.patch("/orders/mark-seen", markOrdersSeen);
router.patch("/preorders/mark-seen", markPreordersSeen);

export default router;
