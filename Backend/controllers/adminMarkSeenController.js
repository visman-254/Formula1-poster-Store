import db from "../config/db.js";

export const markOrdersSeen = async (req, res) => {
  try {
    await db.execute(
      "UPDATE orders SET is_seen_by_admin = 1 WHERE is_seen_by_admin = 0"
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Mark orders seen error:", error);
    res.status(500).json({ success: false });
  }
};

export const markPreordersSeen = async (req, res) => {
  try {
    await db.execute(
      "UPDATE preorders SET is_seen_by_admin = 1 WHERE is_seen_by_admin = 0"
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Mark preorders seen error:", error);
    res.status(500).json({ success: false });
  }
};
