import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import Select from "react-select";
import API_BASE from "../config";
import {
  ShoppingCart, Trash2, CreditCard, Package,
  User, Phone, Mail, MapPin, ArrowLeft,
  Receipt, ChevronRight, ShieldCheck
} from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const deliveryRegions = {
  Nairobi: [
    { town: "Nairobi CBD", price: 400 }, { town: "Westlands", price: 400 },
    { town: "Kilimani", price: 400 }, { town: "Karen", price: 400 },
    { town: "Eastleigh", price: 400 }, { town: "Kasarani", price: 400 },
    { town: "Embakasi", price: 400 }, { town: "Donholm", price: 400 },
    { town: "Rongai", price: 400 },
  ],
  Mombasa: [
    { town: "Mombasa Island", price: 400 }, { town: "Nyali", price: 400 },
    { town: "Bamburi", price: 400 }, { town: "Likoni", price: 400 },
    { town: "Changamwe", price: 400 }, { town: "Kisauni", price: 400 },
  ],
  Kisumu: [
    { town: "Kisumu City", price: 400 }, { town: "Ahero", price: 400 },
    { town: "Maseno", price: 400 }, { town: "Kondele", price: 400 },
    { town: "Mamboleo", price: 400 },
  ],
  Nakuru: [
    { town: "Nakuru Town", price: 350 }, { town: "Naivasha", price: 350 },
    { town: "Gilgil", price: 350 }, { town: "Njoro", price: 350 },
    { town: "Molo", price: 350 }, { town: "Bahati", price: 350 },
  ],
  UasinGishu: [
    { town: "Eldoret", price: 150 }, { town: "Burnt Forest", price: 350 },
    { town: "Turbo", price: 350 }, { town: "Moiben", price: 350 },
    { town: "Jua Kali", price: 350 }, { town: "Maili Nne", price: 250 },
  ],
  Kiambu: [
    { town: "Thika", price: 400 }, { town: "Kiambu Town", price: 400 },
    { town: "Ruiru", price: 400 }, { town: "Githunguri", price: 400 },
    { town: "Limuru", price: 400 }, { town: "Kabete", price: 400 },
    { town: "Kikuyu", price: 400 },
  ],
  Kisii: [
    { town: "Kisii Town", price: 450 }, { town: "Ogembo", price: 450 },
    { town: "Nyamache", price: 450 },
  ],
  Kakamega: [
    { town: "Kakamega Town", price: 400 }, { town: "Mumias", price: 400 },
    { town: "Malava", price: 400 }, { town: "Lugari", price: 400 },
  ],
  Bungoma: [
    { town: "Bungoma Town", price: 400 }, { town: "Webuye", price: 400 },
    { town: "Kimilili", price: 400 }, { town: "Chwele", price: 400 },
    { town: "Mt Elgon", price: 400 },
  ],
  TransNzoia: [
    { town: "Kitale", price: 400 }, { town: "Kiminini", price: 400 },
    { town: "Endebess", price: 400 },
  ],
  Nandi: [
    { town: "Kapsabet", price: 350 }, { town: "Nandi Hills", price: 350 },
    { town: "Mosoriot", price: 350 },
  ],
  Machakos: [
    { town: "Machakos Town", price: 350 }, { town: "Athi River", price: 350 },
    { town: "Mlolongo", price: 350 }, { town: "Kangundo", price: 350 },
    { town: "Masinga", price: 350 },
  ],
  Kajiado: [
    { town: "Kitengela", price: 400 }, { town: "Kajiado Town", price: 400 },
    { town: "Ngong", price: 400 }, { town: "Ongata Rongai", price: 400 },
    { town: "Isinya", price: 400 },
  ],
  Nyeri: [
    { town: "Nyeri Town", price: 350 }, { town: "Karatina", price: 350 },
    { town: "Othaya", price: 350 }, { town: "Mukurweini", price: 350 },
  ],
  Meru: [
    { town: "Meru Town", price: 400 }, { town: "Maua", price: 400 },
    { town: "Timau", price: 400 }, { town: "Kibirichia", price: 400 },
  ],
  Embu: [
    { town: "Embu Town", price: 400 }, { town: "Runyenjes", price: 400 },
    { town: "Siakago", price: 400 },
  ],
  Kericho: [
    { town: "Kericho Town", price: 350 }, { town: "Londiani", price: 350 },
    { town: "Litein", price: 350 },
  ],
  Bomet: [
    { town: "Bomet Town", price: 350 }, { town: "Sotik", price: 350 },
    { town: "Longisa", price: 350 },
  ],
  Narok: [
    { town: "Narok Town", price: 400 }, { town: "Kilgoris", price: 400 },
    { town: "Ololulung'a", price: 400 },
  ],
  HomaBay: [
    { town: "Homa Bay Town", price: 400 }, { town: "Mbita", price: 400 },
    { town: "Oyugis", price: 400 },
  ],
  Migori: [
    { town: "Migori Town", price: 400 }, { town: "Isebania", price: 400 },
    { town: "Awendo", price: 400 }, { town: "Rongo", price: 400 },
  ],
  Turkana: [
    { town: "Lodwar", price: 600 }, { town: "Lokichoggio", price: 600 },
    { town: "Kakuma", price: 600 },
  ],
  Garissa: [
    { town: "Garissa Town", price: 500 }, { town: "Masalani", price: 500 },
    { town: "Hulugho", price: 500 },
  ],
  Wajir: [
    { town: "Wajir Town", price: 600 }, { town: "Griftu", price: 600 },
    { town: "Habaswein", price: 600 },
  ],
  Mandera: [
    { town: "Mandera Town", price: 600 }, { town: "Elwak", price: 600 },
    { town: "Rhamu", price: 600 },
  ],
  TaitaTaveta: [
    { town: "Voi", price: 400 }, { town: "Taveta", price: 400 },
    { town: "Wundanyi", price: 400 },
  ],
  Lamu: [
    { town: "Lamu Town", price: 500 }, { town: "Mpeketoni", price: 500 },
    { town: "Faza", price: 500 },
  ],
  Kilifi: [
    { town: "Kilifi Town", price: 400 }, { town: "Malindi", price: 400 },
    { town: "Kaloleni", price: 400 }, { town: "Rabai", price: 400 },
  ],
  Kwale: [
    { town: "Ukunda", price: 400 }, { town: "Diani", price: 400 },
    { town: "Msambweni", price: 400 },
  ],
  Isiolo: [
    { town: "Isiolo Town", price: 500 }, { town: "Gedio", price: 500 },
    { town: "Kinna", price: 500 },
  ],
  Laikipia: [
    { town: "Nanyuki", price: 450 }, { town: "Rumuruti", price: 450 },
    { town: "Laikipia North", price: 450 },
  ],
  Marsabit: [
    { town: "Marsabit Town", price: 600 }, { town: "Moyale", price: 600 },
    { town: "Laisamis", price: 600 },
  ],
  Nyandarua: [
    { town: "Ol Kalou", price: 400 }, { town: "Engineer", price: 400 },
    { town: "Njabini", price: 400 },
  ],
  Muranga: [
    { town: "Murang'a Town", price: 400 }, { town: "Kangema", price: 400 },
    { town: "Kigumo", price: 400 },
  ],
  Kirinyaga: [
    { town: "Kerugoya", price: 400 }, { town: "Kutus", price: 400 },
    { town: "Sagana", price: 400 },
  ],
  Busia: [
    { town: "Busia Town", price: 400 }, { town: "Malaba", price: 400 },
    { town: "Port Victoria", price: 400 },
  ],
  Siaya: [
    { town: "Siaya Town", price: 400 }, { town: "Bondo", price: 400 },
    { town: "Ugunja", price: 400 },
  ],
  Vihiga: [
    { town: "Vihiga Town", price: 400 }, { town: "Mbale", price: 400 },
    { town: "Luanda", price: 400 },
  ],
  TharakaNithi: [
    { town: "Chuka", price: 400 }, { town: "Chogoria", price: 400 },
    { town: "Marimanti", price: 400 },
  ],
  Nyamira: [
    { town: "Nyamira Town", price: 400 }, { town: "Keroka", price: 400 },
    { town: "Ikonge", price: 400 },
  ],
  TanaRiver: [
    { town: "Hola", price: 500 }, { town: "Garsen", price: 500 },
    { town: "Bura", price: 500 },
  ],
  WestPokot: [
    { town: "Kapenguria", price: 450 }, { town: "Makutano", price: 450 },
    { town: "Chepareria", price: 450 },
  ],
  Samburu: [
    { town: "Maralal", price: 550 }, { town: "Baragoi", price: 550 },
    { town: "Wamba", price: 550 },
  ],
};

