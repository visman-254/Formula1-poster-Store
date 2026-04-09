import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import './PreOrderForm.css';
import { toast } from "sonner";
import { useUser } from '../context/UserContext';

// Helper to get full image URL (mimics formatProductImage from backend)
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Remove leading slash if present
  const cleanPath = imagePath.replace(/^\/+/, '');
  return `${API_BASE}/${cleanPath}`;
};

/* ── Returns true if a CSS color string is perceptually dark ── */
const isDarkColor = (color) => {
  if (!color) return false;
  const s = color.toLowerCase().trim();
  const darkKeywords = [
    'black', 'noir', 'nero', 'negro', 'zwart', 'schwarz',
    '#000', '#111', '#0d0d0d', '#1a1a1a', '#222', '#333',
    'darkslategray', 'darkslategrey', 'midnight', 'graphite',
    'titanium_black', 'space',
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
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.25;
    }
  }
  return false;
};

/* ── Resolve a color name → hex ── */
const resolveColor = (colorName, colorHex) => {
  if (colorHex) return colorHex;
  const colorMap = {
    black: '#1a1a1a', white: '#f5f5f5', silver: '#c0c0c0',
    gray: '#808080', grey: '#808080', midnight: '#1a1a2e',
    starlight: '#f5f5dc', space: '#2d2d2d', violet: '#8b00ff',
    cream: '#fffdd0', graphite: '#4a4a4a', blue: '#0066cc',
    red: '#dc143c', green: '#228b22', gold: '#ffd700',
    pink: '#ff69b4', purple: '#800080', orange: '#ff8c00',
    yellow: '#ffd700', titanium: '#878681', natural: '#c2a370',
    desert: '#edc9af', titanium_black: '#2b2b2b', titanium_gray: '#8a8a8a',
  };
  return colorMap[colorName?.toLowerCase().trim()] || '#888888';
};

/* ── Swatch ring style ── */
const getSwatchStyle = (colorHex, isSelected) => {
  const dark = isDarkColor(colorHex);
  const base = { background: colorHex || '#ccc' };
  if (isSelected) {
    return dark
      ? { ...base, boxShadow: '0 0 0 2px white, 0 0 0 4px #555' }
      : base;
  }
  return dark ? { ...base, border: '3px solid #c0c0c0' } : base;
};

/* ── Ripple helper ── */
const createRipple = (e, container) => {
  const rect = container.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2.2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'po-ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  container.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
};

