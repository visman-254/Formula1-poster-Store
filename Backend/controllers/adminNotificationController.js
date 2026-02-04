import db from "../config/db.js";

export const getAdminNotifications = async (req, res) => {
  try {
    const [[orders]] = await db.execute(
      "SELECT COUNT(*) AS count FROM orders WHERE is_seen_by_admin = 0"
    );

    const [[preorders]] = await db.execute(
      "SELECT COUNT(*) AS count FROM preorders WHERE is_seen_by_admin = 0"
    );

    res.json({
      success: true,
      orders: orders.count,
      preorders: preorders.count,
    });
  } catch (error) {
    console.error("Admin notification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
