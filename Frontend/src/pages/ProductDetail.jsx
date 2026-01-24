import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch product data
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchProduct = async () => {
      if (!id) {
        setLoading(false);
        setError("No product ID provided.");
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/products/${id}`);
        const productData = res.data;
        setProduct(productData);
        
        if (productData.variants?.length > 0) {
          setSelectedVariant(productData.variants[0]);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch gallery images
  useEffect(() => {
    const fetchImages = async () => {
      if (!product?.product_id) return;
      
      try {
        setGalleryLoading(true);
        const res = await axios.get(
          `${API_BASE}/api/gallery/${product.product_id}/images`
        );
        
        if (res.data?.length > 0) {
          setGalleryImages(res.data.map(img => img.image_url));
        } else {
          throw new Error("No gallery images found");
        }
      } catch (err) {
        console.warn("Falling back to variant images:", err);
        
        // IMPORTANT: For bundles, include bundle images first
        let images = [];
        
        if (product.is_bundle && product.bundleImages) {
          // Add bundle images from backend formatProduct function
          images.push(...product.bundleImages);
        }
        
        // Then add variant images
        if (product.variants) {
          product.variants.forEach(variant => {
            if (variant.image && !images.includes(variant.image)) {
              images.push(variant.image);
            }
          });
        }
        
        // Finally add primary image if not already included
        if (product.primaryImage && !images.includes(product.primaryImage)) {
          images.push(product.primaryImage);
        }
        
        setGalleryImages(images);
      } finally {
        setGalleryLoading(false);
      }
    };

    if (product) {
      fetchImages();
    }
  }, [product]);

  // Lightbox handlers (memoized to prevent unnecessary re-renders)
  const openLightbox = useCallback((index) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const nextImage = useCallback((e) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const prevImage = useCallback((e) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => 
      (prev - 1 + galleryImages.length) % galleryImages.length
    );
  }, [galleryImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen, closeLightbox, nextImage, prevImage]);

  // Calculate prices
  const { originalPrice, hasDiscount } = useMemo(() => {
    if (!selectedVariant) return { originalPrice: 0, hasDiscount: false };
    
    const price = Number(selectedVariant.price) || 0;
    const discount = Number(selectedVariant.discount) || 0;
    
    return {
      originalPrice: price + discount,
      hasDiscount: discount > 0
    };
  }, [selectedVariant]);

  // Handle variant selection
  const handleVariantSelect = useCallback((variant) => {
    setSelectedVariant(variant);
  }, []);

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (product && selectedVariant) {
      addToCart({ ...product, ...selectedVariant });
    }
  }, [product, selectedVariant, addToCart]);

  // Render main image with bundle splicing logic
  const renderMainImage = () => {
    // If it's a bundle and the backend provided our spliced image array
    if (product.is_bundle && product.bundleImages?.length >= 2) {
      return (
        <div 
          className="flex w-full gap-1 overflow-hidden rounded-lg cursor-pointer transition-transform duration-300 hover:scale-105"
          style={{ height: '100%', minHeight: '450px' }}
          onClick={() => openLightbox(0)}
        >
          <img 
            src={product.bundleImages[0]} 
            className="w-1/2 h-full object-cover border-r border-gray-200 dark:border-gray-800" 
            alt="Bundle Part 1" 
            onError={(e) => {
              e.target.src = "/fallback.jpg";
              e.target.onerror = null;
            }}
          />
          <img 
            src={product.bundleImages[1]} 
            className="w-1/2 h-full object-cover" 
            alt="Bundle Part 2" 
            onError={(e) => {
              e.target.src = "/fallback.jpg";
              e.target.onerror = null;
            }}
          />
        </div>
      );
    }

    // Otherwise, show the standard single image
    const mainImage = selectedVariant?.image || product?.primaryImage || '/fallback.jpg';
    
    return (
      <img
        src={mainImage}
        alt={product?.title}
        className="main-product-image w-full h-auto object-contain rounded-lg cursor-pointer transition-transform duration-300 hover:scale-105"
        onError={(e) => {
          e.target.src = "/fallback.jpg";
          e.target.onerror = null;
        }}
        onClick={() => {
          const index = galleryImages.indexOf(mainImage);
          openLightbox(index >= 0 ? index : 0);
        }}
        loading="eager"
      />
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center px-4">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl text-red-600 dark:text-red-400 font-semibold mb-2">Oops!</p>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product || !selectedVariant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center px-4">
          <p className="text-xl text-gray-600 dark:text-gray-400">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <div className="flex flex-col lg:flex-row items-start gap-6 md:gap-8 lg:gap-12 bg-white dark:bg-black p-4 sm:p-6 md:p-8 rounded-xl shadow-lg max-w-7xl mx-auto">
          
          {/* Left Column: Main Image + Thumbnails */}
          <div className="w-full lg:w-3/5 flex flex-col gap-4">
            {/* Main Image - Now uses renderMainImage function */}
            <div className="image-wrapper w-full">
              {renderMainImage()}
            </div>
            
            {/* Thumbnail Gallery */}
            {!galleryLoading && galleryImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
                {galleryImages.map((imageUrl, index) => (
                  <button 
                    key={index} 
                    onClick={() => openLightbox(index)}
                    className="gallery-thumbnail-btn focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    aria-label={`View image ${index + 1} of ${galleryImages.length}`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.title} - View ${index + 1}`}
                      className={`w-full h-20 sm:h-24 object-cover rounded-md shadow-sm transition-all duration-300 ease-in-out ${
                        // Highlight bundle images (first 2) for bundles, or selected variant image for regular products
                        (product.is_bundle && product.bundleImages?.length >= 2 && index < 2) ||
                        (!product.is_bundle && selectedVariant?.image === imageUrl)
                          ? 'ring-2 ring-blue-500 scale-105' 
                          : 'ring-0 hover:ring-2 hover:ring-gray-300'
                      }`}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/fallback.jpg";
                        e.target.onerror = null;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <div className="w-full lg:w-2/5 text-center lg:text-left space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 dark:text-white leading-tight">
                {product.title}
              </h1>
              
              {product.is_bundle && (
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm font-medium">
                  Bundle Package
                </span>
              )}
            </div>
            
            <p className="text-slate-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
              {product.description}
            </p>

            {/* Bundle Products List */}
            {product.is_bundle && product.bundle_products && product.bundle_products.length > 0 && (
              <div className="bundle-section mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">This Bundle Includes:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.bundle_products.map((item, index) => (
                    <Link 
                      to={`/product/${item.product_id}`} 
                      key={item.product_id} 
                      className="bundle-item-link no-underline"
                    >
                      <div className="bundle-item flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <img 
                          src={item.variants[0]?.image || item.primaryImage || '/fallback.jpg'} 
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-md"
                          onError={(e) => {
                            e.target.src = "/fallback.jpg";
                            e.target.onerror = null;
                          }}
                        />
                        <div className="flex-grow">
                          <p className="font-semibold text-slate-700 dark:text-gray-200">{item.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Quantity: {item.quantity || 1}
                            {index < 2 && (
                              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                (Featured in bundle image)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Variant Selection - Only show for non-bundle products */}
            {!product.is_bundle && product.variants && product.variants.length > 0 && (
              <div className="flex flex-col items-center lg:items-start gap-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Select Color:
                </h3>
                <div className="modern-color-picker" role="radiogroup" aria-label="Product color options">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant.variant_id === variant.variant_id;
                    return (
                      <button
                        key={variant.variant_id}
                        onClick={() => handleVariantSelect(variant)}
                        className={`color-diamond ${isSelected ? "is-selected" : ""}`}
                        style={{ 
                          background: variant.color.toLowerCase()
                        }}
                        title={variant.color}
                        aria-label={`Select ${variant.color} variant`}
                        role="radio"
                        aria-checked={isSelected}
                      >
                        {isSelected && (
                          <span className="selection-indicator" aria-hidden="true">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Display */}
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              {hasDiscount ? (
                <div className="flex flex-col sm:flex-row items-center lg:items-start gap-2 sm:gap-4">
                  <span className="text-gray-500 dark:text-gray-400 line-through text-lg">
                    Kshs {originalPrice.toFixed(2)}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    Kshs {Number(selectedVariant.price).toFixed(2)}
                  </span>
                  <span className="text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                    Save Kshs {Number(selectedVariant.discount).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span>Kshs {Number(selectedVariant.price).toFixed(2)}</span>
              )}
            </div>
            
            {/* Add to Cart Button */}
            <Button
              className="cart-button mt-4 text-base sm:text-lg px-6 sm:px-10 py-4 sm:py-6 w-full lg:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white transition-colors duration-200"
              onClick={handleAddToCart}
              aria-label="Add product to cart"
            >
              Add to Cart
            </Button>

            {/* Stock Status */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                In Stock
              </span>
            </div>

            {/* Variant Images Section - Only show for non-bundle products */}
            {!product.is_bundle && product.variants && product.variants.length > 1 && (
              <div className="variant-images-section mt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Available Colors:
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant.variant_id === variant.variant_id;
                    return (
                      <button
                        key={variant.variant_id}
                        onClick={() => handleVariantSelect(variant)}
                        className={`variant-image-btn group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                          isSelected 
                            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                        aria-label={`Select ${variant.color} variant`}
                      >
                        <img
                          src={variant.image}
                          alt={`${product.title} - ${variant.color}`}
                          className="w-full h-20 sm:h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = "/fallback.jpg";
                            e.target.onerror = null;
                          }}
                        />
                        {/* Color label overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 truncate">
                          {variant.color}
                        </div>
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="lightbox-backdrop" 
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery lightbox"
        >
          <button 
            className="lightbox-close-btn" 
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {galleryImages.length > 1 && (
            <>
              <button 
                className="lightbox-nav-btn prev" 
                onClick={prevImage}
                aria-label="Previous image"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                className="lightbox-nav-btn next" 
                onClick={nextImage}
                aria-label="Next image"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>                                
            </>
          )}
          
          <img
            src={galleryImages[activeImageIndex]}
            alt={`${product.title} - Image ${activeImageIndex + 1} of ${galleryImages.length}`}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              e.target.src = "/fallback.jpg";
              e.target.onerror = null;
            }}
          />
          
          <div className="lightbox-counter">
            {activeImageIndex + 1} / {galleryImages.length}
            {product.is_bundle && activeImageIndex < 2 && (
              <span className="ml-2 text-xs text-gray-300">
                (Bundle Product {activeImageIndex + 1})
              </span>
            )}
          </div>
        </div>
      )}

     <style jsx>{`
/* ========================================
   MAIN PRODUCT IMAGE
======================================== */

.main-product-image {
  width: 100%;
  object-fit: contain;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: transform 0.35s ease;
  max-height: 600px;
  min-height: 450px;
}

.main-product-image:hover {
  transform: scale(1.04);
}

@media (min-width: 768px) {
  .main-product-image {
    max-height: 750px;
    min-height: 550px;
  }
}

@media (min-width: 1024px) {
  .main-product-image {
    max-height: 900px;
    min-height: 650px;
  }
}

@media (max-width: 640px) {
  .main-product-image {
    max-height: 420px;
    min-height: 300px;
  }
}

/* ========================================
   IMAGE WRAPPER + GLOW
======================================== */

.image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
}

.image-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(248,248,248,.55) 0%, rgba(147,197,253,0) 70%);
  filter: blur(30px);
  opacity: .6;
  transition: all .3s ease;
  z-index: 0;
}

.dark .image-wrapper::before {
  background: radial-gradient(circle, rgba(59,130,246,.35) 0%, rgba(147,197,253,0) 70%);
}

.image-wrapper:hover::before {
  opacity: .95;
  filter: blur(40px);
}

.image-wrapper img {
  position: relative;
  z-index: 1;
}

/* ========================================
   GALLERY THUMBNAILS
======================================== */

.gallery-thumbnail-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: .5rem;
  overflow: hidden;
}

.gallery-thumbnail-btn img {
  transition: transform .3s ease;
}

.gallery-thumbnail-btn:hover img {
  transform: scale(1.12);
}

/* ========================================
   MODERN COLOR PICKER
======================================== */

.modern-color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  justify-content: center;
}

@media (min-width: 1024px) {
  .modern-color-picker {
    justify-content: flex-start;
  }
}

.color-diamond {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  cursor: pointer;
  transform: rotate(45deg);
  transition: all .2s ease;
  box-shadow: 0 3px 8px rgba(0,0,0,.2);

  /* 👇 Visible border for dark colors */
  border: 2px solid rgba(0,0,0,.25);
}

.dark .color-diamond {
  border: 2px solid rgba(255,255,255,.45);
}

.color-diamond:hover {
  transform: rotate(45deg) scale(1.15);
}

.color-diamond.is-selected {
  transform: rotate(45deg) scale(1.22);
  box-shadow:
    0 0 0 3px white,
    0 0 0 6px #3b82f6,
    0 10px 22px rgba(59,130,246,.45);
}

.dark .color-diamond.is-selected {
  box-shadow:
    0 0 0 3px #020617,
    0 0 0 6px #3b82f6,
    0 12px 26px rgba(59,130,246,.6);
}

.selection-indicator {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transform: rotate(-45deg);
  color: white;
  font-weight: 700;
  text-shadow: 0 2px 6px rgba(0,0,0,.7);
}

/* ========================================
   VARIANT IMAGE GRID
======================================== */

.variant-images-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.dark .variant-images-section {
  border-top-color: #374151;
}

.variant-image-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

/* ========================================
   LIGHTBOX
======================================== */

.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.92);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fade .2s ease;
}

@keyframes fade {
  from { opacity: 0 }
  to { opacity: 1 }
}

.lightbox-image {
  max-width: 92vw;
  max-height: 92vh;
  border-radius: .75rem;
  animation: zoom .2s ease;
}

@keyframes zoom {
  from { transform: scale(.92); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
}

.lightbox-close-btn,
.lightbox-nav-btn {
  position: absolute;
  background: rgba(0,0,0,.55);
  color: white;
  border-radius: 50%;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: .25s ease;
}

.lightbox-close-btn:hover,
.lightbox-nav-btn:hover {
  background: rgba(0,0,0,.85);
  transform: scale(1.1);
}

.lightbox-close-btn {
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
}

.lightbox-nav-btn {
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
}

.lightbox-nav-btn.prev { left: 20px }
.lightbox-nav-btn.next { right: 20px }

.lightbox-counter {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,.65);
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 14px;
  color: white;
}

/* ========================================
   CART BUTTON DARK FIX
======================================== */

.dark .cart-button {
  background: #575656 !important;
  color: #fff !important;
}

.dark .cart-button:hover {
  background: #484848 !important;
}

/* ========================================
   MOBILE OPTIMIZATION
======================================== */

@media (max-width: 768px) {
  .color-diamond { width: 42px; height: 42px }
  .lightbox-nav-btn { width: 48px; height: 48px }
}

@media (max-width: 480px) {
  .color-diamond { width: 38px; height: 38px }
}

@media (max-width: 360px) {
  .color-diamond { width: 34px; height: 34px }
}
`}</style>

    </>
  );
};

export default ProductDetail;