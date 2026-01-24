import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE from "../config";

const ImageGallery = ({ product }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch images when component mounts or product changes
  useEffect(() => {
    const fetchImages = async () => {
      if (!product?.product_id) return;
      
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE}/api/gallery/${product.product_id}/images`
        );
        setImages(res.data);
      } catch (err) {
        console.error("Error fetching product images:", err);
        // If no gallery images exist, use variant images as fallback
        if (product.variants) {
          const variantImages = product.variants
            .map(variant => variant.image)
            .filter(Boolean)
            .map((image, index) => ({
              image_id: `variant-${index}`,
              image_url: image,
              created_at: new Date().toISOString()
            }));
          setImages(variantImages);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [product]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 border-b pb-2">
          Product Gallery
        </h3>
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">
            Loading images...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 border-b pb-2">
          Product Gallery
        </h3>
        <div className="text-center py-8 text-red-500">
          Failed to load images
        </div>
      </div>
    );
  }

  const allImages = images.length > 0 ? images : 
    (product.variants ? product.variants
      .map(variant => variant.image)
      .filter(Boolean)
      .map((image, index) => ({
        image_id: `variant-${index}`,
        image_url: image,
        created_at: new Date().toISOString()
      })) : []);

  if (allImages.length === 0) {
    return null; // Don't show gallery section if no images available
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 border-b pb-2">
        Product Gallery
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allImages.map((image) => (
          <div key={image.image_id} className="relative group">
            <img
              src={image.image_url}
              alt={`${product.title} - Gallery image`}
              className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;