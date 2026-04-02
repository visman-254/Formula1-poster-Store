import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import './PreOrderForm.css';
import { toast } from "sonner";
import { useUser } from '../context/UserContext';

/* ── Helper: Determine if color is light or dark ─────────────────────────────── */
const getBorderColor = (color) => {
  if (!color) return 'rgba(255,255,255,0.2)';
  
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate perceived brightness (W3C formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Light colors get dark border, dark colors get white border
  return brightness > 128 ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)';
};

/* ── Color mapping for visual swatches ─────────────────────────────────────────── */
const getColorSwatch = (colorName, colorHex) => {
  // If color_hex is provided directly, use it
  if (colorHex) return colorHex;
  
  const colorMap = {
    // Standard colors
    black: '#1a1a1a',
    white: '#f5f5f5',
    silver: '#c0c0c0',
    gray: '#808080',
    grey: '#808080',
    // Apple colors
    midnight: '#1a1a2e',
    starlight: '#f5f5dc',
    space: '#2d2d2d',
    // Samsung colors
    violet: '#8b00ff',
    cream: '#fffdd0',
    graphite: '#4a4a4a',
    // Other common colors
    blue: '#0066cc',
    red: '#dc143c',
    green: '#228b22',
    gold: '#ffd700',
    pink: '#ff69b4',
    purple: '#800080',
    orange: '#ff8c00',
    yellow: '#ffd700',
    titanium: '#878681',
    natural: '#c2a370',
    desert: '#edc9af',
    titanium_black: '#2b2b2b',
    titanium_gray: '#8a8a8a',
  };
  
  const normalized = colorName?.toLowerCase().trim() || '';
  return colorMap[normalized] || '#888888';
};

/* ── Ripple helper ─────────────────────────────────────────── */
const createRipple = (e, container) => {
  const rect = container.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2.2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'po-ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  container.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
};

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

  useEffect(() => { fetchPreorderProducts(); }, []);

  /* close cart on Escape */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fetchPreorderProducts = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/preorder-products`);
      setPreorderProducts(data);
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

  const handleProductSelect = (variantId, e) => {
    /* ripple on the page wrapper */
    if (pageRef.current) createRipple(e, pageRef.current);
    setSelectedProducts(prev => ({ ...prev, [variantId]: !prev[variantId] }));
    if (error) setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const cartCount  = Object.values(selectedProducts).filter(Boolean).length;
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
      setError('Please select at least one product you\'re interested in');
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
        address: null,
        city: null,
        zipcode: null,
        user_id: user?.id || null,
        items: selectedItems
      });

      toast.success("Interest registered!", {
        description: "We'll be in touch once the products are available."
      });

      setSuccess(true);
      setCartOpen(false);
      setSelectedProducts({});
      setFormData({
        name: user?.username || '',
        email: user?.email || '',
        phone: ''
      });
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
      <div className="preorder-form-container">
        <div className="preorder-card">

          {/* ── Title ── */}
          <h2>Reserve Yours</h2>
          <p className="description">
            Select the devices you're interested in and we'll notify you when available.
          </p>

          {/* ── Feedback ── */}
          {success && (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <div>
                <h3>Interest Registered</h3>
                <p>We'll be in touch as soon as your items are ready.</p>
              </div>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}

          {/* ══ PRODUCT SELECTION ══ */}
          <div className="products-section">
            <h3>Select Products</h3>

            {preorderProducts.length === 0 ? (
              <p className="no-products">No preorder products available right now. Check back soon.</p>
            ) : (
              preorderProducts.map(product => (
                <div key={product.product_id} className="product-group">
                  <h4>{product.title}</h4>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  <div className="variants-list">
                    {product.variants?.map(variant => (
                      <div
                        key={variant.variant_id}
                        className={`variant-item${selectedProducts[variant.variant_id] ? ' selected' : ''}`}
                        onClick={(e) => !loading && handleProductSelect(variant.variant_id, e)}
                      >
                        <label className="checkbox-label" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedProducts[variant.variant_id] || false}
                            onChange={(e) => handleProductSelect(variant.variant_id, e)}
                            disabled={loading}
                          />
                          <span className="variant-info">
                            {/* Color swatch instead of just text */}
                            <span 
                              className="color-swatch" 
                              style={{ 
                                backgroundColor: getColorSwatch(variant.color, variant.color_hex),
                                border: `2px solid ${getBorderColor(getColorSwatch(variant.color, variant.color_hex))}`
                              }}
                              title={variant.color}
                            />
                            <strong>{variant.color}</strong>
                            {variant.storage && <span>{variant.storage}</span>}
                            {variant.ram && <span>{variant.ram}</span>}
                            {variant.preorder_eta_days && (
                              <span className="eta">Est. {variant.preorder_eta_days} days</span>
                            )}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="privacy-note">
            Your information is used solely to contact you about availability.
            We never share your details with third parties.
          </p>
        </div>
      </div>

      {/* ══ FLOATING CART BUTTON ══ */}
      {hasSelection && (
        <button
          className="cart-fab"
          onClick={() => setCartOpen(true)}
          aria-label="Open pre-order cart"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <span className="cart-badge">{cartCount}</span>
        </button>
      )}

      {/* ══ CART DRAWER OVERLAY ══ */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>

            {/* drawer header */}
            <div className="cart-drawer-header">
              <div>
                <span className="cart-drawer-label">Pre-order</span>
                <h2 className="cart-drawer-title">Your Interest</h2>
              </div>
              <button className="cart-close-btn" onClick={() => setCartOpen(false)} aria-label="Close cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="cart-drawer-body">

              {/* ── Selected items ── */}
              <div className="cart-items-section">
                {getCartItems().map(({ variantId, productTitle, variant }) => (
                  <div key={variantId} className="cart-item">
                    <div className="cart-item-info">
                      <p className="cart-item-title">{productTitle}</p>
                      <p className="cart-item-sub">
                        <span 
                          className="color-swatch-small" 
                          style={{ backgroundColor: getColorSwatch(variant.color) }}
                        />
                        {variant.color}
                        {variant.storage && ` · ${variant.storage}`}
                        {variant.ram && ` · ${variant.ram}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Contact Details ── */}
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