import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import API_BASE from "../config";

const AdminImageGallery = ({ product }) => {
  const { user, token } = useUser();
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

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
        // If no images exist, use variant images as fallback
        if (product.variants) {
          const variantImages = product.variants
            .map(variant => variant.image)
            .filter(Boolean)
            .map((image, index) => ({
              image_id: `variant-${index}`,
              image_url: image,
              created_at: new Date().toISOString(),
              isVariantImage: true
            }));
          setImages(variantImages);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [product]);

  const handleImageChange = (e) => {
    setNewImages(Array.from(e.target.files));
  };

  const handleImageUpload = async () => {
    if (newImages.length === 0 || !user || user.role !== "admin") {
      return;
    }

    const formData = new FormData();
    newImages.forEach((image) => {
      formData.append("images", image);
    });

    try {
      setBusy(true);
      const res = await axios.post(
        `${API_BASE}/api/gallery/${product.product_id}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      setImages(res.data.images);
      setNewImages([]);
      alert("Images uploaded successfully!");
    } catch (err) {
      console.error("Error uploading images:", err);
      alert(err.response?.data?.error || "Failed to upload images");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!user || user.role !== "admin") return;
    
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      await axios.delete(
        `${API_BASE}/api/gallery/images/${imageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Remove the image from local state
      setImages(images.filter(img => img.image_id !== imageId));
      alert("Image deleted successfully!");
    } catch (err) {
      console.error("Error deleting image:", err);
      alert("Failed to delete image");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Image Gallery</h3>
        <p className="text-gray-500 dark:text-gray-400">Loading images...</p>
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
        created_at: new Date().toISOString(),
        isVariantImage: true
      })) : []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Image Gallery</h3>
      
      {allImages.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No images available for this product.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allImages.map((image) => (
            <div key={image.image_id} className="relative group">
              <img
                src={image.image_url}
                alt={`${product.title} - Gallery image`}
                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              />
              
              {/* Delete button for admin users (only for non-variant images) */}
              {user?.role === "admin" && !image.isVariantImage && (
                <button
                  onClick={() => handleDeleteImage(image.image_id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Variant image indicator */}
              {image.isVariantImage && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Variant
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin-only upload section */}
      {user?.role === "admin" && (
        <div className="mt-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Manage Gallery Images
          </h4>
          <div className="space-y-4">
            <Input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleImageChange}
              className="bg-white dark:bg-gray-800"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleImageUpload} 
                disabled={busy || newImages.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {busy ? "Uploading..." : `Upload ${newImages.length} Image(s)`}
              </Button>
              {newImages.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setNewImages([])}
                  className="text-gray-600 dark:text-gray-400"
                >
                  Clear Selection
                </Button>
              )}
            </div>
            {newImages.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {newImages.length} image(s) selected for upload
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImageGallery;