import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      if (!id) { setLoading(false); setError("No product ID provided."); return; }
      try {
        const res = await axios.get(`${API_BASE}/api/products/${id}`);
        const productData = res.data;
        console.log('ProductDetail - Product fetched:', { id: productData.product_id, title: productData.title, variants: productData.variants?.length, isBundle: productData.is_bundle });
        setProduct(productData);
        if (productData.variants?.length > 0) {
          setSelectedVariant(productData.variants[0]);
          if (productData.variants[0].color) setSelectedColor(productData.variants[0].color);
          if (productData.variants[0].storage) setSelectedStorage(productData.variants[0].storage);
          if (productData.variants[0].ram) setSelectedRam(productData.variants[0].ram);
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

  useEffect(() => {
    const fetchImages = async () => {
      if (!product?.product_id) return;
      try {
        setGalleryLoading(true);
        const res = await axios.get(`${API_BASE}/api/gallery/${product.product_id}/images`);
        if (res.data?.length > 0) {
          setGalleryImages(res.data.map(img => img.image_url));
        } else { throw new Error("No gallery images found"); }
      } catch (err) {
        console.warn("Falling back to variant images:", err);
        let images = [];
        if (!!product.is_bundle && product.bundleImages) images.push(...product.bundleImages);
        if (product.variants) {
          product.variants.forEach(variant => {
            if (variant.image && !images.includes(variant.image)) images.push(variant.image);
          });
        }
        if (product.primaryImage && !images.includes(product.primaryImage)) images.push(product.primaryImage);
        setGalleryImages(images);
      } finally {
        setGalleryLoading(false);
      }
    };
    if (product) fetchImages();
  }, [product]);

  const openLightbox = useCallback((index) => { setActiveImageIndex(index); setIsLightboxOpen(true); }, []);
  const closeLightbox = useCallback(() => { setIsLightboxOpen(false); }, []);
  const nextImage = useCallback((e) => { e?.stopPropagation(); setActiveImageIndex((prev) => (prev + 1) % galleryImages.length); }, [galleryImages.length]);
  const prevImage = useCallback((e) => { e?.stopPropagation(); setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); }, [galleryImages.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape': closeLightbox(); break;
        case 'ArrowLeft': prevImage(); break;
        case 'ArrowRight': nextImage(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = 'unset'; };
  }, [isLightboxOpen, closeLightbox, nextImage, prevImage]);

  const { originalPrice, hasDiscount } = useMemo(() => {
    if (!selectedVariant) return { originalPrice: 0, hasDiscount: false };
    const price = Number(selectedVariant.price) || 0;
    const discount = Number(selectedVariant.discount) || 0;
    return { originalPrice: price + discount, hasDiscount: discount > 0 };
  }, [selectedVariant]);

  const uniqueColors = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map(v => v.color).filter(c => c))];
  }, [product?.variants]);

  const uniqueStorages = useMemo(() => {
    if (!product?.variants) return [];
    const filteredByColor = selectedColor ? product.variants.filter(v => v.color === selectedColor) : product.variants;
    const storages = [...new Set(filteredByColor.map(v => v.storage).filter(s => s))];
    return storages.sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  }, [product?.variants, selectedColor]);

  const uniqueRams = useMemo(() => {
    if (!product?.variants) return [];
    const filteredByColor = selectedColor ? product.variants.filter(v => v.color === selectedColor) : product.variants;
    const filteredByStorage = selectedStorage ? filteredByColor.filter(v => v.storage === selectedStorage) : filteredByColor;
    const rams = [...new Set(filteredByStorage.map(v => v.ram).filter(r => r))];
    return rams.sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  }, [product?.variants, selectedColor, selectedStorage]);

  const hasMultipleColors = uniqueColors.length > 1;

  const filteredVariants = useMemo(() => {
    if (!product?.variants) return [];
    return product.variants.filter(variant => {
      if (selectedColor && variant.color !== selectedColor) return false;
      if (selectedStorage && variant.storage !== selectedStorage) return false;
      if (selectedRam && variant.ram !== selectedRam) return false;
      return true;
    });
  }, [product?.variants, selectedColor, selectedStorage, selectedRam]);

  useEffect(() => {
    if (filteredVariants.length > 0 && (!selectedVariant || !filteredVariants.find(v => v.variant_id === selectedVariant.variant_id))) {
      setSelectedVariant(filteredVariants[0]);
    }
  }, [filteredVariants, selectedVariant]);

  const handleAddToCart = useCallback(() => {
    if (product && selectedVariant) {
      addToCart({ ...product, ...selectedVariant });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  }, [product, selectedVariant, addToCart]);

  const renderMainImage = () => {
    if (!!product.is_bundle && product.bundleImages?.length >= 2) {
      return (
        <div
          className="bundle-main-img"
          onClick={() => openLightbox(0)}
        >
          <img src={product.bundleImages[0]} className="bundle-half" alt="Bundle Part 1"
            onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }} />
          <div className="bundle-divider" />
          <img src={product.bundleImages[1]} className="bundle-half" alt="Bundle Part 2"
            onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }} />
        </div>
      );
    }
    const mainImage = selectedVariant?.image || product?.primaryImage || '/fallback.jpg';
    return (
      <img
        src={mainImage}
        alt={product?.title}
        className="main-product-image"
        onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }}
        onClick={() => { const index = galleryImages.indexOf(mainImage); openLightbox(index >= 0 ? index : 0); }}
        loading="eager"
      />
    );
  };

  if (loading) {
    return (
      <div className="samsung-page">
        <div className="samsung-container">
          <div className="samsung-grid">
            <div className="samsung-left">
              <Skeleton className="skeleton-main" />
              <div className="skeleton-thumbs">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="skeleton-thumb" />)}
              </div>
            </div>
            <div className="samsung-right">
              <Skeleton className="skeleton-title" />
              <Skeleton className="skeleton-price" />
              <Skeleton className="skeleton-line" />
              <Skeleton className="skeleton-line short" />
              <Skeleton className="skeleton-btn" />
            </div>
          </div>
        </div>
        <style jsx>{skeletonStyles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="samsung-error">
        <div className="error-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="error-title">Something went wrong</p>
        <p className="error-msg">{error}</p>
        <style jsx>{errorStyles}</style>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="samsung-error">
        <p className="error-title">Product not found</p>
        <style jsx>{errorStyles}</style>
      </div>
    );
  }

  return (
    <>
      <div className="samsung-page">
        <div className="samsung-container">

          {/* Breadcrumb */}
          <nav className="samsung-breadcrumb">
            <span>Home</span>
            <span className="bc-sep">›</span>
            <span>Products</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">{product.title}</span>
          </nav>

          {/* 3-col outer: [gallery+details | specs] on huge screens */}
          <div className="samsung-outer">

            {/* Left panel: gallery + details */}
            <div className="samsung-grid">

            {/* ═══════════ LEFT – Gallery ═══════════ */}
            <div className="samsung-left">
              <div className="main-image-wrapper">
                {renderMainImage()}
                {!!product.is_bundle && (
                  <span className="bundle-badge">Bundle</span>
                )}
              </div>

              {!galleryLoading && galleryImages.length > 1 && (
                <div className="thumb-strip">
                  {galleryImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(i)}
                      className={`thumb-btn ${
                        (!product.is_bundle && selectedVariant?.image === url) ||
                        (!!product.is_bundle && product.bundleImages?.length >= 2 && i < 2)
                          ? 'thumb-active' : ''
                      }`}
                      aria-label={`View image ${i + 1}`}
                    >
                      <img
                        src={url}
                        alt={`${product.title} view ${i + 1}`}
                        loading="lazy"
                        onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ═══════════ RIGHT – Details ═══════════ */}
            <div className="samsung-right">

              {/* Title + Badge */}
              <div className="title-row">
                <h1 className="product-title">{product.title}</h1>
                {!!product.is_bundle && (
                  <span className="bundle-tag">Bundle Package</span>
                )}
              </div>

              {/* Divider */}
              <div className="section-rule" />

              {/* Price */}
              <div className="price-block">
                {hasDiscount ? (
                  <>
                    <span className="price-original">Kshs {originalPrice.toFixed(2)}</span>
                    <span className="price-current">Kshs {Number(selectedVariant.price).toFixed(2)}</span>
                    <span className="price-save">−Kshs {Number(selectedVariant.discount).toFixed(2)}</span>
                  </>
                ) : (
                  <span className="price-current">Kshs {Number(selectedVariant.price).toFixed(2)}</span>
                )}
              </div>

              {/* Stock */}
              <div className="stock-row">
                <span className="stock-dot" />
                <span className="stock-label">In Stock</span>
              </div>

              {/* ── Variants ── */}
              {!product.is_bundle && product.variants?.length > 0 && (
                <div className="variants-section">

                  {/* Color */}
                  {uniqueColors.length > 0 && (
                    <div className="variant-group">
                      <p className="variant-label">
                        Color <span className="variant-value">{selectedColor}</span>
                      </p>
                      <div className="color-row">
                        {uniqueColors.map((color) => {
                          const isSelected = selectedColor === color;
                          return (
                            <button
                              key={color}
                              onClick={() => {
                                setSelectedColor(color);
                                setSelectedStorage(null);
                                setSelectedRam(null);
                                const first = product.variants.find(v => v.color === color);
                                if (first) {
                                  setSelectedVariant(first);
                                  if (first.storage) setSelectedStorage(first.storage);
                                  if (first.ram) setSelectedRam(first.ram);
                                }
                              }}
                              className={`color-swatch ${isSelected ? 'color-swatch-active' : ''}`}
                              style={{ background: color?.toLowerCase() || '#ccc' }}
                              title={color}
                              aria-label={`Select ${color}`}
                            >
                              {isSelected && (
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Storage */}
                  {uniqueStorages.length > 0 && (
                    <div className="variant-group">
                      <p className="variant-label">Storage</p>
                      <div className="chip-row">
                        {uniqueStorages.map((storage) => {
                          const isSelected = selectedStorage === storage;
                          const variantWithStorage = product.variants.find(v =>
                            (!selectedColor || v.color === selectedColor) && v.storage === storage
                          );
                          return (
                            <button
                              key={storage}
                              onClick={() => {
                                setSelectedStorage(storage);
                                setSelectedRam(null);
                                if (variantWithStorage) {
                                  setSelectedVariant(variantWithStorage);
                                  if (variantWithStorage.ram) setSelectedRam(variantWithStorage.ram);
                                }
                              }}
                              className={`chip ${isSelected ? 'chip-active' : ''}`}
                            >
                              {storage}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* RAM */}
                  {uniqueRams.length > 0 && (
                    <div className="variant-group">
                      <p className="variant-label">RAM</p>
                      <div className="chip-row">
                        {uniqueRams.map((ram) => {
                          const isSelected = selectedRam === ram;
                          const variantWithRam = product.variants.find(v =>
                            (!selectedColor || v.color === selectedColor) &&
                            (!selectedStorage || v.storage === selectedStorage) &&
                            v.ram === ram
                          );
                          return (
                            <button
                              key={ram}
                              onClick={() => {
                                setSelectedRam(ram);
                                if (variantWithRam) setSelectedVariant(variantWithRam);
                              }}
                              className={`chip ${isSelected ? 'chip-active' : ''}`}
                            >
                              {ram}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="section-rule" />

              {/* Add to Cart */}
              <button
                className={`atc-btn ${addedToCart ? 'atc-btn-success' : ''}`}
                onClick={handleAddToCart}
                aria-label="Add product to cart"
              >
                {addedToCart ? (
                  <>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="atc-icon">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Added to Cart
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="atc-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>

              {/* Color Variant Images */}
              {!product.is_bundle && product.variants?.length > 1 && uniqueColors.length > 1 && (
                <div className="color-variants-grid-section">
                  <p className="variant-label">Available Colors</p>
                  <div className="color-variants-grid">
                    {uniqueColors.map((color) => {
                      const variant = product.variants.find(v => v.color === color);
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            setSelectedColor(color);
                            setSelectedStorage(null);
                            setSelectedRam(null);
                            if (variant) {
                              setSelectedVariant(variant);
                              if (variant.storage) setSelectedStorage(variant.storage);
                              if (variant.ram) setSelectedRam(variant.ram);
                            }
                          }}
                          className={`color-variant-card ${isSelected ? 'color-variant-active' : ''}`}
                          aria-label={`Select ${color} variant`}
                        >
                          <img
                            src={variant?.image}
                            alt={`${product.title} - ${color}`}
                            loading="lazy"
                            onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }}
                          />
                          <span>{color}</span>
                          {isSelected && (
                            <div className="color-variant-check">
                              <svg viewBox="0 0 20 20" fill="currentColor">
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
            </div>{/* end samsung-grid */}

            {/* ═══════════ RIGHT PANEL – Specs (3rd col on huge screens) ═══════════ */}
            <div className={`specs-panel${!product.description ? ' specs-panel-hidden' : ''}`}>
              {product.description && (
                <>
                  <div className="specs-header">
                    <h2>Specifications</h2>
                    <div className="specs-rule" />
                  </div>
                  <div className="specs-body">
                    {product.description.split(/\r?\n/).map((line, index) => {
                      const trimmed = line.trim();
                      if (index === 0 && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                        return <p key={index} className="specs-model">{trimmed}</p>;
                      }
                      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                        return <p key={index} className="specs-item">{trimmed}</p>;
                      }
                      if (trimmed === '') return <br key={index} />;
                      return <p key={index} className="specs-item">• {trimmed}</p>;
                    })}
                  </div>
                </>
              )}
            </div>

          </div>{/* end samsung-outer */}

          {/* ═══════════ BUNDLE SECTION ═══════════ */}
          {!!product.is_bundle && product.bundle_products?.length > 0 && (
            <div className="bundle-section">
              <div className="specs-header">
                <h2>What's in the Box</h2>
                <div className="specs-rule" />
              </div>
              <div className="bundle-grid">
                {product.bundle_products.map((item, index) => (
                  <Link to={`/product/${item.product_id}`} key={item.product_id} className="bundle-card">
                    <div className="bundle-card-img">
                      <img
                        src={item.variants[0]?.image || item.primaryImage || '/fallback.jpg'}
                        alt={item.title}
                        onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }}
                      />
                    </div>
                    <div className="bundle-card-info">
                      <p className="bundle-card-title">{item.title}</p>
                      <p className="bundle-card-qty">Qty: {item.quantity || 1}</p>
                      {index < 2 && <span className="bundle-featured">Featured</span>}
                    </div>
                    <div className="bundle-card-arrow">›</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════ LIGHTBOX ═══════════ */}
      {isLightboxOpen && (
        <div className="lightbox" onClick={closeLightbox} role="dialog" aria-modal="true">
          <button className="lb-close" onClick={closeLightbox} aria-label="Close">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {galleryImages.length > 1 && (
            <>
              <button className="lb-nav lb-prev" onClick={prevImage} aria-label="Previous">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="lb-nav lb-next" onClick={nextImage} aria-label="Next">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <img
            src={galleryImages[activeImageIndex]}
            alt={`${product.title} – ${activeImageIndex + 1} of ${galleryImages.length}`}
            className="lb-image"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }}
          />

          <div className="lb-counter">
            {activeImageIndex + 1} / {galleryImages.length}
            {!!product.is_bundle && activeImageIndex < 2 && (
              <span className="lb-bundle-label"> · Bundle item {activeImageIndex + 1}</span>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        /* ══════════════════════════════════════════════
           SAMSUNG-STYLE PRODUCT DETAIL  
           Font: DM Sans (body) + DM Serif Display (hero)
        ══════════════════════════════════════════════ */

        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Serif+Display&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .samsung-page {
          min-height: 100vh;
          background: linear-gradient(135deg, rgba(248,248,248,0.9) 0%, rgba(240,240,245,0.9) 100%);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
        }

        .dark .samsung-page {
          background: linear-gradient(135deg, rgba(13,13,13,0.95) 0%, rgba(20,20,25,0.95) 100%);
          color: #f0f0f0;
        }

        .samsung-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* ── Breadcrumb ── */
        .samsung-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px 0 32px;
          font-size: 13px;
          color: #888;
          letter-spacing: 0.01em;
        }
        .bc-sep { color: #ccc; }
        .bc-current { color: #1a1a1a; font-weight: 500; }
        .dark .bc-current { color: #f0f0f0; }

        /* ── Outer 3-col layout ── */
        /* ── Outer layout: [gallery+details] | [specs] ── */
        .samsung-outer {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 40px;
          align-items: start;
        }

        /* Inner 2-col: gallery | details */
        .samsung-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
          min-width: 0;
        }

        /* ≤1280px: specs drops below as a card, gallery+details still side-by-side */
        @media (max-width: 1280px) {
          .samsung-outer {
            grid-template-columns: 1fr;
          }
        }

        /* ≤1024px: gallery+details also go single column */
        @media (max-width: 1024px) {
          .samsung-grid { grid-template-columns: 1fr; gap: 36px; }
        }

        /* ══════════════════════════════════════════════
           LEFT COLUMN – GALLERY
        ══════════════════════════════════════════════ */

        .samsung-left {
          position: sticky;
          top: 24px;
        }

        @media (max-width: 1024px) {
          .samsung-left { position: static; }
        }

        /* Specs panel — sticky on the right at ≥1280px */
        .specs-panel {
          position: sticky;
          top: 24px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.05);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #e0e0e0 transparent;
          border: none;
          transition: all 0.3s ease;
        }

        .specs-panel:hover {
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 8px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5);
        }

        .specs-panel::-webkit-scrollbar { width: 4px; }
        .specs-panel::-webkit-scrollbar-track { background: transparent; }
        .specs-panel::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

        .specs-panel-hidden {
          display: none;
        }

        .dark .specs-panel {
          background: rgba(26, 26, 26, 0.8);
          border-color: transparent;
          box-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }

        .dark .specs-panel:hover {
          background: rgba(26, 26, 26, 0.95);
          box-shadow: 0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
        }

        /* When specs panel drops below (≤1280px), it becomes a full-width card */
        @media (max-width: 1280px) {
          .specs-panel {
            position: static;
            max-height: none;
            border-radius: 16px;
            margin-top: 48px;
          }
        }

        @media (max-width: 768px) {
          .specs-panel {
            border-radius: 12px;
            padding: 24px;
            margin-top: 36px;
            border: none;
          }
        }

        .main-image-wrapper {
          position: relative;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 40px rgba(0,0,0,0.06);
          transition: all 0.3s ease;
          border: none;
        }

        .dark .main-image-wrapper {
          background: rgba(26, 26, 26, 0.7);
          box-shadow: 0 2px 40px rgba(0,0,0,0.4);
        }

        .main-image-wrapper:hover {
          box-shadow: 0 8px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.3);
          background: rgba(255, 255, 255, 0.9);
        }

        .dark .main-image-wrapper:hover {
          background: rgba(40, 40, 40, 0.9);
        }

        .main-product-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          cursor: zoom-in;
          padding: 24px;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .main-product-image:hover { transform: scale(1.04); }

        .bundle-main-img {
          width: 100%;
          height: 100%;
          display: flex;
          cursor: zoom-in;
        }

        .bundle-half {
          width: 50%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s;
        }

        .bundle-half:hover { opacity: 0.9; }
        .bundle-divider { width: 2px; background: #f8f8f8; flex-shrink: 0; }
        .dark .bundle-divider { background: #0d0d0d; }

        .bundle-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: #111111;
          color: white;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 20px;
          z-index: 2;
        }

        /* Thumbnails */
        .thumb-strip {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .thumb-strip::-webkit-scrollbar { display: none; }

        .thumb-btn {
          flex-shrink: 0;
          width: 72px;
          height: 72px;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid transparent;
          background: #fff;
          cursor: pointer;
          padding: 0;
          transition: border-color 0.2s, transform 0.2s;
        }

        .dark .thumb-btn { background: #1a1a1a; }

        .thumb-btn img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
          transition: transform 0.25s;
        }

        .thumb-btn:hover { transform: translateY(-2px); border-color: #111111; }
        .thumb-btn:hover img { transform: scale(1.08); }
        .thumb-active { border-color: #111111 !important; }
        .dark .thumb-active { border-color: #444444 !important; }

        /* ══════════════════════════════════════════════
           RIGHT COLUMN – DETAILS
        ══════════════════════════════════════════════ */

        .samsung-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-top: 8px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 24px;
          border: none;
          transition: all 0.3s ease;
        }

        .samsung-right:hover {
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 8px 40px rgba(0,0,0,0.08);
        }

        .dark .samsung-right {
          background: rgba(26, 26, 26, 0.5);
        }

        .dark .samsung-right:hover {
          background: rgba(40, 40, 40, 0.7);
        }

        .title-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }

        .product-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 400;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: #0d0d0d;
          flex: 1;
        }

        .dark .product-title { color: #f5f5f5; }

        .bundle-tag {
          background: #f0f0f0;
          color: #111111;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 20px;
          flex-shrink: 0;
          margin-top: 6px;
          border: none;
        }

        .dark .bundle-tag {
          background: #222222;
          color: #aaaaaa;
        }

        /* Dividers */
        .section-rule {
          height: 1px;
          background: rgba(0,0,0,0.06);
          margin: 20px 0;
        }
        .dark .section-rule { background: rgba(255,255,255,0.06); }

        /* Price */
        .price-block {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
        }

        .price-current {
          font-size: clamp(24px, 3.5vw, 36px);
          font-weight: 700;
          color: #0d0d0d;
          letter-spacing: -0.02em;
        }

        .dark .price-current { color: #ffffff; }

        .price-original {
          font-size: 18px;
          font-weight: 400;
          color: #aaa;
          text-decoration: line-through;
        }

        .price-save {
          font-size: 13px;
          font-weight: 600;
          color: #c8232c;
          background: #fff0f0;
          border: none;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .dark .price-save {
          background: #2a1010;
          color: #ff6b6b;
        }

        /* Stock */
        .stock-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stock-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #0bc268;
          box-shadow: 0 0 0 3px rgba(11, 194, 104, 0.2);
          animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 3px rgba(11,194,104,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(11,194,104,0.1); }
        }

        .stock-label {
          font-size: 13px;
          font-weight: 500;
          color: #0bc268;
          letter-spacing: 0.02em;
        }

        /* ── Variants ── */
        .variants-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .variant-group { display: flex; flex-direction: column; gap: 10px; }

        .variant-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #888;
        }

        .variant-value {
          color: #1a1a1a;
          font-weight: 700;
          text-transform: none;
          letter-spacing: 0;
        }

        .dark .variant-value { color: #f0f0f0; }

        /* Color swatches */
        .color-row { display: flex; gap: 10px; flex-wrap: wrap; }

        .color-swatch {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .color-swatch svg {
          width: 16px; height: 16px;
          color: white;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }

        .color-swatch:hover { transform: scale(1.15); }

        .color-swatch-active {
          border-color: #111111;
          box-shadow: 0 0 0 2px white, 0 0 0 4px #111111;
          transform: scale(1.12);
        }

        .dark .color-swatch-active {
          box-shadow: 0 0 0 2px #0d0d0d, 0 0 0 4px #444444;
        }

        /* Chips */
        .chip-row { display: flex; gap: 8px; flex-wrap: wrap; }

        .chip {
          padding: 8px 18px;
          border-radius: 6px;
          border: 1.5px solid #ddd;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
        }

        .dark .chip { background: #1a1a1a; border-color: #333; color: #ccc; }

        .chip:hover {
          border-color: #111111;
          color: #111111;
        }

        .dark .chip:hover { border-color: #444444; color: #444444; }

        .chip-active {
          background: #111111;
          border-color: #111111;
          color: #fff;
          font-weight: 600;
        }

        .dark .chip-active { background: #444444; border-color: #444444; }

        /* ── Add to Cart ── */
        .atc-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px 32px;
          background: #111111;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
        }

        .atc-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .atc-btn:hover { background: #000000; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        .atc-btn:hover::before { opacity: 1; }
        .atc-btn:active { transform: translateY(0); }

        .atc-btn-success { background: #0bc268; }
        .atc-btn-success:hover { background: #09a558; box-shadow: 0 8px 24px rgba(11,194,104,0.35); }

        .dark .atc-btn { background: #444444; }
        .dark .atc-btn:hover { background: #333333; box-shadow: 0 8px 24px rgba(80,80,80,0.35); }

        .atc-icon { width: 20px; height: 20px; flex-shrink: 0; }

        /* Color variant grid */
        .color-variants-grid-section { display: flex; flex-direction: column; gap: 10px; }

        .color-variants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 10px;
        }

        .color-variant-card {
          position: relative;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: none;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 0 8px;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }

        .color-variant-card:hover {
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .dark .color-variant-card { background: rgba(26, 26, 26, 0.7); }
        .dark .color-variant-card:hover { background: rgba(40, 40, 40, 0.9); }

        .color-variant-card img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .color-variant-card span {
          font-size: 11px;
          font-weight: 500;
          color: #555;
          margin-top: 6px;
          padding: 0 6px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        .dark .color-variant-card span { color: #aaa; }

        .color-variant-card:hover { transform: translateY(-2px); }
        .color-variant-card:hover img { transform: scale(1.08); }

        .color-variant-active {
          border-color: #111111 !important;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.12);
        }

        .dark .color-variant-active { border-color: #444444 !important; }

        .color-variant-check {
          position: absolute;
          top: 6px; right: 6px;
          width: 20px; height: 20px;
          background: #111111;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }

        .color-variant-check svg { width: 12px; height: 12px; color: white; }

        /* ══════════════════════════════════════════════
           SPECS PANEL + BUNDLE SECTION
        ══════════════════════════════════════════════ */

        .bundle-section {
          margin-top: 48px;
          border-top: 1px solid rgba(0,0,0,0.06);
          padding-top: 40px;
        }

        .dark .bundle-section { border-top-color: rgba(255,255,255,0.06); }

        .specs-header {
          margin-bottom: 24px;
        }

        .specs-header h2 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(18px, 2vw, 26px);
          font-weight: 400;
          letter-spacing: -0.02em;
          color: #0d0d0d;
          margin-bottom: 12px;
        }

        .dark .specs-header h2 { color: #f0f0f0; }

        .specs-rule {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, #111111 0%, #555555 100%);
          border-radius: 2px;
        }

        .specs-body {
          line-height: 1.8;
        }

        .specs-model {
          font-size: 18px;
          font-weight: 600;
          color: #0d0d0d;
          margin-bottom: 12px;
        }

        .dark .specs-model { color: #f0f0f0; }

        .specs-item {
          font-size: 15px;
          color: #555;
          padding: 4px 0 4px 8px;
          border-left: 2px solid transparent;
          transition: border-color 0.2s, padding-left 0.2s;
        }

        .dark .specs-item { color: #aaa; }

        .specs-item:hover {
          border-left-color: #111111;
          padding-left: 14px;
          color: #1a1a1a;
        }

        .dark .specs-item:hover { border-left-color: #444444; color: #f0f0f0; }

        /* ══════════════════════════════════════════════
           BUNDLE GRID
        ══════════════════════════════════════════════ */

        .bundle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }

        .bundle-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #fff;
          border: 1.5px solid #e8e8e8;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s;
          cursor: pointer;
        }

        .dark .bundle-card { background: #1a1a1a; border-color: #2a2a2a; }

        .bundle-card:hover { border-color: #111111; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .dark .bundle-card:hover { border-color: #444444; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }

        .bundle-card-img {
          width: 64px; height: 64px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f8f8f8;
        }

        .dark .bundle-card-img { background: #222; }

        .bundle-card-img img {
          width: 100%; height: 100%;
          object-fit: contain;
          padding: 4px;
        }

        .bundle-card-info { flex: 1; min-width: 0; }
        .bundle-card-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
        .dark .bundle-card-title { color: #f0f0f0; }
        .bundle-card-qty { font-size: 12px; color: #888; }

        .bundle-featured {
          display: inline-block;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #111111;
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .dark .bundle-featured { color: #aaaaaa; background: #222222; }

        .bundle-card-arrow {
          font-size: 20px;
          color: #ccc;
          flex-shrink: 0;
          transition: transform 0.2s, color 0.2s;
        }

        .bundle-card:hover .bundle-card-arrow { transform: translateX(3px); color: #111111; }
        .dark .bundle-card:hover .bundle-card-arrow { color: #444444; }

        /* ══════════════════════════════════════════════
           LIGHTBOX
        ══════════════════════════════════════════════ */

        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.94);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: lb-fade 0.2s ease;
        }

        @keyframes lb-fade { from { opacity: 0 } to { opacity: 1 } }

        .lb-image {
          max-width: 90vw;
          max-height: 88vh;
          object-fit: contain;
          border-radius: 12px;
          animation: lb-zoom 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes lb-zoom { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }

        .lb-close, .lb-nav {
          position: absolute;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.12);
          color: white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }

        .lb-close:hover, .lb-nav:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.08);
        }

        .lb-close { top: 20px; right: 20px; width: 44px; height: 44px; }
        .lb-close svg { width: 20px; height: 20px; }

        .lb-nav {
          top: 50%; transform: translateY(-50%);
          width: 52px; height: 52px;
        }

        .lb-nav:hover { transform: translateY(-50%) scale(1.08); }
        .lb-prev { left: 24px; }
        .lb-next { right: 24px; }
        .lb-nav svg { width: 22px; height: 22px; }

        .lb-counter {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 7px 20px;
          border-radius: 20px;
          font-size: 13px;
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          letter-spacing: 0.04em;
          backdrop-filter: blur(8px);
        }

        .lb-bundle-label { color: rgba(255,255,255,0.55); font-weight: 400; }

        /* ══════════════════════════════════════════════
           RESPONSIVE
        ══════════════════════════════════════════════ */

        @media (max-width: 768px) {
          .samsung-container { padding: 0 16px 60px; }
          .samsung-breadcrumb { padding: 14px 0 24px; }
          .thumb-btn { width: 60px; height: 60px; }
          .bundle-section { margin-top: 36px; padding-top: 28px; }
          .bundle-grid { grid-template-columns: 1fr; }
          .lb-prev { left: 12px; }
          .lb-next { right: 12px; }
          .lb-nav { width: 44px; height: 44px; }
        }

        @media (max-width: 480px) {
          .samsung-container { padding: 0 12px 48px; }
          .atc-btn { padding: 14px 24px; font-size: 14px; }
          .color-variants-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </>
  );
};

// Inline styles for skeleton and error states
const skeletonStyles = `
  .samsung-page { min-height: 100vh; background: #f8f8f8; font-family: sans-serif; padding: 24px; }
  .dark .samsung-page { background: #0d0d0d; }
  .samsung-container { max-width: 1280px; margin: 0 auto; padding: 24px; }
  .samsung-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
  .samsung-left, .samsung-right { display: flex; flex-direction: column; gap: 12px; }
  .skeleton-main { width: 100%; aspect-ratio: 1; border-radius: 20px; }
  .skeleton-thumbs { display: flex; gap: 8px; }
  .skeleton-thumb { width: 72px; height: 72px; border-radius: 10px; }
  .skeleton-title { height: 48px; width: 80%; border-radius: 8px; }
  .skeleton-price { height: 36px; width: 40%; border-radius: 8px; }
  .skeleton-line { height: 16px; width: 100%; border-radius: 6px; }
  .skeleton-line.short { width: 60%; }
  .skeleton-btn { height: 52px; width: 100%; border-radius: 10px; margin-top: 8px; }
  @media (max-width: 768px) { .samsung-grid { grid-template-columns: 1fr; } }
`;

const errorStyles = `
  .samsung-error { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; padding: 24px; font-family: sans-serif; }
  .error-icon { width: 64px; height: 64px; color: #c8232c; }
  .error-title { font-size: 22px; font-weight: 600; color: #1a1a1a; }
  .error-msg { font-size: 15px; color: #888; text-align: center; max-width: 400px; }
`;

export default ProductDetail;