const Checkout = () => {
  const { user } = useUser();
  const { cartItems, totalItems, totalPrice, removeFromCart } = useCart();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [country] = useState("KE");
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [location, setLocation] = useState(null);

  const isDark = document.documentElement.classList.contains("dark");

  const getDeliveryFee = (addr) => {
    if (!addr) return 0;
    const lower = addr.toLowerCase();
    for (const county in deliveryRegions) {
      for (const townObj of deliveryRegions[county]) {
        if (lower.includes(townObj.town.toLowerCase())) return townObj.price;
      }
    }
    return 0;
  };

  useEffect(() => {
    if (wantsDelivery && address.trim() !== "") {
      setDeliveryFee(getDeliveryFee(address));
    } else {
      setDeliveryFee(0);
    }
  }, [address, wantsDelivery]);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDark ? "rgba(26,26,26,0.8)" : "rgba(255,255,255,0.8)",
      color: isDark ? "#f0f0f0" : "#1a1a1a",
      borderColor: "transparent",
      borderRadius: "10px",
      minHeight: "50px",
      boxShadow: state.isFocused ? "0 0 0 2px #111" : "none",
      backdropFilter: "blur(10px)",
      "&:hover": { borderColor: "transparent" },
    }),
    singleValue: (base) => ({ ...base, color: isDark ? "#f0f0f0" : "#1a1a1a" }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? "rgba(20,20,20,0.97)" : "rgba(255,255,255,0.97)",
      borderRadius: "12px",
      backdropFilter: "blur(20px)",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
      overflow: "hidden",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"
        : "transparent",
      color: isDark ? "#f0f0f0" : "#1a1a1a",
      cursor: "pointer",
      fontSize: "14px",
    }),
    placeholder: (base) => ({ ...base, color: isDark ? "#666" : "#aaa", fontSize: "14px" }),
    input: (base) => ({ ...base, color: isDark ? "#f0f0f0" : "#1a1a1a" }),
    dropdownIndicator: (base) => ({ ...base, color: isDark ? "#666" : "#aaa" }),
    indicatorSeparator: () => ({ display: "none" }),
  };

  const resolveImageUrl = (image) => {
    if (!image) return "/placeholder.png";
    if (image.startsWith("http") || image.startsWith("/")) return image;
    return `${API_BASE}/${image}`;
  };

  const renderCheckoutImage = (item) => {
    const imageSource = item.image || item.primaryImage;
    if (item.is_bundle && Array.isArray(item.bundle_products) && item.bundle_products.length >= 2) {
      const leftImage = item.bundle_products[0]?.variants?.[0]?.image || item.bundle_products[0]?.primaryImage;
      const rightImage = item.bundle_products[1]?.variants?.[0]?.image || item.bundle_products[1]?.primaryImage;
      if (leftImage && rightImage) {
        return (
          <div style={{ display: "flex", width: "100%", height: "100%" }}>
            <img src={resolveImageUrl(leftImage)} alt="Bundle 1" style={{ width: "50%", height: "100%", objectFit: "cover" }} />
            <img src={resolveImageUrl(rightImage)} alt="Bundle 2" style={{ width: "50%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      }
    }
    return <img src={resolveImageUrl(imageSource)} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6px" }} />;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!user) { toast.error("You need to be logged in to place an order."); setIsSubmitting(false); return; }
    if (!name || !phone || !email) { toast.error("Please fill in your name, phone, and email."); setIsSubmitting(false); return; }
    if (wantsDelivery && !address) { toast.error("Please select a delivery location."); setIsSubmitting(false); return; }
    if (cartItems.length === 0) { toast.error("Your cart is empty."); setIsSubmitting(false); return; }
    if (!phone.startsWith("+254")) { toast.info("Currently, M-Pesa payments are only available for Kenyan numbers."); setIsSubmitting(false); return; }
    const formattedPhone = phone.replace(/\D/g, "");
    try {
      const payload = {
        amount: totalPrice + deliveryFee,
        phoneNumber: formattedPhone,
        user_id: user.id,
        cartItems: cartItems.map((ci) => ({
          variant_id: ci.variant_id,
          quantity: ci.quantity,
          price: ci.price,
          title: ci.title || null,
          image: ci.image || null,
        })),
        deliveryFee,
        address,
      };
      const { data } = await axios.post(`${API_BASE}/api/mpesa/stkpush`, payload);
      if (data?.success) {
        toast.success("Confirm payment on your phone. Waiting for confirmation...");
        navigate("/pendingpayments", {
          state: { checkoutRequestID: data.checkoutRequestID, amount: totalPrice + deliveryFee, phone: formattedPhone },
        });
      } else {
        toast.error("Failed to initiate payment. Try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error.response?.data || error);
      toast.error("There was an issue starting the payment. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="checkout-page">
        <div className="checkout-container">

          {/* Breadcrumb */}
          <nav className="checkout-breadcrumb">
            <Link to="/" className="bc-link">Home</Link>
            <span className="bc-sep">›</span>
            <Link to="/cart" className="bc-link">Cart</Link>
            <span className="bc-sep">›</span>
            <span className="bc-current">Checkout</span>
          </nav>

          {/* Page title */}
          <div className="page-header">
            <Link to="/cart" className="back-link">
              <ArrowLeft size={16} />
              Back to Cart
            </Link>
            <h1 className="page-title">Checkout</h1>
            <div className="specs-rule" />
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <ShoppingCart size={44} strokeWidth={1.2} />
              </div>
              <h2 className="empty-title">Your cart is empty</h2>
              <p className="empty-sub">Add some items before checking out.</p>
              <Link to="/orders" className="empty-cta">
                <Receipt size={15} />
                View Order History
              </Link>
            </div>
          ) : (
            <div className="checkout-grid">

              {/* ── LEFT: Order Summary ── */}
              <div className="summary-panel">
                <div className="panel-header">
                  <Package size={18} />
                  <h2 className="panel-title">Order Summary</h2>
                </div>
                <div className="specs-rule-sm" />

                <div className="order-items">
                  {cartItems.map((item) => (
                    <div key={item.variant_id} className="order-item">
                      <div className="order-item-img">
                        {renderCheckoutImage(item)}
                        {item.is_bundle && <span className="bundle-badge">Bundle</span>}
                      </div>
                      <div className="order-item-info">
                        <h4 className="order-item-title">{item.title}</h4>
                        {(item.color || item.storage || item.ram) && (
                          <p className="order-item-meta">
                            {[item.color && `${item.color}`, item.storage && `${item.storage}`, item.ram && `${item.ram}`].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {item.product_code && <p className="order-item-sku">SKU: {item.product_code}</p>}
                        <div className="order-item-pricing">
                          <span className="order-item-unit">Ksh {parseFloat(item.price).toFixed(2)} × {item.quantity}</span>
                          <span className="order-item-total">Ksh {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        className="item-remove-btn"
                        onClick={() => removeFromCart(item.variant_id, item.title)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="order-totals">
                  <div className="total-row-sm">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</span>
                    <span>Ksh {totalPrice.toFixed(2)}</span>
                  </div>
                  {wantsDelivery && deliveryFee > 0 && (
                    <div className="total-row-sm delivery">
                      <span>
                        <Package size={13} style={{ display: "inline", marginRight: 4 }} />
                        Delivery
                      </span>
                      <span>Ksh {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {wantsDelivery && deliveryFee === 0 && address && (
                    <div className="total-row-sm delivery">
                      <span>Delivery</span>
                      <span className="tbd-text">To be confirmed</span>
                    </div>
                  )}
                  <div className="total-divider" />
                  <div className="total-row-grand">
                    <span>Total</span>
                    <span className="grand-amount">Ksh {(totalPrice + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Payment Form ── */}
              <div className="payment-panel">
                <div className="panel-header">
                  <CreditCard size={18} />
                  <h2 className="panel-title">Payment Details</h2>
                </div>
                <div className="specs-rule-sm" />

                <form onSubmit={handleCheckout} className="payment-form">

                  {/* Name */}
                  <div className="field-group">
                    <label className="field-label">
                      <User size={14} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Enter your full name"
                      className="field-input"
                    />
                  </div>

                  {/* Phone */}
                  <div className="field-group">
                    <label className="field-label">
                      <Phone size={14} />
                      Phone Number
                    </label>
                    <div className="phone-wrap">
                      <PhoneInput
                        international
                        defaultCountry={country}
                        value={phone}
                        onChange={(val) => setPhone(val || "")}
                        disabled={isSubmitting}
                        placeholder="e.g. +254712345678"
                      />
                    </div>
                    <p className="field-hint">Used for M-Pesa payment prompt &amp; order updates</p>
                  </div>

                  {/* Email */}
                  <div className="field-group">
                    <label className="field-label">
                      <Mail size={14} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="your@email.com"
                      className="field-input"
                    />
                  </div>

                  {/* Delivery toggle */}
                  <div className="delivery-toggle">
                    <label className="toggle-label">
                      <div className="toggle-track" onClick={() => setWantsDelivery(!wantsDelivery)}>
                        <div className={`toggle-thumb ${wantsDelivery ? "toggle-on" : ""}`} />
                      </div>
                      <span className="toggle-text">
                        <Package size={15} />
                        Deliver to my location
                      </span>
                    </label>
                  </div>

                  {/* Delivery location */}
                  {wantsDelivery && (
                    <div className="field-group">
                      <label className="field-label">
                        <MapPin size={14} />
                        Delivery Location
                      </label>
                      <Select
                        value={location}
                        onChange={(opt) => { setLocation(opt); setAddress(opt?.value || ""); }}
                        options={Object.keys(deliveryRegions).flatMap((county) =>
                          deliveryRegions[county].map((t) => ({
                            value: t.town,
                            label: `${t.town} — Ksh ${t.price}`,
                            group: county,
                          }))
                        )}
                        isDisabled={isSubmitting}
                        placeholder="Search your town..."
                        styles={selectStyles}
                        isSearchable
                      />
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={isSubmitting} className="pay-btn">
                    {isSubmitting ? (
                      <>
                        <div className="spinner" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Pay via M-Pesa · Ksh {(totalPrice + deliveryFee).toFixed(2)}
                        <ChevronRight size={18} style={{ marginLeft: "auto" }} />
                      </>
                    )}
                  </button>

                  {/* Edit cart */}
                  <Link to="/cart" className="edit-cart-btn">
                    <ArrowLeft size={15} />
                    Edit Cart
                  </Link>

                  {/* Security badge */}
                  <div className="security-badge">
                    <ShieldCheck size={14} />
                    <span>Secured by M-Pesa · Your payment is safe</span>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Serif+Display&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .checkout-page {
          min-height: 100vh;
          background: linear-gradient(135deg, rgba(248,248,248,0.9) 0%, rgba(240,240,245,0.9) 100%);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
        }

        .dark .checkout-page {
          background: linear-gradient(135deg, rgba(13,13,13,0.95) 0%, rgba(20,20,25,0.95) 100%);
          color: #f0f0f0;
        }

        .checkout-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* Breadcrumb */
        .checkout-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px 0 16px;
          font-size: 13px;
          color: #888;
        }
        .bc-sep { color: #ccc; }
        .bc-link { color: #888; text-decoration: none; transition: color 0.2s; }
        .bc-link:hover { color: #111; }
        .dark .bc-link:hover { color: #f0f0f0; }
        .bc-current { color: #1a1a1a; font-weight: 500; }
        .dark .bc-current { color: #f0f0f0; }

        /* Page header */
        .page-header { margin-bottom: 36px; }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #888;
          text-decoration: none;
          margin-bottom: 12px;
          transition: color 0.2s;
        }
        .back-link:hover { color: #111; }
        .dark .back-link:hover { color: #f0f0f0; }

        .page-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(28px, 5vw, 44px);
          font-weight: 400;
          letter-spacing: -0.02em;
          color: #0d0d0d;
          margin-bottom: 12px;
        }
        .dark .page-title { color: #f5f5f5; }

        .specs-rule {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, #111 0%, #555 100%);
          border-radius: 2px;
        }

        .specs-rule-sm {
          width: 36px;
          height: 2px;
          background: linear-gradient(90deg, #111 0%, #555 100%);
          border-radius: 2px;
          margin: 10px 0 20px;
        }

        /* Main grid */
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr; }
        }

        /* Panels */
        .summary-panel,
        .payment-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
          transition: all 0.3s ease;
          animation: panel-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }

        .payment-panel { animation-delay: 80ms; }

        @keyframes panel-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .summary-panel:hover,
        .payment-panel:hover {
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 8px 40px rgba(0,0,0,0.09);
        }

        .dark .summary-panel,
        .dark .payment-panel {
          background: rgba(26, 26, 26, 0.65);
          box-shadow: 0 2px 20px rgba(0,0,0,0.35);
        }

        .dark .summary-panel:hover,
        .dark .payment-panel:hover {
          background: rgba(40, 40, 40, 0.85);
          box-shadow: 0 8px 40px rgba(0,0,0,0.45);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #888;
        }

        .panel-title {
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          font-weight: 400;
          letter-spacing: -0.01em;
          color: #0d0d0d;
        }
        .dark .panel-title { color: #f0f0f0; }

        /* Order items */
        .order-items {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }

        .order-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 14px;
          background: rgba(0,0,0,0.03);
          border-radius: 12px;
          transition: background 0.2s;
        }

        .dark .order-item { background: rgba(255,255,255,0.04); }
        .order-item:hover { background: rgba(0,0,0,0.05); }
        .dark .order-item:hover { background: rgba(255,255,255,0.07); }

        .order-item-img {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(255,255,255,0.8);
        }
        .dark .order-item-img { background: rgba(30,30,30,0.8); }

        .bundle-badge {
          position: absolute;
          bottom: 3px;
          left: 3px;
          background: #111;
          color: #fff;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .order-item-info { flex: 1; min-width: 0; }

        .order-item-title {
          font-size: 14px;
          font-weight: 600;
          color: #0d0d0d;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .dark .order-item-title { color: #f0f0f0; }

        .order-item-meta {
          font-size: 11px;
          color: #888;
          margin-bottom: 2px;
        }

        .order-item-sku {
          font-size: 10px;
          color: #bbb;
          font-family: monospace;
          margin-bottom: 6px;
        }

        .order-item-pricing {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }

        .order-item-unit { font-size: 12px; color: #999; }

        .order-item-total {
          font-size: 14px;
          font-weight: 700;
          color: #0d0d0d;
          letter-spacing: -0.01em;
        }
        .dark .order-item-total { color: #fff; }

        .item-remove-btn {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .item-remove-btn:hover { color: #c8232c; background: #fff0f0; }
        .dark .item-remove-btn:hover { background: #2a1010; color: #ff6b6b; }

        /* Totals */
        .order-totals {
          border-top: 1px solid rgba(0,0,0,0.07);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .dark .order-totals { border-top-color: rgba(255,255,255,0.07); }

        .total-row-sm {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #777;
        }
        .dark .total-row-sm { color: #999; }

        .total-row-sm.delivery { color: #444; }
        .dark .total-row-sm.delivery { color: #ccc; }

        .tbd-text { font-size: 12px; color: #aaa; font-style: italic; }

        .total-divider {
          height: 1px;
          background: rgba(0,0,0,0.07);
        }
        .dark .total-divider { background: rgba(255,255,255,0.07); }

        .total-row-grand {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 15px;
          font-weight: 600;
          color: #0d0d0d;
        }
        .dark .total-row-grand { color: #f0f0f0; }

        .grand-amount {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #0d0d0d;
        }
        .dark .grand-amount { color: #fff; }

        /* Payment form */
        .payment-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #888;
        }

        .field-input {
          width: 100%;
          height: 50px;
          padding: 0 16px;
          background: rgba(0,0,0,0.04);
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1a1a1a;
          outline: none;
          transition: all 0.2s;
        }

        .dark .field-input {
          background: rgba(255,255,255,0.06);
          color: #f0f0f0;
        }

        .field-input:focus {
          background: rgba(0,0,0,0.06);
          box-shadow: 0 0 0 2px #111;
        }

        .dark .field-input:focus {
          background: rgba(255,255,255,0.09);
          box-shadow: 0 0 0 2px #444;
        }

        .field-input::placeholder { color: #bbb; }

        .field-input:disabled { opacity: 0.5; cursor: not-allowed; }

        .field-hint {
          font-size: 11px;
          color: #aaa;
          padding-left: 2px;
        }

        /* Phone input */
        .phone-wrap .PhoneInput {
          display: flex;
          align-items: center;
          background: rgba(0,0,0,0.04);
          border-radius: 10px;
          padding: 0 14px;
          height: 50px;
          gap: 10px;
          transition: all 0.2s;
        }

        .dark .phone-wrap .PhoneInput {
          background: rgba(255,255,255,0.06);
        }

        .phone-wrap .PhoneInput:focus-within {
          box-shadow: 0 0 0 2px #111;
        }

        .dark .phone-wrap .PhoneInput:focus-within {
          box-shadow: 0 0 0 2px #444;
        }

        .phone-wrap .PhoneInputInput {
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1a1a1a;
          flex: 1;
          height: 100%;
        }

        .dark .phone-wrap .PhoneInputInput { color: #f0f0f0; }
        .phone-wrap .PhoneInputInput::placeholder { color: #bbb; }

        .phone-wrap .PhoneInputCountrySelect {
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: #1a1a1a;
          cursor: pointer;
        }

        .dark .phone-wrap .PhoneInputCountrySelect { color: #f0f0f0; }

        /* Delivery toggle */
        .delivery-toggle { padding: 4px 0; }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }

        .toggle-track {
          width: 44px;
          height: 24px;
          background: rgba(0,0,0,0.12);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.25s;
          flex-shrink: 0;
        }

        .dark .toggle-track { background: rgba(255,255,255,0.12); }

        .toggle-thumb {
          width: 18px;
          height: 18px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }

        .toggle-on {
          transform: translateX(20px);
          background: #fff;
        }

        .toggle-track:has(.toggle-on) { background: #111; }
        .dark .toggle-track:has(.toggle-on) { background: #0bc268; }

        .toggle-text {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        .dark .toggle-text { color: #ccc; }

        /* Pay button */
        .pay-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 16px 20px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          margin-top: 4px;
        }

        .pay-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .pay-btn:hover {
          background: #000;
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.28);
        }

        .pay-btn:hover::before { opacity: 1; }
        .pay-btn:active { transform: translateY(0); }

        .pay-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .dark .pay-btn { background: #444; }
        .dark .pay-btn:hover { background: #333; box-shadow: 0 10px 28px rgba(80,80,80,0.35); }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Edit cart link */
        .edit-cart-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: 100%;
          padding: 13px 20px;
          background: rgba(0,0,0,0.05);
          color: #555;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }

        .edit-cart-btn:hover { background: rgba(0,0,0,0.1); color: #111; }
        .dark .edit-cart-btn { background: rgba(255,255,255,0.05); color: #aaa; }
        .dark .edit-cart-btn:hover { background: rgba(255,255,255,0.09); color: #f0f0f0; }

        /* Security badge */
        .security-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 11px;
          color: #aaa;
          padding-top: 4px;
        }
        .security-badge svg { color: #0bc268; }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
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
        .dark .empty-icon-wrap { background: rgba(26,26,26,0.7); color: #444; }

        .empty-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(22px, 4vw, 30px);
          font-weight: 400;
          color: #0d0d0d;
          letter-spacing: -0.02em;
        }
        .dark .empty-title { color: #f0f0f0; }

        .empty-sub { font-size: 14px; color: #888; max-width: 260px; }

        .empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 12px 24px;
          background: #111;
          color: #fff;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s;
        }
        .empty-cta:hover { background: #000; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .dark .empty-cta { background: #444; }
        .dark .empty-cta:hover { background: #333; }

        /* Responsive */
        @media (max-width: 600px) {
          .checkout-container { padding: 0 14px 60px; }
          .summary-panel, .payment-panel { padding: 20px; border-radius: 16px; }
          .order-item { padding: 10px; }
          .order-item-img { width: 60px; height: 60px; }
        }
      `}</style>
    </>
  );
};

export default Checkout;