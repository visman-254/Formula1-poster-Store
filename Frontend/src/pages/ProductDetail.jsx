import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";

// Returns true if a CSS color string is perceptually dark
const isDarkColor = (color) => {
  if (!color) return false;
  const s = color.toLowerCase().trim();
  const darkKeywords = [
    'black', 'noir', 'nero', 'negro', 'zwart', 'schwarz', 'noir',
    '#000', '#111', '#0d0d0d', '#1a1a1a', '#222', '#333', 'darkslategray', 'darkslategrey',
  ];
  if (darkKeywords.some(k => s.includes(k))) return true;
  if (s.startsWith('#')) {
    const full = s.length === 4
      ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
      : s;
    const r = parseInt(full.slice(1, 3), 16);
    const g = parseInt(full.slice(3, 5), 16);
    const b = parseInt(full.slice(5, 7), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.25;
    }
  }
  return false;
};

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
          const colorImageMap = new Map();
          res.data.forEach(img => {
            const color = img.color?.toLowerCase().trim();
            if (color && !colorImageMap.has(color)) {
              colorImageMap.set(color, img.image_url);
            }
          });
          const images = colorImageMap.size > 0
            ? Array.from(colorImageMap.values())
            : [...new Set(res.data.map(img => img.image_url))];
          setGalleryImages(images);
        } else { throw new Error("No gallery images found"); }
      } catch (err) {
        console.warn("Falling back to variant images:", err);
        const colorImageMap = new Map();
        if (product.variants) {
          product.variants.forEach(variant => {
            const color = variant.color?.toLowerCase().trim();
            if (color && variant.image && !colorImageMap.has(color)) {
              colorImageMap.set(color, variant.image);
            }
          });
        }
        let images = Array.from(colorImageMap.values());
        if (!!product.is_bundle && product.bundleImages) images.push(...product.bundleImages);
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

  const colorImageMap = useMemo(() => {
    const map = new Map();
    if (!product?.variants || !galleryImages.length) return map;
    const uniqueColorsLocal = [...new Set(product.variants.map(v => v.color))];
    uniqueColorsLocal.forEach((color, index) => {
      if (galleryImages[index]) {
        map.set(color.toLowerCase().trim(), galleryImages[index]);
      }
    });
    return map;
  }, [product?.variants, galleryImages]);

  const renderMainImage = () => {
    if (!!product.is_bundle && product.bundleImages?.length >= 2) {
      return (
        <div className="bundle-main-img" onClick={() => openLightbox(0)}>
          <img src={product.bundleImages[0]} className="bundle-half" alt="Bundle Part 1"
            onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }} />
          <div className="bundle-divider" />
          <img src={product.bundleImages[1]} className="bundle-half" alt="Bundle Part 2"
            onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }} />
        </div>
      );
    }
    const colorKey = selectedColor?.toLowerCase().trim();
    const mainImage = colorKey && colorImageMap.has(colorKey)
      ? colorImageMap.get(colorKey)
      : selectedVariant?.image || product?.primaryImage || '/fallback.jpg';
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

  // Compute swatch style: dark colors get a visible border so they're not invisible
  const getSwatchStyle = (color, isSelected) => {
    const dark = isDarkColor(color);
    const base = { background: color?.toLowerCase() || '#ccc' };
    if (isSelected) {
      // Selected: always show the double-ring; adjust ring color for dark swatches
      return dark
        ? { ...base, boxShadow: '0 0 0 2px white, 0 0 0 4px #555' }
        : base; // non-dark selected handled by .color-swatch-active CSS
    }
    // Unselected dark: add a grey outline so the swatch is visible
    return dark ? { ...base, border: '3px solid #c0c0c0' } : base;
  };

  if (loading) {
    return (
      <>
        <div className="pd-page">
          <div className="pd-container">
            <div className="pd-grid">
              <div className="pd-left">
                <Skeleton style={{ width: '100%', aspectRatio: '1', borderRadius: '16px' }} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ width: '68px', height: '68px', borderRadius: '10px' }} />)}
                </div>
              </div>
              <div className="pd-right">
                <Skeleton style={{ height: '48px', width: '75%', borderRadius: '8px', marginBottom: '16px' }} />
                <Skeleton style={{ height: '32px', width: '40%', borderRadius: '8px', marginBottom: '12px' }} />
                <Skeleton style={{ height: '14px', width: '100%', borderRadius: '6px', marginBottom: '8px' }} />
                <Skeleton style={{ height: '14px', width: '65%', borderRadius: '6px', marginBottom: '24px' }} />
                <Skeleton style={{ height: '52px', width: '100%', borderRadius: '10px' }} />
              </div>
            </div>
          </div>
        </div>
        <style>{css}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="pd-page">
          <div className="pd-container">
            <div className="pd-error">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#c8232c', marginBottom: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="error-title">Something went wrong</p>
              <p className="error-msg">{error}</p>
            </div>
          </div>
        </div>
        <style>{css}</style>
      </>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <>
        <div className="pd-page">
          <div className="pd-container">
            <div className="pd-error">
              <p className="error-title">Product not found</p>
            </div>
          </div>
        </div>
        <style>{css}</style>
      </>
    );
  }

  return (
    <>
      <div className="pd-page">
        <div className="pd-container">

          {/* Breadcrumb */}
          <nav className="pd-breadcrumb">
            <span>Home</span>
            <span className="bc-sep">›</span>
            <span>Products</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">{product.title}</span>
          </nav>

          {/* Outer: [gallery+details] | [specs] */}
          <div className="pd-outer">

            {/* Inner: gallery | details */}
            <div className="pd-grid">

              {/* ── LEFT: Gallery ── */}
              <div className="pd-left">
                <div className="main-image-wrap">
                  {renderMainImage()}
                  {!!product.is_bundle && <span className="bundle-badge">Bundle</span>}
                </div>

                {!galleryLoading && galleryImages.length > 1 && (
                  <div className="thumb-strip">
                    {galleryImages.map((url, i) => {
                      const isActive = !product.is_bundle && (
                        (selectedColor && colorImageMap.get(selectedColor.toLowerCase().trim()) === url) ||
                        (!selectedColor && selectedVariant?.image === url)
                      );
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (!product.is_bundle) {
                              const uniqueColorsLocal = [...new Set(product.variants.map(v => v.color))];
                              const clickedColor = uniqueColorsLocal[i];
                              if (clickedColor) {
                                setSelectedColor(clickedColor);
                                setSelectedStorage(null);
                                setSelectedRam(null);
                              }
                            }
                            openLightbox(i);
                          }}
                          className={`thumb-btn ${isActive || (!!product.is_bundle && product.bundleImages?.length >= 2 && i < 2) ? 'thumb-active' : ''}`}
                          aria-label={`View image ${i + 1}`}
                        >
                          <img
                            src={url}
                            alt={`${product.title} view ${i + 1}`}
                            loading="lazy"
                            onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Details ── */}
              <div className="pd-right">

                {/* Title */}
                <div className="title-row">
                  <h1 className="product-title">{product.title}</h1>
                  {!!product.is_bundle && <span className="bundle-tag">Bundle Package</span>}
                </div>

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

                {/* Variants */}
                {!product.is_bundle && product.variants?.length > 0 && (
                  <div className="variants-section">

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
                                style={getSwatchStyle(color, isSelected)}
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

                {/* Color variant grid */}
                {!product.is_bundle && product.variants?.length > 1 && uniqueColors.length > 1 && (
                  <div className="color-variants-section">
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
                            <div className="color-variant-img-wrap">
                              <img
                                src={variant?.image}
                                alt={`${product.title} - ${color}`}
                                loading="lazy"
                                onError={(e) => { e.target.src = "/fallback.jpg"; e.target.onerror = null; }}
                              />
                            </div>
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
            </div>{/* end pd-grid */}

            {/* ── Specs column ── */}
            {product.description && (
              <div className="specs-col">
                <h2 className="specs-title">Specifications</h2>
                <div className="specs-rule" />
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
              </div>
            )}

          </div>{/* end pd-outer */}

          {/* Bundle section */}
          {!!product.is_bundle && product.bundle_products?.length > 0 && (
            <div className="bundle-section">
              <h2 className="specs-title">What's in the Box</h2>
              <div className="specs-rule" style={{ marginBottom: '24px' }} />
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

      {/* Lightbox */}
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

      <style>{css}</style>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Serif+Display&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pd-page {
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
    padding-bottom: 80px;
  }
  .dark .pd-page { color: #f0f0f0; }

  .pd-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px 80px;
  }

  /* Breadcrumb */
  .pd-breadcrumb {
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

  /* Outer: [grid] | [specs] */
  .pd-outer {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 56px;
    align-items: start;
  }
  @media (max-width: 1280px) { .pd-outer { grid-template-columns: 1fr; } }

  /* Inner: gallery | details */
  .pd-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 56px;
    align-items: start;
    min-width: 0;
  }
  @media (max-width: 1024px) { .pd-grid { grid-template-columns: 1fr; gap: 36px; } }

  /* Gallery */
  .pd-left {
    position: sticky;
    top: 24px;
  }
  @media (max-width: 1024px) { .pd-left { position: static; } }

  .main-image-wrap {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    width: 100%;
    background: rgba(0,0,0,0.03);
    padding-top: 100%;
  }
  .dark .main-image-wrap { background: rgba(255,255,255,0.04); }

  .main-product-image {
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    cursor: zoom-in;
    padding: 24px;
    transform: scale(1);
    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .main-product-image:hover { transform: scale(1.04); }

  .bundle-main-img {
    position: absolute;
    top: 0; left: 0;
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
  .bundle-divider { width: 2px; background: rgba(0,0,0,0.06); flex-shrink: 0; }
  .dark .bundle-divider { background: rgba(255,255,255,0.06); }

  .bundle-badge {
    position: absolute;
    top: 14px; left: 14px;
    background: #111;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 12px;
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
    width: 68px;
    height: 68px;
    border-radius: 10px;
    overflow: hidden;
    background: rgba(0,0,0,0.03);
    cursor: pointer;
    padding: 0;
    border: 2px solid transparent;
    transition: border-color 0.2s, transform 0.2s;
  }
  .dark .thumb-btn { background: rgba(255,255,255,0.05); }
  .thumb-btn img {
    width: 100%; height: 100%;
    object-fit: contain;
    padding: 4px;
    transition: transform 0.25s;
  }
  .thumb-btn:hover { transform: translateY(-2px); border-color: #111; }
  .thumb-btn:hover img { transform: scale(1.08); }
  .thumb-active { border-color: #111 !important; }
  .dark .thumb-active { border-color: #555 !important; }

  /* Details */
  .pd-right {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 8px;
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
    background: rgba(0,0,0,0.06);
    color: #555;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 20px;
    flex-shrink: 0;
    margin-top: 6px;
  }
  .dark .bundle-tag { background: rgba(255,255,255,0.08); color: #aaa; }

  .section-rule {
    height: 1px;
    background: rgba(0,0,0,0.07);
  }
  .dark .section-rule { background: rgba(255,255,255,0.07); }

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
  .dark .price-current { color: #fff; }
  .price-original {
    font-size: 17px;
    font-weight: 400;
    color: #aaa;
    text-decoration: line-through;
  }
  .price-save {
    font-size: 12px;
    font-weight: 600;
    color: #c8232c;
    background: #fff0f0;
    padding: 3px 10px;
    border-radius: 20px;
  }
  .dark .price-save { background: #2a1010; color: #ff6b6b; }

  /* Variants */
  .variants-section { display: flex; flex-direction: column; gap: 20px; }
  .variant-group { display: flex; flex-direction: column; gap: 10px; }
  .variant-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #888;
  }
  .variant-value { color: #1a1a1a; font-weight: 700; text-transform: none; letter-spacing: 0; }
  .dark .variant-value { color: #f0f0f0; }

  /* Color swatches */
  .color-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .color-swatch {
    width: 34px; height: 34px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .color-swatch svg { width: 15px; height: 15px; color: white; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5)); }
  .color-swatch:hover { transform: scale(1.15); }
  /* Active ring for non-dark swatches — dark swatches get their ring via inline style */
  .color-swatch-active { box-shadow: 0 0 0 2px white, 0 0 0 4px #111; transform: scale(1.12); }
  .dark .color-swatch-active { box-shadow: 0 0 0 2px #111, 0 0 0 4px #555; }

  /* Chips */
  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip {
    padding: 7px 16px;
    border-radius: 6px;
    background: rgba(0,0,0,0.04);
    border: none;
    font-size: 13px;
    font-weight: 500;
    color: #444;
    cursor: pointer;
    transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .dark .chip { background: rgba(255,255,255,0.06); color: #ccc; }
  .chip:hover { background: rgba(0,0,0,0.08); color: #111; }
  .dark .chip:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .chip-active { background: #111; color: #fff; font-weight: 600; }
  .dark .chip-active { background: #444; }

  /* Add to Cart */
  .atc-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 16px 32px;
    background: #111;
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
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .atc-btn:hover { background: #000; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
  .atc-btn:hover::before { opacity: 1; }
  .atc-btn:active { transform: translateY(0); }
  .atc-btn-success { background: #0bc268; }
  .atc-btn-success:hover { background: #09a558; box-shadow: 0 8px 24px rgba(11,194,104,0.32); }
  .dark .atc-btn { background: #333; }
  .dark .atc-btn:hover { background: #444; }
  .atc-icon { width: 19px; height: 19px; flex-shrink: 0; }

  /* Color variant grid */
  .color-variants-section { display: flex; flex-direction: column; gap: 10px; }
  .color-variants-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 10px; }

  .color-variant-card {
    position: relative;
    background: rgba(0,0,0,0.03);
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 0 8px;
    transition: all 0.25s ease;
    font-family: 'DM Sans', sans-serif;
    border: none;
  }
  .dark .color-variant-card { background: rgba(255,255,255,0.05); }
  .color-variant-card:hover { background: rgba(0,0,0,0.06); transform: translateY(-2px); }
  .dark .color-variant-card:hover { background: rgba(255,255,255,0.09); }

  .color-variant-img-wrap {
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: transparent;
  }
  .color-variant-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8px;
    transition: transform 0.3s;
  }
  .color-variant-card:hover .color-variant-img-wrap img { transform: scale(1.06); }

  .color-variant-card span {
    font-size: 11px; font-weight: 500; color: #666;
    margin-top: 6px; padding: 0 6px; text-align: center;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;
  }
  .dark .color-variant-card span { color: #aaa; }
  .color-variant-active { box-shadow: 0 0 0 2px #111 inset; }
  .dark .color-variant-active { box-shadow: 0 0 0 2px #555 inset; }

  .color-variant-check {
    position: absolute; top: 6px; right: 6px;
    width: 18px; height: 18px;
    background: #111; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .color-variant-check svg { width: 11px; height: 11px; color: white; }

  /* Specs column */
  .specs-col {
    position: sticky;
    top: 24px;
  }
  @media (max-width: 1280px) {
    .specs-col { position: static; margin-top: 48px; }
  }

  .specs-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(18px, 2vw, 24px);
    font-weight: 400;
    letter-spacing: -0.02em;
    color: #0d0d0d;
    margin-bottom: 12px;
  }
  .dark .specs-title { color: #f0f0f0; }

  .specs-rule {
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #111 0%, #555 100%);
    border-radius: 2px;
    margin-bottom: 20px;
  }

  .specs-body { line-height: 1.85; }

  .specs-model {
    font-size: 16px;
    font-weight: 600;
    color: #0d0d0d;
    margin-bottom: 12px;
  }
  .dark .specs-model { color: #f0f0f0; }

  .specs-item {
    font-size: 14px;
    color: #666;
    padding: 3px 0 3px 8px;
    border-left: 2px solid transparent;
    transition: border-color 0.18s, padding-left 0.18s, color 0.18s;
  }
  .dark .specs-item { color: #aaa; }
  .specs-item:hover { border-left-color: #111; padding-left: 14px; color: #1a1a1a; }
  .dark .specs-item:hover { border-left-color: #555; color: #f0f0f0; }

  /* Bundle section */
  .bundle-section {
    margin-top: 56px;
    padding-top: 40px;
    border-top: 1px solid rgba(0,0,0,0.07);
  }
  .dark .bundle-section { border-top-color: rgba(255,255,255,0.07); }

  .bundle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  .bundle-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    background: rgba(0,0,0,0.03);
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.22s;
    cursor: pointer;
  }
  .dark .bundle-card { background: rgba(255,255,255,0.04); }
  .bundle-card:hover { background: rgba(0,0,0,0.06); transform: translateY(-2px); }
  .dark .bundle-card:hover { background: rgba(255,255,255,0.07); }

  .bundle-card-img {
    width: 60px; height: 60px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(0,0,0,0.04);
  }
  .dark .bundle-card-img { background: rgba(255,255,255,0.06); }
  .bundle-card-img img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }

  .bundle-card-info { flex: 1; min-width: 0; }
  .bundle-card-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 3px; }
  .dark .bundle-card-title { color: #f0f0f0; }
  .bundle-card-qty { font-size: 11px; color: #999; }

  .bundle-featured {
    display: inline-block;
    margin-top: 3px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #555;
    background: rgba(0,0,0,0.06);
    padding: 2px 8px;
    border-radius: 10px;
  }
  .dark .bundle-featured { color: #aaa; background: rgba(255,255,255,0.08); }

  .bundle-card-arrow { font-size: 18px; color: #ccc; flex-shrink: 0; transition: transform 0.2s, color 0.2s; }
  .bundle-card:hover .bundle-card-arrow { transform: translateX(3px); color: #111; }
  .dark .bundle-card:hover .bundle-card-arrow { color: #888; }

  /* Lightbox */
  .lightbox {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.94);
    backdrop-filter: blur(16px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    animation: lb-fade 0.2s ease;
  }
  @keyframes lb-fade { from { opacity: 0 } to { opacity: 1 } }

  .lb-image {
    max-width: 90vw; max-height: 88vh;
    object-fit: contain; border-radius: 12px;
    animation: lb-zoom 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  @keyframes lb-zoom { from { transform: scale(0.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }

  .lb-close, .lb-nav {
    position: absolute;
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(8px);
  }
  .lb-close:hover, .lb-nav:hover { background: rgba(255,255,255,0.2); transform: scale(1.08); }
  .lb-close { top: 20px; right: 20px; width: 44px; height: 44px; }
  .lb-close svg { width: 20px; height: 20px; }
  .lb-nav { top: 50%; transform: translateY(-50%); width: 50px; height: 50px; }
  .lb-nav:hover { transform: translateY(-50%) scale(1.08); }
  .lb-prev { left: 24px; }
  .lb-next { right: 24px; }
  .lb-nav svg { width: 22px; height: 22px; }

  .lb-counter {
    position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.55);
    padding: 6px 18px; border-radius: 20px;
    font-size: 13px; color: rgba(255,255,255,0.9);
    font-weight: 500; letter-spacing: 0.04em;
    backdrop-filter: blur(8px);
  }
  .lb-bundle-label { color: rgba(255,255,255,0.5); font-weight: 400; }

  /* Error */
  .pd-error {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 60vh; gap: 10px; text-align: center;
  }
  .error-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: #0d0d0d; }
  .dark .error-title { color: #f0f0f0; }
  .error-msg { font-size: 14px; color: #888; max-width: 360px; }

  /* Responsive */
  @media (max-width: 768px) {
    .pd-container { padding: 0 16px 60px; }
    .pd-breadcrumb { padding: 14px 0 24px; }
    .thumb-btn { width: 58px; height: 58px; }
    .bundle-section { margin-top: 40px; padding-top: 28px; }
    .bundle-grid { grid-template-columns: 1fr; }
    .lb-prev { left: 12px; }
    .lb-next { right: 12px; }
    .lb-nav { width: 42px; height: 42px; }
  }
  @media (max-width: 480px) {
    .pd-container { padding: 0 12px 48px; }
    .atc-btn { padding: 14px 20px; font-size: 14px; }
    .color-variants-grid { grid-template-columns: repeat(3, 1fr); }
  }
`;

export default ProductDetail;