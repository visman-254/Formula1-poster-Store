import React from 'react';
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";
import { MessageCircle, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";

const Cart = () => {
  const {
    cartItems,
    addToCart,
    decreaseQuantity,
    removeFromCart,
    totalItems,
    totalPrice
  } = useCart();

  /**
   * Resolve image URL consistently across the app
   * Images from backend are already full URLs (http:// or /)
   * Only modify relative paths that need API_BASE prepended
   */
  const resolveImageUrl = (image) => {
    if (!image) return '/placeholder.png';
    
    // If it's already a full URL (from backend formatting) or root-relative path, return as-is
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return image;
    }
    
    // Handle legacy/relative paths that need API_BASE
    // Remove any duplicate slashes and ensure proper path
    const cleanImage = image.replace(/^\/+/, '');
    return `${API_BASE}/${cleanImage}`;
  };

  /**
   * Generate WhatsApp order message with order details
   */
  const generateWhatsAppOrderLink = () => {
    let message = `🛒 *NEW ORDER - PANNA MUSIC*\n\n`;
    
    cartItems.forEach((item, index) => {
      const unitPrice = parseFloat(item.price);
      const qty = parseInt(item.quantity);
      const itemTotal = unitPrice * qty;
      
      message += `${index + 1}. *${item.title}*\n`;
      if (item.color || item.storage || item.ram) {
        const specs = [
          item.color && `Color: ${item.color}`,
          item.storage && `Storage: ${item.storage}`,
          item.ram && `RAM: ${item.ram}`
        ].filter(Boolean).join(' · ');
        message += `   ${specs}\n`;
      }
      message += `   Unit: Ksh ${unitPrice.toFixed(2)}\n`;
      message += `   Qty: ${qty}\n`;
      message += `   Subtotal: Ksh ${itemTotal.toFixed(2)}\n\n`;
    });
    
    message += `─────────────────────\n`;
    message += `*Total Items:* ${totalItems}\n`;
    message += `*Total Amount:* Ksh ${totalPrice.toFixed(2)}\n\n`;
    message += `*Delivery Details:*\n`;
    message += `Location: ___________\n`;
    message += `Phone: ___________\n\n`;
    message += `Thank you for shopping with us!`;
    
    return `https://wa.me/254712133135?text=${encodeURIComponent(message)}`;
  };

  /**
   * Render cart item image (handles bundles specially)
   */
  const renderCartImage = (item) => {
    // For bundle items with multiple products
    if (
      item.is_bundle &&
      Array.isArray(item.bundle_products) &&
      item.bundle_products.length >= 2
    ) {
      const leftImage = item.bundle_products[0]?.variants?.[0]?.image || 
                       item.bundle_products[0]?.primaryImage;
      const rightImage = item.bundle_products[1]?.variants?.[0]?.image || 
                        item.bundle_products[1]?.primaryImage;
      
      if (leftImage && rightImage) {
        return (
          <div className="cart-bundle-img">
            <img 
              src={resolveImageUrl(leftImage)} 
              className="bundle-half-left" 
              alt={`${item.title} - item 1`}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.png';
              }}
            />
            <img 
              src={resolveImageUrl(rightImage)} 
              className="bundle-half-right" 
              alt={`${item.title} - item 2`}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.png';
              }}
            />
          </div>
        );
      }
    }

    // For single items - prefer variant image, fallback to product image
    const imageSource = item.image || item.primaryImage;
    
    return (
      <img
        className="cart-item-img"
        src={resolveImageUrl(imageSource)}
        alt={item.title}
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/placeholder.png';
        }}
      />
    );
  };

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <>
        <div className="cart-page">
          <div className="cart-container">
            <div className="cart-breadcrumb">
              <span>Home</span>
              <span className="bc-sep">›</span>
              <span className="bc-current">Cart</span>
            </div>
            
            <div className="cart-empty">
              <div className="empty-icon-wrap">
                <ShoppingBag size={48} strokeWidth={1.2} />
              </div>
              <h2 className="empty-title">Your cart is empty</h2>
              <p className="empty-sub">Looks like you haven't added anything yet.</p>
              <Link to="/" className="empty-cta">
                Continue Shopping <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
        <style>{styles}</style>
      </>
    );
  }

  return (
    <>
      <div className="cart-page">
        <div className="cart-container">
          {/* Breadcrumb */}
          <nav className="cart-breadcrumb">
            <span>Home</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">
              Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </span>
          </nav>

          <div className="cart-layout">
            {/* Items Column */}
            <div className="cart-items-col">
              <div className="col-header">
                <h1 className="cart-title">Shopping Cart</h1>
                <div className="specs-rule" />
              </div>

              <div className="cart-items-list">
                {cartItems.map((item, index) => (
                  <div 
                    key={`${item.variant_id}-${item.product_id}`} 
                    className="cart-card" 
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {/* Product Image */}
                    <div className="cart-img-wrap">
                      {renderCartImage(item)}
                      {item.is_bundle && (
                        <span className="bundle-badge">Bundle</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="cart-info">
                      <div className="cart-info-top">
                        <div>
                          <h3 className="cart-item-title">{item.title}</h3>
                          
                          {/* Variant details */}
                          {(item.color || item.storage || item.ram) && (
                            <p className="cart-item-meta">
                              {[
                                item.color && `Color: ${item.color}`,
                                item.storage && `Storage: ${item.storage}`,
                                item.ram && `RAM: ${item.ram}`
                              ].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          
                          {/* SKU/Product Code */}
                          {item.product_code && (
                            <p className="cart-item-sku">SKU: {item.product_code}</p>
                          )}
                        </div>

                        {/* Remove button */}
                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.variant_id, item.title)}
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Price and Quantity */}
                      <div className="cart-info-bottom">
                        <div className="cart-price-col">
                          <span className="unit-price">
                            Ksh {parseFloat(item.price).toFixed(2)} each
                          </span>
                          <span className="line-total">
                            Ksh {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity controls */}
                        <div className="qty-control">
                          <button
                            className="qty-btn"
                            onClick={() => decreaseQuantity(item.variant_id, item.title)}
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="qty-value">{parseInt(item.quantity)}</span>
                          <button
                            className="qty-btn"
                            onClick={() => addToCart(item)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <div className="summary-header">
                <h2 className="summary-title">Order Summary</h2>
                <div className="specs-rule" />
              </div>

              <div className="summary-lines">
                <div className="summary-row">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span>Ksh {totalPrice.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery</span>
                  <span className="delivery-tbd">Calculated at checkout</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total-row">
                  <span>Total</span>
                  <span className="total-amount">Ksh {totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="summary-actions">
                <Link to="/checkout" className="checkout-btn">
                  Proceed to Checkout
                  <ArrowRight size={17} />
                </Link>

                <a
                  href={generateWhatsAppOrderLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  <MessageCircle size={17} />
                  Order via WhatsApp
                </a>
              </div>

              <div className="summary-note">
                <Package size={13} />
                <span>Delivery fees calculated at checkout based on location</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{styles}</style>
    </>
  );
};

// Styles (kept exactly as your original - no changes needed)
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Serif+Display&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .cart-page {
    min-height: 100vh;
    background: linear-gradient(135deg, rgba(248,248,248,0.9) 0%, rgba(240,240,245,0.9) 100%);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
  }

  .dark .cart-page {
    background: linear-gradient(135deg, rgba(13,13,13,0.95) 0%, rgba(20,20,25,0.95) 100%);
    color: #f0f0f0;
  }

  .cart-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px 80px;
  }

  /* Breadcrumb */
  .cart-breadcrumb {
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

  /* Layout */
  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 32px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .cart-layout { grid-template-columns: 1fr; }
  }

  /* Column header */
  .col-header { margin-bottom: 24px; }

  .cart-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(26px, 4vw, 38px);
    font-weight: 400;
    letter-spacing: -0.02em;
    color: #0d0d0d;
    margin-bottom: 12px;
  }

  .dark .cart-title { color: #f5f5f5; }

  .specs-rule {
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, #111111 0%, #555555 100%);
    border-radius: 2px;
  }

  /* Cart items */
  .cart-items-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cart-card {
    display: flex;
    gap: 20px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.3s ease;
    animation: card-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .cart-card:hover {
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 8px 40px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }

  .dark .cart-card {
    background: rgba(26, 26, 26, 0.6);
  }

  .dark .cart-card:hover {
    background: rgba(40, 40, 40, 0.85);
    box-shadow: 0 8px 40px rgba(0,0,0,0.35);
  }

  /* Image */
  .cart-img-wrap {
    position: relative;
    width: 110px;
    height: 110px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255,255,255,0.8);
  }

  .dark .cart-img-wrap {
    background: rgba(30,30,30,0.8);
  }

  .cart-item-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8px;
    transition: transform 0.4s ease;
  }

  .cart-card:hover .cart-item-img {
    transform: scale(1.06);
  }

  .cart-bundle-img {
    width: 100%;
    height: 100%;
    display: flex;
  }

  .bundle-half-left,
  .bundle-half-right {
    width: 50%;
    height: 100%;
    object-fit: cover;
  }

  .bundle-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    background: #111111;
    color: white;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 20px;
    z-index: 2;
  }

  /* Info */
  .cart-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
  }

  .cart-info-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .cart-item-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(15px, 2vw, 18px);
    font-weight: 400;
    color: #0d0d0d;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .dark .cart-item-title { color: #f0f0f0; }

  .cart-item-meta {
    font-size: 12px;
    color: #888;
    margin-top: 4px;
    font-weight: 400;
  }

  .cart-item-sku {
    font-size: 11px;
    color: #aaa;
    margin-top: 3px;
    font-family: monospace;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #ccc;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    color: #c8232c;
    background: #fff0f0;
  }

  .dark .remove-btn:hover {
    background: #2a1010;
    color: #ff6b6b;
  }

  /* Bottom row: price + qty */
  .cart-info-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .cart-price-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .unit-price {
    font-size: 12px;
    color: #999;
    font-weight: 400;
  }

  .line-total {
    font-size: 17px;
    font-weight: 700;
    color: #0d0d0d;
    letter-spacing: -0.02em;
  }

  .dark .line-total { color: #ffffff; }

  /* Quantity control */
  .qty-control {
    display: flex;
    align-items: center;
    gap: 0;
    background: rgba(0,0,0,0.05);
    border-radius: 8px;
    overflow: hidden;
  }

  .dark .qty-control {
    background: rgba(255,255,255,0.07);
  }

  .qty-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: #555;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .qty-btn:hover {
    background: #111111;
    color: white;
  }

  .dark .qty-btn { color: #aaa; }
  .dark .qty-btn:hover { background: #444; color: white; }
  
  .qty-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .qty-btn:disabled:hover {
    background: transparent;
    color: #555;
  }
  
  .dark .qty-btn:disabled:hover {
    background: transparent;
    color: #aaa;
  }

  .qty-value {
    min-width: 36px;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
    user-select: none;
  }

  .dark .qty-value { color: #f0f0f0; }

  /* ── Order Summary Panel ── */
  .order-summary {
    position: sticky;
    top: 24px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
    transition: all 0.3s ease;
    animation: card-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }

  .order-summary:hover {
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 8px 40px rgba(0,0,0,0.1);
  }

  .dark .order-summary {
    background: rgba(26, 26, 26, 0.8);
    box-shadow: 0 2px 20px rgba(0,0,0,0.35);
  }

  .dark .order-summary:hover {
    background: rgba(40, 40, 40, 0.9);
    box-shadow: 0 8px 40px rgba(0,0,0,0.45);
  }

  @media (max-width: 900px) {
    .order-summary { position: static; }
  }

  .summary-header { margin-bottom: 24px; }

  .summary-title {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: #0d0d0d;
    margin-bottom: 12px;
  }

  .dark .summary-title { color: #f0f0f0; }

  .summary-lines {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #666;
  }

  .dark .summary-row { color: #aaa; }

  .delivery-tbd {
    font-size: 12px;
    color: #aaa;
    font-style: italic;
  }

  .summary-divider {
    height: 1px;
    background: rgba(0,0,0,0.07);
    margin: 4px 0;
  }

  .dark .summary-divider { background: rgba(255,255,255,0.07); }

  .total-row {
    font-size: 16px;
    font-weight: 600;
    color: #0d0d0d;
  }

  .dark .total-row { color: #f0f0f0; }

  .total-amount {
    font-size: 20px;
    font-weight: 700;
    color: #0d0d0d;
    letter-spacing: -0.02em;
  }

  .dark .total-amount { color: #ffffff; }

  /* Action Buttons */
  .summary-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .checkout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 15px 24px;
    background: #111111;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;
  }

  .checkout-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .checkout-btn:hover {
    background: #000000;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  }

  .checkout-btn:hover::before { opacity: 1; }
  .checkout-btn:active { transform: translateY(0); }

  .dark .checkout-btn { background: #444; }
  .dark .checkout-btn:hover { background: #333; box-shadow: 0 8px 24px rgba(80,80,80,0.35); }

  .whatsapp-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px 24px;
    background: #25D366;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .whatsapp-btn:hover {
    background: #1ebe5d;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(37,211,102,0.35);
  }

  .whatsapp-btn:active { transform: translateY(0); }

  .summary-note {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    font-size: 11px;
    color: #bbb;
    line-height: 1.5;
  }

  .summary-note svg { flex-shrink: 0; color: #ccc; }

  /* ── Empty State ── */
  .cart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 55vh;
    gap: 16px;
    text-align: center;
    padding: 48px 24px;
  }

  .empty-icon-wrap {
    width: 96px;
    height: 96px;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
    margin-bottom: 8px;
  }

  .dark .empty-icon-wrap {
    background: rgba(26,26,26,0.7);
    color: #444;
  }

  .empty-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(22px, 4vw, 32px);
    font-weight: 400;
    color: #0d0d0d;
    letter-spacing: -0.02em;
  }

  .dark .empty-title { color: #f0f0f0; }

  .empty-sub {
    font-size: 15px;
    color: #888;
    max-width: 280px;
  }

  .empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 13px 28px;
    background: #111111;
    color: #fff;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: all 0.3s ease;
  }

  .empty-cta:hover {
    background: #000;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  }

  .dark .empty-cta { background: #444; }
  .dark .empty-cta:hover { background: #333; }

  /* Responsive */
  @media (max-width: 600px) {
    .cart-container { padding: 0 14px 60px; }
    .cart-card { flex-direction: column; gap: 14px; }
    .cart-img-wrap { width: 100%; height: 180px; }
    .cart-item-img { object-fit: contain; }
    .cart-info-bottom { flex-direction: row; justify-content: space-between; }
  }
`;

export default Cart;