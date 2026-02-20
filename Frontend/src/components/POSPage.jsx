// src/components/POSPage.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, X, User, Settings, LogOut, Menu, Table, Grid,
  ShoppingCart, Upload, Image, ScanBarcode, Plus, ChevronDown, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import POSReceipt from './POSReceipt';
import GlassmorphicContainer from './GlassmorphicContainer';
import BarcodeScanner from './BarcodeScanner';
import './POSPage.css';
import API_BASE from '../config';
import { getWallpaper, updateWallpaper, deleteWallpaper } from '../api/adminSettings';
import elegantwaterBg from '../assets/elegantwater.jpg';
import logoDark from '../assets/pmc2.png';

// Inject fonts once
if (typeof document !== 'undefined' && !document.getElementById('pos-fonts')) {
  const link = document.createElement('link');
  link.id = 'pos-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap';
  document.head.appendChild(link);
}

const API_URL_BASE = `${API_BASE}/api`;

const POSPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // ── Core state ───────────────────────────────────────────────
  const [products, setProducts]               = useState([]);
  const [cart, setCart]                       = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');
  const [showReceipt, setShowReceipt]         = useState(false);
  const [receiptData, setReceiptData]         = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod]     = useState('cash');
  const [error, setError]                     = useState('');
  const [showMpesaModal, setShowMpesaModal]   = useState(false);
  const [mpesaPhone, setMpesaPhone]           = useState('');
  const [mpesaModalError, setMpesaModalError] = useState('');
  const [selectedVariants, setSelectedVariants] = useState({});
  const [user, setUser]                       = useState(null);
  const [viewMode, setViewMode]               = useState('table');
  const [posMode, setPosMode]                 = useState('products');
  const [posBackground, setPosBackground]     = useState(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(true);

  // ── Mobile UI state ──────────────────────────────────────────
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen]       = useState(false);
  const isMobile = () => window.innerWidth <= 768;

  // ── IMEI state ───────────────────────────────────────────────
  const [imeiInputs, setImeiInputs]     = useState({});
  const imeiInputsRef                   = useRef({});
  const [scanImeiInput, setScanImeiInput] = useState('');
  const [scanLoading, setScanLoading]   = useState(false);
  const [scanError, setScanError]       = useState('');
  const scanImeiRef                     = useRef('');
  const [showScanner, setShowScanner]   = useState(false);

  // ── Polling state ────────────────────────────────────────────
  const [isPolling, setIsPolling]             = useState(false);
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState(null);
  const pollingIntervalRef                    = useRef(null);
  const debounceTimerRef                      = useRef({});
  const validationReqIdRef                    = useRef(0);
  const latestValidationVariantRef            = useRef(null);

  // ── Load user ────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  // ── Load wallpaper ───────────────────────────────────────────
  useEffect(() => {
    getWallpaper()
      .then(r => { if (r.success && r.wallpaper) setPosBackground(`${API_BASE}/${r.wallpaper}`); })
      .catch(() => {});
  }, []);

  // ── Wallpaper upload / reset ─────────────────────────────────
  const handleWallpaperUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const r = await updateWallpaper(file);
      if (r.success) { setPosBackground(`${API_BASE}/${r.wallpaper}`); toast.success('Wallpaper updated'); }
    } catch { toast.error('Failed to update wallpaper'); }
  };

  const handleWallpaperReset = async () => {
    try { await deleteWallpaper(); setPosBackground(null); toast.success('Wallpaper reset'); }
    catch { toast.error('Failed to reset wallpaper'); }
  };

  // ── Reset sale ───────────────────────────────────────────────
  const resetSale = () => {
    setCart([]); setImeiInputs({}); imeiInputsRef.current = {};
    setMpesaPhone(''); setError(''); setCheckoutLoading(false);
    setShowReceipt(false); setReceiptData(null);
    setIsPolling(false); setMpesaCheckoutId(null);
    setScanImeiInput(''); setScanError('');
    if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }
  };

  // ── Fetch products ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_URL_BASE}/pos/products`, { headers: { Authorization: `Bearer ${token}` } });
        setProducts(data);
      } catch { setError('Failed to load products'); }
      finally { setLoading(false); }
    })();
  }, [token]);

  // ── M-Pesa polling ───────────────────────────────────────────
  useEffect(() => {
    if (!isPolling || !mpesaCheckoutId) return;
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(
          `${API_URL_BASE}/pos/payment-status/${encodeURIComponent(mpesaCheckoutId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.status === 'paid' && data.receipt) {
          setReceiptData(data.receipt); setShowReceipt(true); setCart([]);
          setImeiInputs({}); imeiInputsRef.current = {}; setMpesaPhone('');
          setError(''); setCheckoutLoading(false); setIsPolling(false); setMpesaCheckoutId(null);
          clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null;
        } else if (['failed','cancelled','not_found','paid_but_order_failed'].includes(data.status)) {
          setError(`Payment failed. Status: ${data.status}`); setCheckoutLoading(false);
          setIsPolling(false); setMpesaCheckoutId(null);
          clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null;
        }
      } catch (err) {
        if (err.code === 'ERR_NETWORK' || !err.response) return;
        setError('Error checking payment status.'); setCheckoutLoading(false);
        setIsPolling(false); setMpesaCheckoutId(null);
        clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null;
      }
    }, 3000);
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); };
  }, [isPolling, mpesaCheckoutId, token]);

  // ── Manage body scroll when mobile cart opens ─────────────────
  useEffect(() => {
    if (mobileCartOpen) {
      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
    };
  }, [mobileCartOpen]);

  // ── Helpers ──────────────────────────────────────────────────
  const getProductImage = (product) => {
    const fallback = '/images/poster1.jpg';
    if (!product) return fallback;
    const url = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `${API_BASE}/${path.replace(/\\/g, '/')}`;
    };
    if (product.is_bundle && product.bundleImages?.[0]) return url(product.bundleImages[0]) || fallback;
    const variant = product.variants?.[0];
    if (variant?.image) return url(variant.image) || fallback;
    if (product.images?.[0]) return url(product.images[0]?.image_url || product.images[0]) || fallback;
    if (product.primaryImage) return url(product.primaryImage) || fallback;
    return fallback;
  };

  const getVariantImg = (variant, product) => {
    if (variant?.image) return variant.image.startsWith('http') ? variant.image : `${API_BASE}/${variant.image}`;
    return getProductImage(product);
  };

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const getSelectedVariant = (product) => {
    const id = selectedVariants[product.product_id];
    return (id ? product.variants.find(v => v.variant_id === id) : null) || product.variants?.[0];
  };

  const handleVariantSelect = (productId, variantId) =>
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));

  // ── IMEI validation ──────────────────────────────────────────
  const validateImei = useCallback(async (imeiValue, variantId, productId) => {
    if (!imeiValue || imeiValue.trim().length < 5) return { valid: false, error: 'IMEI too short' };
    const requestId = ++validationReqIdRef.current;
    latestValidationVariantRef.current = variantId;
    try {
      const { data } = await axios.post(
        `${API_URL_BASE}/imei/validate?_=${Date.now()}`,
        { imeiNumber: imeiValue.trim(), variantId, productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (latestValidationVariantRef.current !== variantId || validationReqIdRef.current !== requestId) return { valid: null, status: 'stale' };
      if (!data.valid) return { valid: false, status: data.status || 'error', error: data.error || 'IMEI validation failed' };
      if (data.warning) return { valid: true, status: data.status || 'available', warning: data.warning, error: null };
      return { valid: true, status: data.status || 'new', error: null };
    } catch (err) {
      if (latestValidationVariantRef.current !== variantId) return { valid: null, status: 'stale' };
      const d = err.response?.data;
      if (d?.status === 'used')         return { valid: false, status: 'used',         error: 'IMEI already used' };
      if (d?.status === 'reserved')     return { valid: false, status: 'reserved',     error: 'IMEI is reserved' };
      if (d?.status === 'not_found')    return { valid: false, status: 'not_found',    error: d?.error || 'IMEI not found' };
      if (d?.status === 'wrong_product') return { valid: false, status: 'wrong_product', error: d?.error || 'IMEI belongs to different product' };
      if (d?.status === 'wrong_variant') return { valid: false, status: 'wrong_variant', error: d?.error || 'IMEI belongs to different variant' };
      return { valid: false, status: 'error', error: 'Failed to validate IMEI' };
    }
  }, [token]);

  const handleImeiChange = (variantId, rawValue) => {
    imeiInputsRef.current[variantId] = rawValue;
    setImeiInputs(prev => ({ ...prev, [variantId]: rawValue }));
    if (debounceTimerRef.current[variantId]) clearTimeout(debounceTimerRef.current[variantId]);
    const cartItem = cart.find(i => i.variant_id === variantId);
    if (!cartItem) return;
    const cleaned = rawValue.replace(/[\r\n\t\x00-\x1F]/g, '');
    if (!cleaned) {
      setCart(prev => prev.map(i => i.variant_id === variantId ? { ...i, imei: '', imeiValid: null, imeiError: null, imeiWarning: null } : i));
      return;
    }
    setCart(prev => prev.map(i => i.variant_id === variantId ? { ...i, imei: cleaned, imeiValid: null, imeiError: null, imeiWarning: null } : i));
    debounceTimerRef.current[variantId] = setTimeout(async () => {
      const imei = (imeiInputsRef.current[variantId] || '').replace(/[\r\n\t\x00-\x1F]/g, '');
      const result = await validateImei(imei, variantId, cartItem.product_id);
      if (result.status === 'stale') return;
      setCart(prev => prev.map(i => i.variant_id === variantId
        ? { ...i, imei, imeiValid: result.valid ? 'valid' : 'invalid', imeiError: result.error || null, imeiWarning: result.warning || null }
        : i
      ));
      if (result.valid) { if (result.warning) toast.warning(result.warning); else toast.success('IMEI valid'); }
      else if (result.error) toast.error(result.error);
    }, 500);
  };

  const autoFillImei = async (variantId) => {
    try {
      const { data } = await axios.post(`${API_URL_BASE}/imei/auto-assign`, { variantId, orderId: 0 }, { headers: { Authorization: `Bearer ${token}` } });
      if (data.imei) {
        imeiInputsRef.current[variantId] = data.imei;
        setImeiInputs(prev => ({ ...prev, [variantId]: data.imei }));
        setCart(prev => prev.map(i => i.variant_id === variantId ? { ...i, imei: data.imei, imeiId: data.imeiId, imeiValid: 'valid', imeiError: null } : i));
        toast.success(`IMEI auto-filled: ${data.imei}`);
      }
    } catch { console.error('Auto-fill failed'); }
  };

  // ── Handle barcode scan from camera ─────────────────────────────
  const handleBarcodeScan = useCallback((scannedText) => {
    if (!scannedText) return;
    // Clean and set the scanned value
    const cleaned = scannedText.replace(/[\r\n\t\x00-\x1F]/g, '').trim();
    if (!cleaned) return;
    
    scanImeiRef.current = cleaned;
    setScanImeiInput(cleaned);
    setScanError('');
    setShowScanner(false);
    
    // Trigger the add to cart process directly (inline logic)
    if (debounceTimerRef.current['scan']) clearTimeout(debounceTimerRef.current['scan']);
    debounceTimerRef.current['scan'] = setTimeout(async () => {
      const imei = cleaned.replace(/[\r\n\t\x00-\x1F]/g, '').trim();
      if (!imei) return;
      setScanLoading(true); setScanError('');
      try {
        const { data } = await axios.post(`${API_URL_BASE}/imei/validate`, { imeiNumber: imei }, { headers: { Authorization: `Bearer ${token}` } });
        if (!data.valid) { setScanError(data.error || 'IMEI validation failed'); setScanLoading(false); return; }
        const { data: allProducts } = await axios.get(`${API_URL_BASE}/pos/products`, { headers: { Authorization: `Bearer ${token}` } });
        const product = allProducts.find(p => p.product_id === data.product_id);
        if (!product) { setScanError('Product not found for this IMEI'); setScanLoading(false); return; }
        const variant = product.variants?.find(v => v.variant_id === data.variant_id) || product.variants?.[0];
        if (!variant || variant.stock <= 0) { setScanError('Product out of stock'); setScanLoading(false); return; }
        if (cart.find(i => i.variant_id === variant.variant_id && i.imei === imei)) { setScanError('IMEI already in cart'); setScanLoading(false); return; }
        setCart(prev => [...prev, {
          variant_id: variant.variant_id, product_id: product.product_id,
          title: product.title, variantColor: variant.color || variant.name || null,
          price: variant.price, image: getVariantImg(variant, product),
          quantity: 1, stock: variant.stock,
          imei, imeiId: data.imeiId || null, imeiValid: 'valid', imeiError: null, imeiWarning: null,
        }]);
        setImeiInputs(prev => ({ ...prev, [variant.variant_id]: imei }));
        imeiInputsRef.current[variant.variant_id] = imei;
        setScanImeiInput(''); scanImeiRef.current = '';
        toast.success(`Added: ${product.title}`);
      } catch (err) {
        const d = err.response?.data;
        setScanError(d?.status === 'used' ? 'IMEI already used' : d?.status === 'reserved' ? 'IMEI is reserved' : d?.status === 'not_found' ? 'IMEI not found' : d?.error || 'Failed to scan IMEI');
      } finally { setScanLoading(false); }
    }, 500);
  }, [token, cart]);

  // ── Scan IMEI to add ─────────────────────────────────────────
  const handleScanImeiToCart = async (e) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current['scan']) clearTimeout(debounceTimerRef.current['scan']);
    const cleanedImei = (scanImeiRef.current || '').replace(/[\r\n\t\x00-\x1F]/g, '');
    if (!cleanedImei) { setScanError('Please enter a valid IMEI'); return; }
    debounceTimerRef.current['scan'] = setTimeout(async () => {
      const imei = scanImeiRef.current.replace(/[\r\n\t\x00-\x1F]/g, '').trim();
      if (!imei) return;
      setScanLoading(true); setScanError('');
      try {
        const { data } = await axios.post(`${API_URL_BASE}/imei/validate`, { imeiNumber: imei }, { headers: { Authorization: `Bearer ${token}` } });
        if (!data.valid) { setScanError(data.error || 'IMEI validation failed'); setScanLoading(false); return; }
        const { data: allProducts } = await axios.get(`${API_URL_BASE}/pos/products`, { headers: { Authorization: `Bearer ${token}` } });
        const product = allProducts.find(p => p.product_id === data.product_id);
        if (!product) { setScanError('Product not found for this IMEI'); setScanLoading(false); return; }
        const variant = product.variants?.find(v => v.variant_id === data.variant_id) || product.variants?.[0];
        if (!variant || variant.stock <= 0) { setScanError('Product out of stock'); setScanLoading(false); return; }
        if (cart.find(i => i.variant_id === variant.variant_id && i.imei === imei)) { setScanError('IMEI already in cart'); setScanLoading(false); return; }
        setCart(prev => [...prev, {
          variant_id: variant.variant_id, product_id: product.product_id,
          title: product.title, variantColor: variant.color || variant.name || null,
          price: variant.price, image: getVariantImg(variant, product),
          quantity: 1, stock: variant.stock,
          imei, imeiId: data.imeiId || null, imeiValid: 'valid', imeiError: null, imeiWarning: null,
        }]);
        setImeiInputs(prev => ({ ...prev, [variant.variant_id]: imei }));
        imeiInputsRef.current[variant.variant_id] = imei;
        setScanImeiInput(''); scanImeiRef.current = '';
        toast.success(`Added: ${product.title}`);
      } catch (err) {
        const d = err.response?.data;
        setScanError(d?.status === 'used' ? 'IMEI already used' : d?.status === 'reserved' ? 'IMEI is reserved' : d?.status === 'not_found' ? 'IMEI not found' : d?.error || 'Failed to scan IMEI');
      } finally { setScanLoading(false); }
    }, 500);
  };

  // ── Add to cart ──────────────────────────────────────────────
  const addToCart = (product) => {
    const variant = getSelectedVariant(product);
    if (!variant || variant.stock <= 0) { setError('Product out of stock'); return; }
    const existing = cart.find(i => i.variant_id === variant.variant_id);
    if (existing) {
      if (existing.quantity >= variant.stock) { setError('Insufficient stock'); return; }
      updateQuantity(variant.variant_id, existing.quantity + 1);
    } else {
      setCart(prev => [...prev, {
        variant_id: variant.variant_id, product_id: product.product_id,
        title: product.title, variantColor: variant.color || variant.name || null,
        price: variant.price, image: getVariantImg(variant, product),
        quantity: 1, stock: variant.stock,
        imei: '', imeiId: null, imeiValid: null, imeiError: null, imeiWarning: null,
      }]);
      setImeiInputs(prev => ({ ...prev, [variant.variant_id]: '' }));
      imeiInputsRef.current[variant.variant_id] = '';
      toast.info('Scan IMEI for this product');
    }
  };

  const updateQuantity = (variantId, qty) => {
    if (qty <= 0) return removeFromCart(variantId);
    const item = cart.find(i => i.variant_id === variantId);
    if (item && qty > item.stock) return setError('Insufficient stock');
    setCart(prev => prev.map(i => i.variant_id === variantId ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (variantId) => {
    setCart(prev => prev.filter(i => i.variant_id !== variantId));
    setImeiInputs(prev => { const n = { ...prev }; delete n[variantId]; return n; });
    delete imeiInputsRef.current[variantId];
    if (debounceTimerRef.current[variantId]) { clearTimeout(debounceTimerRef.current[variantId]); delete debounceTimerRef.current[variantId]; }
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const allImeisValid = cart.length > 0 && cart.every(i => i.imeiValid === 'valid');
  const pendingImeis = cart.filter(i => !i.imei || i.imeiValid !== 'valid');

  // ── Checkout ─────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!cart.length) return setError('Cart is empty');
    setError('');
    if (paymentMethod === 'mpesa') { setShowMpesaModal(true); setMpesaModalError(''); }
    else await processCheckout();
  };

  const handleMpesaSubmit = async () => {
    if (!mpesaPhone.trim() || !/^\d{10,}$/.test(mpesaPhone.replace(/\D/g, ''))) return setMpesaModalError('Enter a valid phone number');
    setShowMpesaModal(false);
    await initiateMpesa();
  };

  const processCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data } = await axios.post(`${API_URL_BASE}/pos/checkout`, { cartItems: cart, total: total.toFixed(2), payment_method: paymentMethod }, { headers: { Authorization: `Bearer ${token}` } });
      setReceiptData(data.receipt); setShowReceipt(true); setCart([]); setImeiInputs({}); imeiInputsRef.current = {};
      setMpesaPhone(''); setError(''); setCheckoutLoading(false); toast.success('Checkout successful!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Checkout failed';
      setError(msg); toast.error(msg); setCheckoutLoading(false);
    }
  };

  const initiateMpesa = async () => {
    setCheckoutLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API_URL_BASE}/pos/checkout`, { cartItems: cart, total: total.toFixed(2), payment_method: 'mpesa', phone_number: mpesaPhone }, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success && data.checkoutRequestID) {
        setMpesaCheckoutId(data.checkoutRequestID); setIsPolling(true);
        toast.success('M-Pesa initiated. Check your phone.');
      } else { throw new Error('No Checkout ID received'); }
    } catch (err) {
      const msg = err.response?.data?.message || 'M-Pesa initiation failed';
      setError(msg); toast.error(msg); setCheckoutLoading(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  if (!token) { navigate('/login'); return null; }
  if (showReceipt && receiptData) {
    return <POSReceipt receipt={receiptData} onNewSale={() => { setShowReceipt(false); setReceiptData(null); }} />;
  }

  const backgroundImage = posBackground || elegantwaterBg;

  // ── Shared cart content ──────────────────────────────────────
  const CartContent = () => (
    <>
      {cart.length === 0 ? (
        <div className="cart-empty">
          <ShoppingCart size={40} />
          <p>Cart is empty</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Add products to get started</p>
        </div>
      ) : (
        <>
          <div className="cart-items-scroll">
            {cart.map(item => {
              const imeiVal = imeiInputs[item.variant_id] ?? item.imei ?? '';
              return (
                <div key={item.variant_id} className="cart-item">
                  <div className="cart-item-top">
                    <div className="cart-item-info">
                      <p className="cart-item-name">{item.title}</p>
                      {item.variantColor && <p className="cart-item-variant">{item.variantColor}</p>}
                      <p className="cart-item-price">Ksh {item.price.toLocaleString()}</p>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}>−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}>+</button>
                    </div>
                  </div>

                  <div className="imei-input-wrap">
                    <input
                      type="text"
                      className={`imei-input ${item.imeiValid === 'valid' ? 'valid' : item.imeiValid === 'invalid' ? 'invalid' : ''}`}
                      placeholder="Scan IMEI / Serial Number"
                      value={imeiVal}
                      onChange={e => handleImeiChange(item.variant_id, e.target.value)}
                      autoComplete="off"
                    />
                    {!item.imei && <p className="imei-hint warn">⚠ Scan IMEI to enable checkout</p>}
                    {item.imeiError && <p className="imei-hint error">{item.imeiError}</p>}
                    {!item.imei && (
                      <button className="imei-autofill-btn" onClick={() => autoFillImei(item.variant_id)}>
                        Auto-fill IMEI
                      </button>
                    )}
                  </div>

                  <button className="btn btn-danger btn-sm btn-full" style={{ marginTop: 8 }} onClick={() => removeFromCart(item.variant_id)}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">Ksh {total.toLocaleString()}</span>
            </div>
            <div className="payment-pills">
              {['cash', 'mpesa'].map(m => (
                <button key={m} className={`payment-pill ${paymentMethod === m ? 'active' : ''}`} onClick={() => setPaymentMethod(m)}>
                  {m === 'cash' ? 'Cash' : 'M-Pesa'}
                </button>
              ))}
            </div>
            <button
              className="btn btn-green btn-lg btn-full"
              onClick={handleCheckout}
              disabled={checkoutLoading || isPolling || !allImeisValid}
            >
              {checkoutLoading ? 'Processing…' : !allImeisValid ? `Scan IMEIs (${pendingImeis.length} pending)` : 'Checkout'}
            </button>
          </div>
        </>
      )}
    </>
  );

  // ── Table view ───────────────────────────────────────────────
  const TableView = () => (
    <div className="pos-table-wrap">
      <table className="pos-table">
        <thead>
          <tr>
            <th className="col-img">Image</th>
            <th>Product</th>
            <th className="col-hide-mobile">Variant</th>
            <th className="col-price">Price</th>
            <th className="col-stock col-hide-mobile">Stock</th>
            <th className="col-action">Add</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => {
            const variant = getSelectedVariant(product);
            const outOfStock = !variant || variant.stock <= 0;
            const stockClass = variant?.stock > 10 ? 'high' : variant?.stock > 0 ? 'low' : 'out';
            return (
              <tr key={product.product_id}>
                <td className="col-img">
                  <img src={getVariantImg(variant, product)} alt={product.title} onError={e => { e.target.src = '/images/poster1.jpg'; }} />
                </td>
                <td>
                  <p className="product-name">{product.title}</p>
                  <div style={{ display: 'none' }} className="mobile-variant-inline">
                    {product.variants?.length > 1 ? (
                      <select className="variant-select" value={selectedVariants[product.product_id] || variant?.variant_id || ''} onChange={e => handleVariantSelect(product.product_id, Number(e.target.value))}>
                        {product.variants.map(v => (
                          <option key={v.variant_id} value={v.variant_id} disabled={v.stock <= 0} style={{ color: 'black' }}>
                            {v.color || v.name || `Variant ${v.variant_id}`}
                          </option>
                        ))}
                      </select>
                    ) : <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{variant?.color || variant?.name || ''}</span>}
                  </div>
                </td>
                <td className="col-hide-mobile">
                  {product.variants?.length > 1 ? (
                    <select className="variant-select" value={selectedVariants[product.product_id] || variant?.variant_id || ''} onChange={e => handleVariantSelect(product.product_id, Number(e.target.value))}>
                      {product.variants.map(v => (
                        <option key={v.variant_id} value={v.variant_id} disabled={v.stock <= 0} style={{ color: 'black' }}>
                          {v.color || v.name || `Variant ${v.variant_id}`} — Ksh {v.price?.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  ) : <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{variant?.color || variant?.name || '—'}</span>}
                </td>
                <td className="col-price">Ksh {variant?.price?.toLocaleString() || 'N/A'}</td>
                <td className="col-stock col-hide-mobile">
                  <span className={`stock-value ${stockClass}`}>{variant?.stock || 0}</span>
                </td>
                <td className="col-action">
                  <button className="btn btn-green btn-sm" onClick={() => addToCart(product)} disabled={outOfStock || checkoutLoading || isPolling}>
                    {outOfStock ? '—' : <Plus size={14} />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ── Grid view ────────────────────────────────────────────────
  const GridView = () => (
    <div className="pos-grid">
      {filteredProducts.map(product => {
        const variant = getSelectedVariant(product);
        const outOfStock = !variant || variant.stock <= 0;
        return (
          <div key={product.product_id} className="pos-grid-card">
            <img src={getVariantImg(variant, product)} alt={product.title} onError={e => { e.target.src = '/images/poster1.jpg'; }} />
            <div className="card-body">
              <p className="card-title">{product.title}</p>
              <p className="card-price">Ksh {variant?.price?.toLocaleString() || 'N/A'}</p>
              <p className="card-stock">Stock: {variant?.stock || 0}</p>
              {product.variants?.length > 1 && (
                <select className="variant-select" style={{ width: '100%', marginBottom: 8 }} value={selectedVariants[product.product_id] || variant?.variant_id || ''} onChange={e => handleVariantSelect(product.product_id, Number(e.target.value))}>
                  {product.variants.map(v => (
                    <option key={v.variant_id} value={v.variant_id} disabled={v.stock <= 0} style={{ color: 'black' }}>
                      {v.color || v.name || `Variant ${v.variant_id}`}
                    </option>
                  ))}
                </select>
              )}
              <button className="btn btn-green btn-sm btn-full" onClick={() => addToCart(product)} disabled={outOfStock || checkoutLoading || isPolling}>
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Sidebar content ──────────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div style={{ padding: '0 14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => { setSidebarOpen(!sidebarOpen); setMobileSidebarOpen(false); }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '9px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', fontFamily: 'var(--font-body)' }}
        >
          <Menu size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>POS System</span>
        </button>
      </div>

      <div style={{ padding: 14, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className={`sidebar-mode-btn ${posMode === 'products' ? 'active' : ''}`} onClick={() => { setPosMode('products'); setMobileSidebarOpen(false); }}>
          <Grid size={16} /> View All Products
        </button>
        <button className={`sidebar-mode-btn ${posMode === 'scan-imei' ? 'active' : ''}`} onClick={() => { setPosMode('scan-imei'); setMobileSidebarOpen(false); }}>
          <ScanBarcode size={16} /> Scan IMEI to Add
        </button>
      </div>

      {settingsExpanded && (
        <div style={{ padding: '14px 0' }}>
          <div className="wallpaper-panel">
            <h4><Image size={13} /> Background Settings</h4>
            <label className="wallpaper-upload-label">
              <Upload size={13} /> Upload Wallpaper
              <input type="file" accept="image/*" onChange={handleWallpaperUpload} style={{ display: 'none' }} />
            </label>
            {posBackground && (
              <button className="btn btn-danger btn-sm btn-full" onClick={handleWallpaperReset}>Reset to Default</button>
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={16} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ color: 'white', fontSize: '0.8rem', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user ? (user.name || user.username) : 'Cashier'}
            </p>
            {user?.role && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0 }}>{user.role}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            title="Settings"
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: settingsExpanded ? '#60a5fa' : 'rgba(255,255,255,0.5)', background: settingsExpanded ? 'rgba(59,130,246,0.2)' : 'transparent', transition: 'all 0.2s' }}
          >
            <Settings size={16} />
          </button>
          <button
            title="Logout"
            onClick={handleLogout}
            style={{ all: 'unset', cursor: 'pointer', width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="pos-page-container"
      style={{ background: `url(${backgroundImage}) center/cover no-repeat fixed`, backgroundColor: '#000' }}
    >
      <div className="pos-bg-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Desktop Sidebar */}
      <aside
        className="pos-sidebar"
        style={{
          width: sidebarOpen ? 'var(--sidebar-w)' : 'var(--sidebar-slim)',
          background: 'rgba(20,20,30,0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 0 0',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <>
          <div className="pos-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />
          <aside
            className="pos-sidebar mobile-open"
            style={{
              background: 'rgba(10,10,18,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              padding: '20px 0 0',
            }}
          >
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
        className={`pos-main ${mobileCartOpen ? 'cart-open-mobile' : ''}`}
        style={{ marginLeft: sidebarOpen ? 'var(--sidebar-w)' : 'var(--sidebar-slim)' }}
      >
        {/* Header */}
        <GlassmorphicContainer className="pos-header" style={{ position: 'sticky', top: 0, zIndex: 50, borderRadius: 0 }}>
          <div className="pos-header-inner">
            <button className="pos-header-menu-btn" onClick={() => setMobileSidebarOpen(true)}>
              <Menu size={20} />
            </button>

            <div className="pos-header-logo">
              <img
                src={logoDark}
                alt="Logo"
                style={{ width: 54, height: 'auto', cursor: 'pointer', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>

            <div className="pos-header-search">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search products…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-btn" onClick={() => setSearchTerm('')}><X size={14} /></button>
              )}
            </div>

            <button className="pos-header-cart-btn" onClick={() => setMobileCartOpen(true)}>
              <ShoppingCart size={20} />
              {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
            </button>
          </div>
        </GlassmorphicContainer>

        {/* Alerts */}
        {isPolling && (
          <div className="pos-alert polling" style={{ margin: '12px 20px' }}>
            <span className="alert-dot" />
            Awaiting M-Pesa confirmation for Ksh {total.toLocaleString()}… Ask customer to complete on their phone.
          </div>
        )}
        {error && (
          <div className="pos-alert error" style={{ margin: '12px 20px' }}>
            <span>{error}</span>
            <button className="alert-close" onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}

        {/* Body */}
        <div className="pos-body">
          {/* Products Column */}
          <div className={`pos-products-col ${mobileCartOpen ? 'blurred' : ''}`}>
            {posMode === 'scan-imei' ? (
              <div className="pos-products-scroll">
                <div className="scan-imei-section">
                  <h2 className="scan-title"><ScanBarcode size={20} /> Scan IMEI to Add</h2>
                  <form className="scan-form" onSubmit={handleScanImeiToCart}>
                    <div className="scan-input-wrap">
                      <ScanBarcode className="scan-icon" size={20} />
                      <input
                        type="text"
                        className={`scan-input ${scanError ? 'err' : ''}`}
                        placeholder="Scan or enter IMEI / Serial Number…"
                        value={scanImeiInput}
                        onChange={e => {
                          scanImeiRef.current = e.target.value;
                          setScanImeiInput(e.target.value);
                          setScanError('');
                          handleScanImeiToCart();
                        }}
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="btn btn-green btn-md" disabled={scanLoading || !scanImeiInput.trim()}>
                      {scanLoading ? 'Scanning…' : 'Add'}
                    </button>
                  </form>
                  
                  {/* Camera Scanner Button */}
                  <button 
                    className="btn btn-outline btn-md" 
                    onClick={() => setShowScanner(!showScanner)}
                    style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Camera size={18} />
                    {showScanner ? 'Close Scanner' : 'Scan with Camera'}
                  </button>
                  
                  {/* Camera Scanner Component */}
                  {showScanner && (
                    <div style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--pos-green)' }}>
                      <BarcodeScanner 
                        onScanSuccess={handleBarcodeScan}
                        onScanError={(err) => console.error('Scan error:', err)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                  
                  {scanError && <p className="scan-error">{scanError}</p>}

                  {cart.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: 12 }}>Scanned ({cart.length})</p>
                      <div className="pos-table-wrap">
                        <table className="pos-table">
                          <thead>
                            <tr>
                              <th className="col-img">Img</th>
                              <th>Product</th>
                              <th className="col-hide-mobile">IMEI</th>
                              <th className="col-price">Price</th>
                              <th className="col-hide-mobile col-stock">Qty</th>
                              <th className="col-action">Remove</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cart.map(item => (
                              <tr key={item.variant_id + '-' + item.imei}>
                                <td className="col-img"><img src={item.image} alt={item.title} onError={e => { e.target.src = '/images/poster1.jpg'; }} /></td>
                                <td>
                                  <p className="product-name">{item.title}</p>
                                  {item.variantColor && <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{item.variantColor}</span>}
                                </td>
                                <td className="col-hide-mobile">
                                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: item.imeiValid === 'valid' ? 'var(--pos-green)' : 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '3px 7px', borderRadius: 4 }}>
                                    {item.imei || 'N/A'}
                                  </span>
                                </td>
                                <td className="col-price">Ksh {item.price?.toLocaleString()}</td>
                                <td className="col-hide-mobile col-stock" style={{ textAlign: 'center' }}>
                                  <div className="qty-ctrl" style={{ justifyContent: 'center' }}>
                                    <button className="qty-btn" onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}>−</button>
                                    <span className="qty-val">{item.quantity}</span>
                                    <button className="qty-btn" onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}>+</button>
                                  </div>
                                </td>
                                <td className="col-action">
                                  <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.variant_id)}>Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {cart.length === 0 && (
                    <div className="pos-empty">
                      <ScanBarcode size={44} />
                      <p>Scan an IMEI to add products</p>
                      <p style={{ fontSize: '0.78rem' }}>Product will be detected automatically</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="pos-view-toggle">
                  <button className={`pos-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table View"><Table size={16} /></button>
                  <button className={`pos-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View"><Grid size={16} /></button>
                  <div className="pos-view-divider" />
                  <span className="pos-view-label">View</span>
                </div>

                <div className="pos-products-scroll">
                  {loading ? (
                    <div className="pos-loading">
                      <div className="spinner" />
                      <p>Loading products…</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="pos-empty"><p>No products found</p></div>
                  ) : viewMode === 'table' ? (
                    <TableView />
                  ) : (
                    <GridView />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Cart Column */}
          <div 
            className={`pos-cart-col ${mobileCartOpen ? "mobile-open" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="cart-drag-handle"
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="cart-drag-handle-bar" />
            </div>
            <div className="cart-header">
              <h2 className="cart-title">
                Cart
                {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {cart.length > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={resetSale}>Clear All</button>
                )}
                <button
                  className="cart-close-btn"
                  onClick={() => setMobileCartOpen(false)}
                  aria-label="Close cart"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div 
              className="cart-content-wrapper"
              onTouchMove={(e) => e.stopPropagation()}
            >
              <CartContent />
            </div>
          </div>
        </div>
      </main>

      {/* Cart Backdrop */}
      {mobileCartOpen && (
        <div 
          className="pos-cart-backdrop" 
          onClick={() => setMobileCartOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 199,
            animation: 'fadeIn 0.25s ease forwards'
          }}
        />
      )}

      {/* Bottom Navigation (Mobile) */}
      <nav className="pos-bottom-nav">
        <button className={`pos-bottom-nav-item ${posMode === 'products' ? 'active' : ''}`} onClick={() => { setPosMode('products'); setMobileCartOpen(false); }}>
          <Grid size={20} />
          <span className="nav-label">Products</span>
        </button>
        <button className={`pos-bottom-nav-item ${posMode === 'scan-imei' ? 'active' : ''}`} onClick={() => { setPosMode('scan-imei'); setMobileCartOpen(false); }}>
          <ScanBarcode size={20} />
          <span className="nav-label">Scan</span>
        </button>
        <button className={`pos-bottom-nav-item ${mobileCartOpen ? 'active' : ''}`} onClick={() => setMobileCartOpen(!mobileCartOpen)}>
          <ShoppingCart size={20} />
          <span className="nav-label">Cart</span>
          {cart.length > 0 && <span className="nav-badge">{cart.length}</span>}
        </button>
        <button className="pos-bottom-nav-item" onClick={() => setMobileSidebarOpen(true)}>
          <Menu size={20} />
          <span className="nav-label">Menu</span>
        </button>
      </nav>

      {/* M-PESA Modal */}
      {showMpesaModal && (
        <div className="mpesa-modal-overlay">
          <div className="mpesa-modal">
            <h3>M-Pesa Payment</h3>
            <p className="mpesa-total">Ksh {total.toLocaleString()}</p>
            <input
              type="tel"
              className="mpesa-input"
              placeholder="254XXXXXXXXX"
              value={mpesaPhone}
              onChange={e => setMpesaPhone(e.target.value)}
            />
            {mpesaModalError && <p className="mpesa-error">{mpesaModalError}</p>}
            <div className="mpesa-actions">
              <button className="btn btn-ghost btn-md" style={{ flex: 1 }} onClick={() => setShowMpesaModal(false)}>Cancel</button>
              <button className="btn btn-green btn-md" style={{ flex: 1 }} onClick={handleMpesaSubmit}>Pay with M-Pesa</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default POSPage;