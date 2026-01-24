import { getFeaturedProducts } from "../services/Featured.js";

export const fetchFeaturedProducts = async (req, res) => {
  console.log('Fetching featured products...'); // Added log
  try {
    const limit = parseInt(req.query.limit) || 10; // allow ?limit=5
    const products = await getFeaturedProducts(limit);
    console.log("Products from DB:", JSON.stringify(products, null, 2));

    // Optional: format images
    const formatted = products.map(p => ({
      ...p,
      image: p.image ? `${req.protocol}://${req.get("host")}/${p.image}` : null
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching featured products:", err);
    res.status(500).json({ message: "Server error" });
  }
};
