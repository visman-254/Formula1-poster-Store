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
;

  const generateWhatsAppOrderLink = () => {
    let message = `🛒 PANNA MUSIC ORDER\n\n`;
    cartItems.forEach((item, index) => {
      const unitPrice = parseFloat(item.price);
      const qty = parseInt(item.quantity);
      const itemTotal = unitPrice * qty;
      message += `${index + 1}. ${item.title}\n`;
      message += `   Unit Price: Ksh ${unitPrice.toFixed(2)}\n`;
      message += `   Quantity: ${qty}\n`;
      message += `   Item Total: Ksh ${itemTotal.toFixed(2)}\n\n`;
    });
    message += `------------------------\n`;
    message += `Total Items: ${totalItems}\n`;
    message += `Total Price: Ksh ${totalPrice.toFixed(2)}\n\n`;
    message += `Delivery Location:\nPhone Number:\n\nThank you.`;
    return `https://wa.me/254712133135?text=${encodeURIComponent(message)}`;
  };

  const renderCartImage = (item) => {
    const variantImage = item.image;
    const productImage = item.primaryImage || item.variants?.[0]?.image;
    if (item.is_bundle && Array.isArray(item.bundle_products) && item.bundle_products.length >= 2) {
      const leftImage = item.bundle_products[0]?.variants?.[0]?.image || item.bundle_products[0]?.primaryImage;
      const rightImage = item.bundle_products[1]?.variants?.[0]?.image || item.bundle_products[1]?.primaryImage;
      if (leftImage && rightImage) {
        return (
          <div className="cart-bundle-img">
            <img src={resolveImageUrl(leftImage)} className="bundle-half" alt="Bundle item 1" loading="lazy" />
            <img src={resolveImageUrl(rightImage)} className="bundle-half" alt="Bundle item 2" loading="lazy" />
          </div>
        );
      }
    }
    return (
      <img
        className="cart-item-img"
        src={resolveImageUrl(variantImage || productImage)}
        alt={item.title}
        loading="lazy"
      />
    );
  };

  if (cartItems.length === 0) {
    return (
      <>
        <div className="cart-page">
          <div className="cart-wrap">
            <nav className="breadcrumb">
              <span>Home</span><span className="bc-sep">›</span>
              <span className="bc-current">Cart</span>
            </nav>
            <div className="empty-state">
              <ShoppingBag size={52} strokeWidth={1} className="empty-icon" />
              <h2 className="empty-title">Your cart is empty</h2>
              <p className="empty-sub">Looks like you haven't added anything yet.</p>
              <Link to="/" className="cta-btn">
                Continue Shopping <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
        <style>{css}</style>
      </>
    );
  }

  return (
    <>
      <div className="cart-page">
        <div className="cart-wrap">

          <nav className="breadcrumb">
            <span>Home</span><span className="bc-sep">›</span>
            <span className="bc-current">Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
          </nav>

          <h1 className="page-title">Shopping Cart</h1>
          <div className="title-rule" />

          <div className="cart-layout">

            {/* Items */}
            <div className="items-col">
              {cartItems.map((item, i) => (
                <div key={item.variant_id} className="cart-row" style={{ animationDelay: `${i * 50}ms` }}>

                  <div className="item-img-wrap">
                    {renderCartImage(item)}
                    {item.is_bundle && <span className="bundle-pip">Bundle</span>}
                  </div>

                  <div className="item-body">
                    <div className="item-top">
                      <div>
                        <h3 className="item-title">{item.title}</h3>
                        {(item.color || item.storage || item.ram) && (
                          <p className="item-meta">
                            {[item.color && `Color: ${item.color}`, item.storage && `Storage: ${item.storage}`, item.ram && `RAM: ${item.ram}`].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {item.product_code && <p className="item-sku">SKU: {item.product_code}</p>}
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.variant_id, item.title)} aria-label="Remove">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="item-bottom">
                      <div>
                        <p className="unit-price">Ksh {parseFloat(item.price).toFixed(2)} / unit</p>
                        <p className="line-total">Ksh {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => decreaseQuantity(item.variant_id, item.title)}><Minus size={12} /></button>
                        <span className="qty-val">{parseInt(item.quantity)}</span>
                        <button className="qty-btn" onClick={() => addToCart(item)}><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="summary-col">
              <h2 className="summary-heading">Order Summary</h2>
              <div className="summary-rule" />

              <div className="summary-lines">
                <div className="summary-row">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span>Ksh {totalPrice.toFixed(2)}</span>
                </div>
                <div className="summary-row muted">
                  <span>Delivery</span>
                  <span className="italic-muted">Confirmed at checkout</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-row total">
                  <span>Total</span>
                  <span className="total-amount">Ksh {totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="action-stack">
                <Link to="/checkout" className="cta-btn full">
                  Checkout <ArrowRight size={15} />
                </Link>
                <a href={generateWhatsAppOrderLink()} target="_blank" rel="noopener noreferrer" className="wa-btn full">
                  <MessageCircle size={16} />
                  Order via WhatsApp
                </a>
              </div>

              <p className="summary-note">
                <Package size={12} /> Delivery details confirmed at checkout
              </p>
            </div>

          </div>
        </div>
      </div>
      <style>{css}</style>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display&display=swap');

  .cart-page {
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
    padding-bottom: 80px;
  }
  .dark .cart-page { color: #f0f0f0; }

  .cart-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 20px 0 32px;
    font-size: 13px;
    color: #888;
  }
  .bc-sep { color: #ccc; }
  .bc-current { color: #1a1a1a; font-weight: 500; }
  .dark .bc-current { color: #f0f0f0; }

  .page-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(28px, 5vw, 44px);
    font-weight: 400;
    letter-spacing: -0.02em;
    color: #0d0d0d;
    margin-bottom: 14px;
  }
  .dark .page-title { color: #f5f5f5; }

  .title-rule {
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, #111 0%, #555 100%);
    border-radius: 2px;
    margin-bottom: 40px;
  }

  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 64px;
    align-items: start;
  }
  @media (max-width: 860px) {
    .cart-layout { grid-template-columns: 1fr; gap: 48px; }
  }

  .items-col { display: flex; flex-direction: column; }

  .cart-row {
    display: flex;
    gap: 20px;
    padding: 22px 0;
    border-bottom: 1px solid rgba(0,0,0,0.07);
    animation: row-in 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }
  .dark .cart-row { border-bottom-color: rgba(255,255,255,0.06); }
  .cart-row:first-child { border-top: 1px solid rgba(0,0,0,0.07); }
  .dark .cart-row:first-child { border-top-color: rgba(255,255,255,0.06); }

  @keyframes row-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .item-img-wrap {
    position: relative;
    width: 100px;
    height: 100px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(0,0,0,0.04);
  }
  .dark .item-img-wrap { background: rgba(255,255,255,0.05); }

  .cart-item-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8px;
    transition: transform 0.4s ease;
  }
  .cart-row:hover .cart-item-img { transform: scale(1.05); }

  .cart-bundle-img { display: flex; width: 100%; height: 100%; }
  .bundle-half { width: 50%; height: 100%; object-fit: cover; }

  .bundle-pip {
    position: absolute;
    bottom: 4px; left: 4px;
    background: #111;
    color: #fff;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 10px;
  }

  .item-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }

  .item-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .item-title {
    font-family: 'DM Serif Display', serif;
    font-size: 17px;
    font-weight: 400;
    color: #0d0d0d;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }
  .dark .item-title { color: #f0f0f0; }

  .item-meta { font-size: 12px; color: #999; margin-top: 3px; }
  .item-sku { font-size: 11px; color: #bbb; font-family: monospace; margin-top: 2px; }

  .remove-btn {
    background: none;
    border: none;
    color: #ccc;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: color 0.2s;
    flex-shrink: 0;
  }
  .remove-btn:hover { color: #c8232c; }

  .item-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }

  .unit-price { font-size: 12px; color: #aaa; }
  .line-total { font-size: 16px; font-weight: 700; color: #0d0d0d; letter-spacing: -0.01em; margin-top: 1px; }
  .dark .line-total { color: #fff; }

  .qty-control {
    display: flex;
    align-items: center;
    background: rgba(0,0,0,0.05);
    border-radius: 8px;
    overflow: hidden;
  }
  .dark .qty-control { background: rgba(255,255,255,0.07); }

  .qty-btn {
    width: 32px; height: 32px;
    border: none;
    background: transparent;
    color: #555;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }
  .qty-btn:hover { background: #111; color: #fff; }
  .dark .qty-btn { color: #aaa; }
  .dark .qty-btn:hover { background: #444; color: #fff; }

  .qty-val {
    min-width: 30px;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .dark .qty-val { color: #f0f0f0; }

  /* Summary */
  .summary-col { position: sticky; top: 24px; }
  @media (max-width: 860px) { .summary-col { position: static; } }

  .summary-heading {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    color: #0d0d0d;
    letter-spacing: -0.01em;
    margin-bottom: 12px;
  }
  .dark .summary-heading { color: #f0f0f0; }

  .summary-rule {
    width: 36px;
    height: 2px;
    background: linear-gradient(90deg, #111 0%, #555 100%);
    border-radius: 2px;
    margin-bottom: 24px;
  }

  .summary-lines { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #666;
  }
  .dark .summary-row { color: #aaa; }
  .summary-row.muted { font-size: 13px; color: #aaa; }
  .italic-muted { font-style: italic; color: #bbb; font-size: 12px; }

  .summary-divider { height: 1px; background: rgba(0,0,0,0.08); }
  .dark .summary-divider { background: rgba(255,255,255,0.08); }

  .summary-row.total { font-size: 15px; font-weight: 600; color: #0d0d0d; margin-top: 4px; }
  .dark .summary-row.total { color: #f0f0f0; }
  .total-amount { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }

  .action-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    background: #111;
    color: #fff;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-decoration: none;
    transition: all 0.25s ease;
    cursor: pointer;
    border: none;
  }
  .cta-btn.full { width: 100%; box-sizing: border-box; }
  .cta-btn:hover { background: #000; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
  .dark .cta-btn { background: #333; }
  .dark .cta-btn:hover { background: #444; }

  .wa-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 24px;
    background: #25D366;
    color: #fff;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.25s ease;
  }
  .wa-btn.full { width: 100%; box-sizing: border-box; }
  .wa-btn:hover { background: #1ebe5d; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(37,211,102,0.28); }

  .summary-note {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #bbb;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 55vh;
    justify-content: center;
    gap: 14px;
    padding: 40px 0;
  }
  .empty-icon { color: #ddd; margin-bottom: 4px; }
  .dark .empty-icon { color: #333; }

  .empty-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(22px, 4vw, 34px);
    font-weight: 400;
    color: #0d0d0d;
    letter-spacing: -0.02em;
  }
  .dark .empty-title { color: #f0f0f0; }
  .empty-sub { font-size: 15px; color: #888; }

  @media (max-width: 600px) {
    .cart-wrap { padding: 0 16px; }
    .item-img-wrap { width: 80px; height: 80px; }
  }
`;

export default Cart;