/* ════════════════════════════════════════════════════════════
   PRODUCT CARD — Fixed image handling (matching ProductDetail)
════════════════════════════════════════════════════════════ */
const PreorderProductCard = ({ product, selectedVariantId, onVariantSelect }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [addedToPreorder, setAddedToPreorder] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  // Fetch gallery images from API (like ProductDetail does)
  useEffect(() => {
    const fetchGalleryImages = async () => {
      if (!product?.product_id) {
        setGalleryLoading(false);
        return;
      }
      
      try {
        setGalleryLoading(true);
        // Try to fetch from gallery endpoint first
        const res = await axios.get(`${API_BASE}/api/gallery/${product.product_id}/images`);
        
        if (res.data?.length > 0) {
          // Build color-to-image map from gallery
          const colorImageMap = new Map();
          res.data.forEach(img => {
            const color = img.color?.toLowerCase().trim();
            if (color && !colorImageMap.has(color)) {
              colorImageMap.set(color, getFullImageUrl(img.image_url));
            }
          });
          
          // Get unique images
          const images = colorImageMap.size > 0
            ? Array.from(colorImageMap.values())
            : [...new Set(res.data.map(img => getFullImageUrl(img.image_url)))];
          
          setGalleryImages(images);
        } else {
          throw new Error("No gallery images found");
        }
      } catch (err) {
        console.warn("Falling back to variant images:", err);
        // Fallback to variant images
        const colorImageMap = new Map();
        if (product.variants) {
          product.variants.forEach(variant => {
            const color = variant.color?.toLowerCase().trim();
            if (color && variant.image && !colorImageMap.has(color)) {
              colorImageMap.set(color, getFullImageUrl(variant.image));
            }
          });
        }
        
        let images = Array.from(colorImageMap.values());
        
        // Also add additional_images if they exist
        if (product.additional_images && product.additional_images.length > 0) {
          product.additional_images.forEach(img => {
            const fullUrl = getFullImageUrl(img);
            if (!images.includes(fullUrl)) {
              images.push(fullUrl);
            }
          });
        }
        
        // Add primary image if available
        if (product.primaryImage && !images.includes(getFullImageUrl(product.primaryImage))) {
          images.push(getFullImageUrl(product.primaryImage));
        }
        
        setGalleryImages(images);
      } finally {
        setGalleryLoading(false);
      }
    };
    
    fetchGalleryImages();
  }, [product?.product_id, product?.variants, product?.additional_images, product?.primaryImage]);

  // Build color-to-image map from gallery (matching ProductDetail logic)
  const colorImageMap = useMemo(() => {
    const map = new Map();
    if (!product?.variants || !galleryImages.length) return map;
    
    const uniqueColors = [...new Set(product.variants.map(v => v.color).filter(c => c))];
    uniqueColors.forEach((color, index) => {
      if (galleryImages[index]) {
        map.set(color.toLowerCase().trim(), galleryImages[index]);
      }
    });
    return map;
  }, [product?.variants, galleryImages]);

  /* ── Seed first variant on mount ── */
  useEffect(() => {
    if (product.variants?.length > 0) {
      const first = product.variants[0];
      setSelectedVariant(first);
      if (first.color) setSelectedColor(first.color);
      if (first.storage) setSelectedStorage(first.storage);
      if (first.ram) setSelectedRam(first.ram);
    }
  }, [product]);

  /* ── Sync external selection ── */
  useEffect(() => {
    if (selectedVariantId && selectedVariant?.variant_id !== selectedVariantId) {
      const v = product.variants?.find(v => v.variant_id === selectedVariantId);
      if (v) {
        setSelectedVariant(v);
        if (v.color) setSelectedColor(v.color);
        if (v.storage) setSelectedStorage(v.storage);
        if (v.ram) setSelectedRam(v.ram);
      }
    }
  }, [selectedVariantId]);

  /* ── Derived option lists ── */
  const uniqueColors = useMemo(() =>
    [...new Set(product.variants?.map(v => v.color).filter(Boolean) ?? [])],
    [product.variants]);

  const uniqueStorages = useMemo(() => {
    const base = selectedColor
      ? product.variants?.filter(v => v.color === selectedColor)
      : product.variants ?? [];
    return [...new Set(base.map(v => v.storage).filter(Boolean))]
      .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  }, [product.variants, selectedColor]);

  const uniqueRams = useMemo(() => {
    const byColor = selectedColor ? product.variants?.filter(v => v.color === selectedColor) : product.variants ?? [];
    const byStorage = selectedStorage ? byColor.filter(v => v.storage === selectedStorage) : byColor;
    return [...new Set(byStorage.map(v => v.ram).filter(Boolean))]
      .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  }, [product.variants, selectedColor, selectedStorage]);

  /* ── Update selectedVariant when filters change ── */
  const filteredVariants = useMemo(() =>
    (product.variants ?? []).filter(v => {
      if (selectedColor && v.color !== selectedColor) return false;
      if (selectedStorage && v.storage !== selectedStorage) return false;
      if (selectedRam && v.ram !== selectedRam) return false;
      return true;
    }),
    [product.variants, selectedColor, selectedStorage, selectedRam]);

  useEffect(() => {
    if (filteredVariants.length > 0 &&
      (!selectedVariant || !filteredVariants.find(v => v.variant_id === selectedVariant.variant_id))) {
      setSelectedVariant(filteredVariants[0]);
    }
  }, [filteredVariants]);

  /* ── Lightbox helpers ── */
  const openLightbox = useCallback((i) => { setActiveImageIndex(i); setIsLightboxOpen(true); }, []);
  const closeLightbox = useCallback(() => { setIsLightboxOpen(false); }, []);
  const nextImage = useCallback((e) => { e?.stopPropagation(); setActiveImageIndex(p => (p + 1) % galleryImages.length); }, [galleryImages.length]);
  const prevImage = useCallback((e) => { e?.stopPropagation(); setActiveImageIndex(p => (p - 1 + galleryImages.length) % galleryImages.length); }, [galleryImages.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = 'unset'; };
  }, [isLightboxOpen, closeLightbox, nextImage, prevImage]);

  /* ── Price helpers ── */
  const { originalPrice, hasDiscount } = useMemo(() => {
    if (!selectedVariant) return { originalPrice: 0, hasDiscount: false };
    const price = Number(selectedVariant.price) || 0;
    const discount = Number(selectedVariant.discount) || 0;
    return { originalPrice: price + discount, hasDiscount: discount > 0 };
  }, [selectedVariant]);

  /* ── Color-change helper ── */
  const handleColorChange = (color) => {
    setSelectedColor(color);
    const withStorage = product.variants?.find(v => v.color === color && v.storage === selectedStorage);
    if (withStorage) {
      setSelectedVariant(withStorage);
      if (withStorage.ram) setSelectedRam(withStorage.ram);
    } else {
      const first = product.variants?.find(v => v.color === color);
      if (first) {
        setSelectedVariant(first);
        if (first.storage) setSelectedStorage(first.storage);
        if (first.ram) setSelectedRam(first.ram);
      }
    }
  };

  /* ── "Add to Pre-order" ── */
  const handleAddToPreorder = () => {
    if (!selectedVariant) return;
    onVariantSelect(selectedVariant.variant_id);
    setAddedToPreorder(true);
    setTimeout(() => setAddedToPreorder(false), 2000);
  };

  /* ── Main image (matching ProductDetail logic) ── */
  const mainImage = useMemo(() => {
    const colorKey = selectedColor?.toLowerCase().trim();
    if (colorKey && colorImageMap.has(colorKey)) {
      return colorImageMap.get(colorKey);
    }
    // Fallback to variant image or first gallery image
    const variantImage = selectedVariant?.image ? getFullImageUrl(selectedVariant.image) : null;
    if (variantImage) return variantImage;
    return galleryImages[0] || null;
  }, [selectedColor, colorImageMap, selectedVariant, galleryImages]);

  if (galleryLoading && !galleryImages.length) {
    return (
      <div className="po-pd-card">
        <div className="po-pd-left">
          <div className="po-main-image-wrap">
            <div className="po-image-placeholder">
              <span>Loading images...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="po-pd-card">
        {/* ── LEFT: Gallery ── */}
        <div className="po-pd-left">
          <div className="po-main-image-wrap">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.title}
                className="po-main-product-image"
                onError={(e) => { e.target.src = '/fallback.jpg'; e.target.onerror = null; }}
                onClick={() => { const i = galleryImages.indexOf(mainImage); openLightbox(i >= 0 ? i : 0); }}
                loading="eager"
              />
            ) : (
              <div className="po-image-placeholder" onClick={() => {}}>
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="64" height="64" rx="12" fill="currentColor" fillOpacity="0.06" />
                  <path d="M20 44l8-10 6 7 4-5 6 8H20z" fill="currentColor" fillOpacity="0.15" />
                  <circle cx="38" cy="26" r="4" fill="currentColor" fillOpacity="0.2" />
                  <rect x="12" y="12" width="40" height="40" rx="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
                <span>No image available</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="po-thumb-strip">
              {galleryImages.map((url, i) => {
                const isActive = mainImage === url;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveImageIndex(i);
                      openLightbox(i);
                    }}
                    className={`po-thumb-btn${isActive ? ' po-thumb-active' : ''}`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img
                      src={url}
                      alt={`${product.title} view ${i + 1}`}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/fallback.jpg'; e.target.onerror = null; }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Details ── */}
        <div className="po-pd-right">
          <div className="po-title-row">
            <h3 className="po-product-title">{product.title}</h3>
          </div>

          {product.description && (
            <p className="po-product-description">{product.description}</p>
          )}

          <div className="po-section-rule" />

          {selectedVariant && (
            <div className="po-price-block">
              {hasDiscount ? (
                <>
                  <span className="po-price-original">Kshs {originalPrice.toFixed(2)}</span>
                  <span className="po-price-current">Kshs {Number(selectedVariant.price).toFixed(2)}</span>
                  <span className="po-price-save">−Kshs {Number(selectedVariant.discount).toFixed(2)}</span>
                </>
              ) : (
                <span className="po-price-current">
                  {Number(selectedVariant.price) > 0
                    ? `Kshs ${Number(selectedVariant.price).toFixed(2)}`
                    : 'Price TBA'}
                </span>
              )}
            </div>
          )}

          {selectedVariant?.preorder_eta_days && (
            <div className="po-eta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span>Est. {selectedVariant.preorder_eta_days} days until available</span>
            </div>
          )}

          {product.variants?.length > 0 && (
            <div className="po-variants-section">
              {uniqueColors.length > 0 && (
                <div className="po-variant-group">
                  <p className="po-variant-label">
                    Color <span className="po-variant-value">{selectedColor}</span>
                  </p>
                  <div className="po-color-row">
                    {uniqueColors.map((color) => {
                      const hex = resolveColor(color, product.variants?.find(v => v.color === color)?.color_hex);
                      const isSel = selectedColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          className={`po-color-swatch${isSel ? ' po-color-swatch-active' : ''}`}
                          style={getSwatchStyle(hex, isSel)}
                          title={color}
                          aria-label={`Select ${color}`}
                        >
                          {isSel && (
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
                <div className="po-variant-group">
                  <p className="po-variant-label">Storage</p>
                  <div className="po-chip-row">
                    {uniqueStorages.map((storage) => {
                      const isSel = selectedStorage === storage;
                      const matchV = product.variants?.find(v =>
                        (!selectedColor || v.color === selectedColor) && v.storage === storage);
                      return (
                        <button
                          key={storage}
                          onClick={() => {
                            setSelectedStorage(storage);
                            setSelectedRam(null);
                            if (matchV) {
                              setSelectedVariant(matchV);
                              if (matchV.ram) setSelectedRam(matchV.ram);
                            }
                          }}
                          className={`po-chip${isSel ? ' po-chip-active' : ''}`}
                        >{storage}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {uniqueRams.length > 0 && (
                <div className="po-variant-group">
                  <p className="po-variant-label">RAM</p>
                  <div className="po-chip-row">
                    {uniqueRams.map((ram) => {
                      const isSel = selectedRam === ram;
                      const matchV = product.variants?.find(v =>
                        (!selectedColor || v.color === selectedColor) &&
                        (!selectedStorage || v.storage === selectedStorage) &&
                        v.ram === ram);
                      return (
                        <button
                          key={ram}
                          onClick={() => {
                            setSelectedRam(ram);
                            if (matchV) setSelectedVariant(matchV);
                          }}
                          className={`po-chip${isSel ? ' po-chip-active' : ''}`}
                        >{ram}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="po-section-rule" />

          <button
            className={`po-atc-btn${addedToPreorder ? ' po-atc-btn-success' : (selectedVariantId === selectedVariant?.variant_id ? ' po-atc-btn-selected' : '')}`}
            onClick={handleAddToPreorder}
            disabled={!selectedVariant}
            aria-label="Add to pre-order"
          >
            {addedToPreorder ? (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="po-atc-icon">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Added to Pre-order
              </>
            ) : selectedVariantId === selectedVariant?.variant_id ? (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="po-atc-icon">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                In Your Pre-order
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="po-atc-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Reserve This
              </>
            )}
          </button>

          {/* Color variant grid */}
          {uniqueColors.length > 1 && (
            <div className="po-color-variants-section">
              <p className="po-variant-label">Available Colors</p>
              <div className="po-color-variants-grid">
                {uniqueColors.map((color) => {
                  const variant = product.variants?.find(v => v.color === color);
                  const isSel = selectedColor === color;
                  const colorImage = variant?.image ? getFullImageUrl(variant.image) : (colorImageMap.get(color?.toLowerCase().trim()) || null);
                  return (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`po-color-variant-card${isSel ? ' po-color-variant-active' : ''}`}
                      aria-label={`Select ${color}`}
                    >
                      <div className="po-color-variant-img-wrap">
                        {colorImage ? (
                          <img
                            src={colorImage}
                            alt={`${product.title} – ${color}`}
                            loading="lazy"
                            onError={(e) => { e.target.src = '/fallback.jpg'; e.target.onerror = null; }}
                          />
                        ) : (
                          <div className="po-color-variant-placeholder">
                            <div
                              className="po-color-swatch-dot"
                              style={{ background: resolveColor(color, variant?.color_hex) }}
                            />
                          </div>
                        )}
                      </div>
                      <span>{color}</span>
                      {isSel && (
                        <div className="po-color-variant-check">
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
      </div>

      {/* ── Lightbox ── */}
      {isLightboxOpen && galleryImages.length > 0 && (
        <div className="po-lightbox" onClick={closeLightbox} role="dialog" aria-modal="true">
          <button className="po-lb-close" onClick={closeLightbox} aria-label="Close">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {galleryImages.length > 1 && (
            <>
              <button className="po-lb-nav po-lb-prev" onClick={prevImage} aria-label="Previous">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="po-lb-nav po-lb-next" onClick={nextImage} aria-label="Next">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <img
            src={galleryImages[activeImageIndex]}
            alt={`${product.title} – ${activeImageIndex + 1} of ${galleryImages.length}`}
            className="po-lb-image"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.target.src = '/fallback.jpg'; e.target.onerror = null; }}
          />
          <div className="po-lb-counter">
            {activeImageIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT (unchanged from your version)
════════════════════════════════════════════════════════════ */
const PreOrderForm = () => {
  const { user } = useUser();
  const pageRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    phone: ''
  });

  const [preorderProducts, setPreorderProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => { fetchPreorderProducts(); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || preorderProducts.length === 0) return;
    const onScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = track;
      setAtStart(scrollLeft < 20);
      setAtEnd(scrollLeft + clientWidth >= scrollWidth - 20);
      const cards = Array.from(track.querySelectorAll('.po-product-wrapper'));
      let closest = 0, minDist = Infinity;
      cards.forEach((card, i) => {
        const dist = Math.abs((card.offsetLeft + card.offsetWidth / 2) - (scrollLeft + clientWidth / 2));
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveIndex(closest);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => track.removeEventListener('scroll', onScroll);
  }, [preorderProducts]);

  const scrollToCard = useCallback((index) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll('.po-product-wrapper'));
    const card = cards[index];
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => scrollToCard(activeIndex + 1), [activeIndex, scrollToCard]);
  const goPrev = useCallback(() => scrollToCard(activeIndex - 1), [activeIndex, scrollToCard]);

  const fetchPreorderProducts = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/preorder-products`);
      // Process images to full URLs
      const processedData = data.map(product => ({
        ...product,
        additional_images: product.additional_images?.map(img => getFullImageUrl(img)) || [],
        variants: product.variants?.map(variant => ({
          ...variant,
          image: variant.image ? getFullImageUrl(variant.image) : null
        })) || []
      }));
      setPreorderProducts(processedData);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in to view preorder products.');
        toast.error('Please log in to view preorder products');
      } else if (err.response?.status === 404) {
        setError('No preorder products available at the moment.');
        toast.info('No preorder products available');
      } else {
        setError('Failed to load preorder products. Please try again later.');
        toast.error('Failed to load products');
      }
    } finally {
      setProductsLoading(false);
    }
  };

  const handleVariantSelect = (variantId, e) => {
    if (pageRef.current && e) createRipple(e, pageRef.current);
    setSelectedProducts(prev => ({ ...prev, [variantId]: !prev[variantId] }));
    if (error) setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const cartCount = Object.values(selectedProducts).filter(Boolean).length;
  const hasSelection = cartCount > 0;

  const getCartItems = () =>
    Object.entries(selectedProducts)
      .filter(([, sel]) => sel)
      .map(([variantId]) => {
        let productTitle = '';
        let variant = null;
        preorderProducts.forEach(p => {
          const v = p.variants?.find(v => v.variant_id === parseInt(variantId));
          if (v) { variant = v; productTitle = p.title; }
        });
        return variant ? { variantId: parseInt(variantId), productTitle, variant } : null;
      })
      .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedItems = getCartItems().map(item => ({
      variant_id: item.variantId,
      quantity: 1,
      price: 0
    }));

    if (selectedItems.length === 0) {
      setError("Please select at least one product you're interested in");
      toast.error('Please select a product');
      return;
    }
    if (!formData.name || !formData.phone) {
      setError('Please fill in your name and phone number');
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/api/preorders`, {
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone,
        address: null, city: null, zipcode: null,
        user_id: user?.id || null,
        items: selectedItems
      });

      toast.success("Interest registered!", {
        description: "We'll be in touch once the products are available."
      });

      setSuccess(true);
      setCartOpen(false);
      setSelectedProducts({});
      setFormData({ name: user?.username || '', email: user?.email || '', phone: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="preorder-page-wrapper">
        <div className="preorder-form-container">
          <div className="preorder-card">
            <div className="loading-spinner"><p>Loading available products</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="preorder-page-wrapper" ref={pageRef}>
      <div className="preorder-form-container po-wide-container">
        <div className="po-page-header">
          <nav className="po-breadcrumb">
            <span>Home</span>
            <span className="po-bc-sep">›</span>
            <span className="po-bc-current">Pre-order</span>
          </nav>
          <h1 className="po-page-title">Reserve Yours</h1>
          <p className="po-page-subtitle">
            Select the devices you're interested in and we'll notify you when available.
          </p>
        </div>

        {success && (
          <div className="success-message" style={{ marginBottom: 32 }}>
            <div className="success-icon">✓</div>
            <div>
              <h3>Interest Registered</h3>
              <p>We'll be in touch as soon as your items are ready.</p>
            </div>
          </div>
        )}
        {error && !cartOpen && <div className="error-message" style={{ marginBottom: 24 }}>{error}</div>}

        {preorderProducts.length === 0 ? (
          <div className="preorder-card">
            <p className="no-products">No preorder products available right now. Check back soon.</p>
          </div>
        ) : (
          <>
            <p className="po-carousel-count">
              {activeIndex + 1} <span>of {preorderProducts.length}</span>
            </p>

            <div className={`po-carousel-outer${atStart ? ' po-at-start' : ''}${atEnd ? ' po-at-end' : ''}`}>
              <button
                className="po-nav-btn po-nav-btn-prev"
                onClick={goPrev}
                disabled={atStart}
                aria-label="Previous product"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="po-products-list" ref={trackRef}>
                {preorderProducts.map((product, idx) => {
                  const selectedVariantIdForProduct = product.variants
                    ?.map(v => v.variant_id)
                    .find(id => selectedProducts[id]) ?? null;
                  const isActive = idx === activeIndex;

                  return (
                    <div
                      key={product.product_id}
                      className={`po-product-wrapper${isActive ? ' po-card-active' : ' po-card-dim'}`}
                    >
                      <PreorderProductCard
                        product={product}
                        selectedVariantId={selectedVariantIdForProduct}
                        onVariantSelect={(variantId) => {
                          setSelectedProducts(prev => {
                            const next = { ...prev };
                            product.variants?.forEach(v => { next[v.variant_id] = false; });
                            next[variantId] = !prev[variantId];
                            return next;
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                className="po-nav-btn po-nav-btn-next"
                onClick={goNext}
                disabled={atEnd}
                aria-label="Next product"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="po-swipe-hint">
              {!atStart && (
                <span className="po-swipe-arrow po-arrow-left" aria-hidden="true">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
              )}

              <div className="po-dot-track" role="tablist" aria-label="Products">
                {preorderProducts.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === activeIndex}
                    aria-label={`Go to product ${i + 1}`}
                    className={`po-dot${i === activeIndex ? ' po-dot-active' : ''}`}
                    onClick={() => scrollToCard(i)}
                  />
                ))}
              </div>

              {!atEnd && (
                <span className="po-swipe-arrow" aria-hidden="true">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </div>
          </>
        )}

        <p className="privacy-note">
          Your information is used solely to contact you about availability.
          We never share your details with third parties.
        </p>
      </div>

      {hasSelection && (
        <button
          className="cart-fab"
          onClick={() => setCartOpen(true)}
          aria-label="Open pre-order cart"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <span className="cart-badge">{cartCount}</span>
        </button>
      )}

      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <div>
                <span className="cart-drawer-label">Pre-order</span>
                <h2 className="cart-drawer-title">Your Interest</h2>
              </div>
              <button className="cart-close-btn" onClick={() => setCartOpen(false)} aria-label="Close cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="cart-drawer-body">
              <div className="cart-items-section">
                {getCartItems().map(({ variantId, productTitle, variant }) => (
                  <div key={variantId} className="cart-item">
                    <div className="cart-item-info">
                      <p className="cart-item-title">{productTitle}</p>
                      <p className="cart-item-sub">
                        <span
                          className="color-swatch-small"
                          style={{
                            backgroundColor: resolveColor(variant.color, variant.color_hex),
                            border: `2px solid ${isDarkColor(resolveColor(variant.color, variant.color_hex)) ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.3)'}`
                          }}
                        />
                        {variant.color}
                        {variant.storage && ` · ${variant.storage}`}
                        {variant.ram && ` · ${variant.ram}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="cart-form">
                <h3 className="cart-section-heading">Your Contact Details</h3>

                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label htmlFor="d-name">Full Name <span className="required">*</span></label>
                  <input type="text" id="d-name" name="name" value={formData.name}
                    onChange={handleChange} required disabled={loading} placeholder="Your name" />
                </div>

                <div className="form-group">
                  <label htmlFor="d-email">Email Address</label>
                  <input type="email" id="d-email" name="email" value={formData.email}
                    onChange={handleChange} disabled={loading} placeholder="your@email.com" />
                </div>

                <div className="form-group">
                  <label htmlFor="d-phone">Phone Number <span className="required">*</span></label>
                  <input type="tel" id="d-phone" name="phone" value={formData.phone}
                    onChange={handleChange} required disabled={loading} placeholder="+254 7XX XXX XXX" />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <><span className="spinner" /> Submitting...</>
                  ) : (
                    `Show Interest${cartCount > 1 ? ` (${cartCount} products)` : ''}`
                  )}
                </button>

                <p className="privacy-note" style={{ paddingBottom: 0, marginBottom: 0 }}>
                  We'll contact you when your selected products are available.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreOrderForm;