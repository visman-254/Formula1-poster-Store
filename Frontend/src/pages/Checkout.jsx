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
      backgroundColor: "transparent",
      color: isDark ? "#f0f0f0" : "#1a1a1a",
      borderColor: "transparent",
      borderBottom: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.12)",
      borderRadius: 0,
      minHeight: "44px",
      boxShadow: "none",
      paddingLeft: 0,
      "&:hover": { borderColor: "transparent", borderBottom: "1px solid #111" },
    }),
    singleValue: (base) => ({ ...base, color: isDark ? "#f0f0f0" : "#1a1a1a", paddingLeft: 0 }),
    valueContainer: (base) => ({ ...base, paddingLeft: 0 }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? "#111" : "#fff",
      borderRadius: "10px",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      overflow: "hidden",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)") : "transparent",
      color: isDark ? "#f0f0f0" : "#1a1a1a",
      fontSize: "14px",
      cursor: "pointer",
    }),
    placeholder: (base) => ({ ...base, color: isDark ? "#555" : "#bbb", fontSize: "14px", paddingLeft: 0 }),
    input: (base) => ({ ...base, color: isDark ? "#f0f0f0" : "#1a1a1a", paddingLeft: 0 }),
    dropdownIndicator: (base) => ({ ...base, color: isDark ? "#555" : "#bbb" }),
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
      <div className="co-page">
        <div className="co-wrap">

          {/* Breadcrumb */}
          <nav className="breadcrumb">
            <Link to="/" className="bc-link">Home</Link>
            <span className="bc-sep">›</span>
            <Link to="/cart" className="bc-link">Cart</Link>
            <span className="bc-sep">›</span>
            <span className="bc-current">Checkout</span>
          </nav>

          <Link to="/cart" className="back-link">
            <ArrowLeft size={14} /> Back to Cart
          </Link>

          <h1 className="page-title">Checkout</h1>
          <div className="title-rule" />

          {cartItems.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={52} strokeWidth={1} className="empty-icon" />
              <h2 className="empty-title">Your cart is empty</h2>
              <p className="empty-sub">Add some items before checking out.</p>
              <Link to="/orders" className="cta-btn">
                <Receipt size={14} /> View Order History
              </Link>
            </div>
          ) : (
            <div className="co-grid">

              {/* ── LEFT: Order Summary ── */}
              <div className="summary-col">
                <h2 className="section-title">Order Summary</h2>
                <div className="section-rule" />

                <div className="order-items">
                  {cartItems.map((item) => (
                    <div key={item.variant_id} className="order-row">
                      <div className="order-img">
                        {renderCheckoutImage(item)}
                      </div>
                      <div className="order-info">
                        <h4 className="order-title">{item.title}</h4>
                        {(item.color || item.storage || item.ram) && (
                          <p className="order-meta">
                            {[item.color, item.storage, item.ram].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {item.product_code && <p className="order-sku">SKU: {item.product_code}</p>}
                        <div className="order-pricing">
                          <span className="order-unit">Ksh {parseFloat(item.price).toFixed(2)} × {item.quantity}</span>
                          <span className="order-line">Ksh {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                        </div>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.variant_id, item.title)} aria-label="Remove">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="totals">
                  <div className="totals-row">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</span>
                    <span>Ksh {totalPrice.toFixed(2)}</span>
                  </div>
                  {wantsDelivery && deliveryFee > 0 && (
                    <div className="totals-row">
                      <span>Delivery</span>
                      <span>Ksh {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {wantsDelivery && deliveryFee === 0 && address && (
                    <div className="totals-row">
                      <span>Delivery</span>
                      <span className="italic-muted">To be confirmed</span>
                    </div>
                  )}
                  <div className="totals-divider" />
                  <div className="totals-row grand">
                    <span>Total</span>
                    <span className="grand-amount">Ksh {(totalPrice + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Payment Form ── */}
              <div className="payment-col">
                <h2 className="section-title">Payment Details</h2>
                <div className="section-rule" />

                <form onSubmit={handleCheckout} className="pay-form">

                  <div className="field">
                    <label className="field-label"><User size={13} /> Full Name</label>
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

                  <div className="field">
                    <label className="field-label"><Phone size={13} /> Phone Number</label>
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

                  <div className="field">
                    <label className="field-label"><Mail size={13} /> Email Address</label>
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

                  <div className="delivery-toggle" onClick={() => setWantsDelivery(!wantsDelivery)}>
                    <div className="toggle-track">
                      <div className={`toggle-thumb ${wantsDelivery ? "on" : ""}`} />
                    </div>
                    <span className="toggle-text"><Package size={14} /> Deliver to my location</span>
                  </div>

                  {wantsDelivery && (
                    <div className="field">
                      <label className="field-label"><MapPin size={13} /> Delivery Location</label>
                      <Select
                        value={location}
                        onChange={(opt) => { setLocation(opt); setAddress(opt?.value || ""); }}
                        options={Object.keys(deliveryRegions).flatMap((county) =>
                          deliveryRegions[county].map((t) => ({
                            value: t.town,
                            label: `${t.town} — Ksh ${t.price}`,
                          }))
                        )}
                        isDisabled={isSubmitting}
                        placeholder="Search your town..."
                        styles={selectStyles}
                        isSearchable
                      />
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting} className="pay-btn">
                    {isSubmitting ? (
                      <><div className="spinner" /> Processing...</>
                    ) : (
                      <>
                        <CreditCard size={17} />
                        Pay via M-Pesa · Ksh {(totalPrice + deliveryFee).toFixed(2)}
                        <ChevronRight size={17} style={{ marginLeft: "auto" }} />
                      </>
                    )}
                  </button>

                  <Link to="/cart" className="edit-btn">
                    <ArrowLeft size={14} /> Edit Cart
                  </Link>

                  <div className="secure-note">
                    <ShieldCheck size={13} />
                    <span>Secured by M-Pesa · Your payment is safe</span>
                  </div>

                </form>
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{css}</style>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display&display=swap');

  .co-page {
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
    padding-bottom: 80px;
  }
  .dark .co-page { color: #f0f0f0; }

  .co-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .breadcrumb {
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

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #888;
    text-decoration: none;
    margin-bottom: 20px;
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
    margin-bottom: 14px;
  }
  .dark .page-title { color: #f5f5f5; }

  .title-rule {
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, #111 0%, #555 100%);
    border-radius: 2px;
    margin-bottom: 44px;
  }

  .co-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 72px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .co-grid { grid-template-columns: 1fr; gap: 52px; }
  }

  /* Section titles */
  .section-title {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    font-weight: 400;
    color: #0d0d0d;
    letter-spacing: -0.01em;
    margin-bottom: 10px;
  }
  .dark .section-title { color: #f0f0f0; }

  .section-rule {
    width: 36px;
    height: 2px;
    background: linear-gradient(90deg, #111 0%, #555 100%);
    border-radius: 2px;
    margin-bottom: 24px;
  }

  /* Order rows */
  .order-items { display: flex; flex-direction: column; }

  .order-row {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px 0;
    border-bottom: 1px solid rgba(0,0,0,0.07);
  }
  .dark .order-row { border-bottom-color: rgba(255,255,255,0.06); }
  .order-row:first-child { border-top: 1px solid rgba(0,0,0,0.07); }
  .dark .order-row:first-child { border-top-color: rgba(255,255,255,0.06); }

  .order-img {
    width: 72px;
    height: 72px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(0,0,0,0.04);
  }
  .dark .order-img { background: rgba(255,255,255,0.05); }

  .order-info { flex: 1; min-width: 0; }

  .order-title {
    font-size: 14px;
    font-weight: 600;
    color: #0d0d0d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }
  .dark .order-title { color: #f0f0f0; }

  .order-meta { font-size: 11px; color: #999; margin-bottom: 2px; }
  .order-sku { font-size: 10px; color: #ccc; font-family: monospace; margin-bottom: 6px; }

  .order-pricing { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px; }
  .order-unit { font-size: 12px; color: #aaa; }
  .order-line { font-size: 14px; font-weight: 700; color: #0d0d0d; }
  .dark .order-line { color: #fff; }

  .remove-btn {
    background: none; border: none; color: #ccc;
    cursor: pointer; padding: 4px; border-radius: 6px;
    display: flex; align-items: center; transition: color 0.2s; flex-shrink: 0;
  }
  .remove-btn:hover { color: #c8232c; }

  /* Totals */
  .totals {
    border-top: 1px solid rgba(0,0,0,0.07);
    padding-top: 16px;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dark .totals { border-top-color: rgba(255,255,255,0.06); }

  .totals-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #777;
  }
  .dark .totals-row { color: #999; }

  .italic-muted { font-style: italic; color: #bbb; font-size: 12px; }

  .totals-divider { height: 1px; background: rgba(0,0,0,0.08); }
  .dark .totals-divider { background: rgba(255,255,255,0.07); }

  .totals-row.grand { font-size: 15px; font-weight: 600; color: #0d0d0d; margin-top: 2px; }
  .dark .totals-row.grand { color: #f0f0f0; }
  .grand-amount { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }

  /* Form */
  .pay-form { display: flex; flex-direction: column; gap: 24px; }

  .field { display: flex; flex-direction: column; gap: 8px; }

  .field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #888;
  }

  .field-input {
    width: 100%;
    padding: 10px 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(0,0,0,0.12);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #1a1a1a;
    outline: none;
    transition: border-color 0.2s;
  }
  .dark .field-input {
    color: #f0f0f0;
    border-bottom-color: rgba(255,255,255,0.15);
  }
  .field-input:focus { border-bottom-color: #111; }
  .dark .field-input:focus { border-bottom-color: #888; }
  .field-input::placeholder { color: #bbb; }
  .field-input:disabled { opacity: 0.4; cursor: not-allowed; }

  .field-hint { font-size: 11px; color: #bbb; }

  /* Phone input */
  .phone-wrap .PhoneInput {
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid rgba(0,0,0,0.12);
    padding: 10px 0;
    transition: border-color 0.2s;
  }
  .dark .phone-wrap .PhoneInput { border-bottom-color: rgba(255,255,255,0.15); }
  .phone-wrap .PhoneInput:focus-within { border-bottom-color: #111; }
  .dark .phone-wrap .PhoneInput:focus-within { border-bottom-color: #888; }

  .phone-wrap .PhoneInputInput {
    background: transparent; border: none; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 15px;
    color: #1a1a1a; flex: 1;
  }
  .dark .phone-wrap .PhoneInputInput { color: #f0f0f0; }
  .phone-wrap .PhoneInputInput::placeholder { color: #bbb; }

  .phone-wrap .PhoneInputCountrySelect {
    background: transparent; border: none; outline: none;
    font-size: 14px; color: #1a1a1a; cursor: pointer;
  }
  .dark .phone-wrap .PhoneInputCountrySelect { color: #f0f0f0; }

  /* Delivery toggle */
  .delivery-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    user-select: none;
    padding: 4px 0;
  }

  .toggle-track {
    width: 40px; height: 22px;
    background: rgba(0,0,0,0.1);
    border-radius: 11px;
    position: relative;
    transition: background 0.25s;
    flex-shrink: 0;
  }
  .dark .toggle-track { background: rgba(255,255,255,0.1); }

  .toggle-thumb {
    width: 16px; height: 16px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 3px; left: 3px;
    transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .toggle-thumb.on {
    transform: translateX(18px);
    background: #fff;
  }
  .toggle-track:has(.on) { background: #111; }
  .dark .toggle-track:has(.on) { background: #0bc268; }

  .toggle-text {
    display: flex; align-items: center; gap: 7px;
    font-size: 14px; font-weight: 500; color: #444;
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
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: all 0.25s ease;
    margin-top: 8px;
  }
  .pay-btn:hover { background: #000; transform: translateY(-1px); box-shadow: 0 10px 28px rgba(0,0,0,0.2); }
  .pay-btn:active { transform: translateY(0); }
  .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  .dark .pay-btn { background: #333; }
  .dark .pay-btn:hover { background: #444; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .edit-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 6px;
    font-size: 13px; font-weight: 500;
    color: #888; text-decoration: none;
    transition: color 0.2s;
    text-align: center;
  }
  .edit-btn:hover { color: #111; }
  .dark .edit-btn:hover { color: #f0f0f0; }

  .secure-note {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; font-size: 11px; color: #bbb;
  }
  .secure-note svg { color: #0bc268; }

  /* CTA button */
  .cta-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 22px;
    background: #111; color: #fff;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600;
    text-decoration: none;
    transition: all 0.25s ease;
    margin-top: 8px;
  }
  .cta-btn:hover { background: #000; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.18); }
  .dark .cta-btn { background: #333; }

  /* Empty state */
  .empty-state {
    display: flex; flex-direction: column;
    align-items: flex-start; justify-content: center;
    min-height: 50vh; gap: 14px; padding: 40px 0;
  }
  .empty-icon { color: #ddd; margin-bottom: 4px; }
  .dark .empty-icon { color: #333; }
  .empty-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(22px, 4vw, 32px);
    font-weight: 400; color: #0d0d0d; letter-spacing: -0.02em;
  }
  .dark .empty-title { color: #f0f0f0; }
  .empty-sub { font-size: 14px; color: #888; }

  @media (max-width: 600px) {
    .co-wrap { padding: 0 16px; }
    .co-grid { gap: 40px; }
  }
`;

export default Checkout;