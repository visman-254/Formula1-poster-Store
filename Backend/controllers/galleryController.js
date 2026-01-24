import {
  addProductImages,
  getProductImages,
  deleteProductImage,
} from "../services/gallery.js";

const formatProductImage = (req, image) => {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image; 

  const cleaned = String(image).replace(/^\\+|^\/+/g, "");
  const normalizedPath = cleaned.includes("uploads/images")
    ? cleaned
    : `uploads/images/${cleaned}`;

  return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

export const uploadProductImages = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { productId } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    const images = req.files.map((file) => `uploads/images/${file.filename}`);

    await addProductImages(productId, images);

    // Get the updated list of images to return
    const updatedImages = await getProductImages(productId);
    const formattedImages = updatedImages.map(image => ({
      image_id: image.image_id,
      image_url: formatProductImage(req, image.image_url),
      created_at: image.created_at
    }));

    res.status(201).json({ 
      message: "Images uploaded successfully",
      images: formattedImages 
    });
  } catch (err) {
    console.error("Error uploading product images:", err);
    res.status(500).json({ error: "Failed to upload images" });
  }
};

export const fetchProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const images = await getProductImages(productId);

    const formattedImages = images.map(image => ({
      image_id: image.image_id,
      image_url: formatProductImage(req, image.image_url),
      created_at: image.created_at
    }));

    res.json(formattedImages);
  } catch (err) {
    console.error("Error fetching product images:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

export const deleteImage = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { imageId } = req.params;
    const deleted = await deleteProductImage(imageId);

    if (!deleted) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Error deleting product image:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
};