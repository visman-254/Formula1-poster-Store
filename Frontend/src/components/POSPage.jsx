import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, X, User, Settings, LogOut, Menu, Table, Grid, ShoppingCart, Upload, Image, ScanBarcode, CheckCircle, Plus } from "lucide-react";
import { toast } from 'sonner';
import POSReceipt from './POSReceipt';
import GlassmorphicContainer from './GlassmorphicContainer';
import './POSPage.css';
import API_BASE from '../config';
import { getWallpaper, updateWallpaper, deleteWallpaper } from "../api/adminSettings";
import elegantwaterBg from "../assets/elegantwater.jpg";
import logoDark from "../assets/pmc2.png";

const POSPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaModalError, setMpesaModalError] = useState('');
  const [selectedVariants, setSelectedVariants] = useState({});
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [posMode, setPosMode] = useState('products'); // 'products' | 'scan-imei'
  const [showAllProducts, setShowAllProducts] = useState(true);
  const [posBackground, setPosBackground] = useState(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // IMEI input state
  const [imeiInputs, setImeiInputs] = useState({});
  const imeiInputsRef = useRef({});
  
  // Scan IMEI mode state
  const [scanImeiInput, setScanImeiInput] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');

  // Polling state
  const [isPolling, setIsPolling] = useState(false);
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState(null);
  const pollingIntervalRef = useRef(null);
  const debounceTimerRef = useRef({});
  const validationReqIdRef = useRef(0);
  const latestValidationVariantRef = useRef(null);

  const API_URL = `${API_BASE}/api`;
  const token = localStorage.getItem('token');

  // Load user data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  // Load wallpaper
  useEffect(() => {
    const loadPosWallpaper = async () => {
      try {
        const response = await getWallpaper();
        if (response.success && response.wallpaper) {
          setPosBackground(`${API_BASE}/${response.wallpaper}`);
        }
      } catch (err) {
        console.error('Error loading wallpaper:', err);
      }
    };
    loadPosWallpaper();
  }, []);

  // Handle wallpaper upload
  const handleWallpaperUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const response = await updateWallpaper(file);
      if (response.success) {
        setPosBackground(`${API_BASE}/${response.wallpaper}`);
        toast.success('Wallpaper updated successfully');
      }
    } catch (err) {
      console.error('Error uploading wallpaper:', err);
      toast.error('Failed to update wallpaper');
    }
  };

  // Handle wallpaper reset
  const handleWallpaperReset = async () => {
    try {
      await deleteWallpaper();
      setPosBackground(null);
      toast.success('Wallpaper reset to default');
    } catch (err) {
      console.error('Error resetting wallpaper:', err);
      toast.error('Failed to reset wallpaper');
    }
  };

  // Reset sale
  const resetSale = () => {
    setCart([]);
    setImeiInputs({});
    imeiInputsRef.current = {};
    setMpesaPhone('');
    setError('');
    setCheckoutLoading(false);
    setShowReceipt(false);
    setReceiptData(null);
    setIsPolling(false);
    setMpesaCheckoutId(null);
    setScanImeiInput('');
    setScanError('');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/pos/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [token, API_URL]);

  // Polling logic
  useEffect(() => {
    if (isPolling && mpesaCheckoutId) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const { data } = await axios.get(
            `${API_URL}/pos/payment-status/${encodeURIComponent(mpesaCheckoutId)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (data.status === 'paid' && data.receipt) {
            setReceiptData(data.receipt);
            setShowReceipt(true);
            setCart([]);
            setImeiInputs({});
            imeiInputsRef.current = {};
            setMpesaPhone('');
            setError('');
            setCheckoutLoading(false);
            setIsPolling(false);
            setMpesaCheckoutId(null);
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          } else if (['failed', 'cancelled', 'not_found', 'paid_but_order_failed'].includes(data.status)) {
            setError(`Payment failed or was not found. Status: ${data.status}`);
            setCheckoutLoading(false);
            setIsPolling(false);
            setMpesaCheckoutId(null);
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } catch (err) {
          console.error('Polling error:', err);
          if (err.code === 'ERR_NETWORK' || !err.response) return;
          setError('An error occurred while checking payment status.');
          setCheckoutLoading(false);
          setIsPolling(false);
          setMpesaCheckoutId(null);
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [isPolling, mpesaCheckoutId, API_URL, token]);

  // Product image helper
  const getProductImage = (product) => {
    const fallback = '/images/poster1.jpg';
    if (!product) return fallback;

    const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      return `${API_BASE}/${path.replace(/\\/g, '/')}`;
    };

    if (product.is_bundle && product.bundleImages?.length > 0) {
      const url = getImageUrl(product.bundleImages[0]);
      if (url) return url;
    }

    const variant = product.variants?.[0];
    if (variant?.image) {
      const url = getImageUrl(variant.image);
      if (url) return url;
    }

    if (product.images?.length > 0) {
      const galleryImage = product.images[0]?.image_url || product.images[0];
      const url = getImageUrl(galleryImage);
      if (url) return url;
    }

    if (product.primaryImage) {
      const url = getImageUrl(product.primaryImage);
      if (url) return url;
    }

    return fallback;
  };

  // Filter products based on search
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Display products
  const displayProducts = showAllProducts ? filteredProducts : cart.map(item => {
    const product = products.find(p => p.product_id === item.product_id);
    return product || { ...item, title: item.title, variants: [{ ...item, product_id: item.product_id }] };
  });

  // IMEI validation
  const validateImei = useCallback(
    async (imeiValue, variantId, productId) => {
      if (!imeiValue || imeiValue.trim().length < 5) {
        return { valid: false, error: 'IMEI too short' };
      }

      const requestId = ++validationReqIdRef.current;
      latestValidationVariantRef.current = variantId;

      try {
        const response = await axios.post(
          `${API_URL}/imei/validate?_=${Date.now()}`,
          { imeiNumber: imeiValue.trim(), variantId, productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { data } = response;
        if (latestValidationVariantRef.current !== variantId || validationReqIdRef.current !== requestId) {
          return { valid: null, status: 'stale' };
        }

        if (!data.valid) {
          return { valid: false, status: data.status || 'error', error: data.error || 'IMEI validation failed' };
        }

        if (data.warning) {
          return { valid: true, status: data.status || 'available', warning: data.warning, error: null };
        }

        return { valid: true, status: data.status || 'new', error: null };
      } catch (err) {
        if (latestValidationVariantRef.current !== variantId) {
          return { valid: null, status: 'stale' };
        }

        const errorData = err.response?.data;
        if (errorData?.status === 'used') return { valid: false, status: 'used', error: 'IMEI has already been used in another order' };
        if (errorData?.status === 'reserved') return { valid: false, status: 'reserved', error: 'IMEI is reserved for another order' };
        if (errorData?.status === 'not_found') return { valid: false, status: 'not_found', error: errorData?.error || 'IMEI not found in database' };
        if (errorData?.status === 'wrong_product') return { valid: false, status: 'wrong_product', error: errorData?.error || 'IMEI belongs to a different product', found_product_title: errorData?.found_product_title };
        if (errorData?.status === 'wrong_variant') return { valid: false, status: 'wrong_variant', error: errorData?.error || 'IMEI belongs to a different variant', found_variant_id: errorData?.found_variant_id };

        return { valid: false, status: 'error', error: 'Failed to validate IMEI. Please try again.' };
      }
    },
    [API_URL, token]
  );

  // Handle IMEI change
  const handleImeiChange = (variantId, rawValue) => {
    imeiInputsRef.current[variantId] = rawValue;
    setImeiInputs((prev) => ({ ...prev, [variantId]: rawValue }));

    if (debounceTimerRef.current[variantId]) {
      clearTimeout(debounceTimerRef.current[variantId]);
    }

    const cartItem = cart.find((i) => i.variant_id === variantId);
    if (!cartItem) return;

    const cleanedImei = rawValue.replace(/[\r\n\t\x00-\x1F]/g, '');

    if (!cleanedImei) {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.variant_id === variantId
            ? { ...item, imei: '', imeiValid: null, imeiError: null, imeiWarning: null }
            : item
        )
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variant_id === variantId
          ? { ...item, imei: cleanedImei, imeiValid: null, imeiError: null, imeiWarning: null }
          : item
      )
    );

    debounceTimerRef.current[variantId] = setTimeout(async () => {
      const currentRaw = imeiInputsRef.current[variantId] || '';
      const currentCleaned = currentRaw.replace(/[\r\n\t\x00-\x1F]/g, '');

      if (currentCleaned.length < 5) return;

      const result = await validateImei(currentCleaned, variantId, cartItem.product_id);
      if (result.status === 'stale') return;

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.variant_id === variantId
            ? {
                ...item,
                imei: currentCleaned,
                imeiValid: result.valid ? 'valid' : 'invalid',
                imeiError: result.error || null,
                imeiWarning: result.warning || null,
              }
            : item
        )
      );

      if (result.valid) {
        if (result.warning) toast.warning(result.warning);
        else toast.success('IMEI is valid');
      } else if (result.error) {
        toast.error(result.error);
      }
    }, 500);
  };

  // Auto-fill IMEI
  const autoFillImei = async (variantId) => {
    try {
      const response = await axios.post(
        `${API_URL}/imei/auto-assign`,
        { variantId, orderId: 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.imei) {
        const imei = response.data.imei;
        imeiInputsRef.current[variantId] = imei;
        setImeiInputs((prev) => ({ ...prev, [variantId]: imei }));
        setCart((prevCart) =>
          prevCart.map((item) =>
            item.variant_id === variantId
              ? { ...item, imei, imeiId: response.data.imeiId, imeiValid: 'valid', imeiError: null }
              : item
          )
        );
        toast.success(`IMEI auto-filled: ${imei}`);
      }
    } catch (err) {
      console.error('Auto-fill failed:', err);
    }
  };

  // Scan IMEI to add to cart - looks up product by IMEI and adds to cart
  const handleScanImeiToCart = async (e) => {
    e?.preventDefault();
    const imei = scanImeiInput.trim();
    if (!imei) {
      setScanError('Please enter a valid IMEI');
      return;
    }

    setScanLoading(true);
    setScanError('');

    try {
      // First, validate the IMEI to get product info
      const response = await axios.post(
        `${API_URL}/imei/validate`,
        { imeiNumber: imei },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { data } = response;

      if (!data.valid) {
        setScanError(data.error || 'IMEI validation failed');
        setScanLoading(false);
        return;
      }

      // Get product info from the response
      const productId = data.product_id;
      const variantId = data.variant_id;

      // Fetch the product details
      const productResponse = await axios.get(
        `${API_URL}/pos/products`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allProducts = productResponse.data;
      const product = allProducts.find(p => p.product_id === productId);

      if (!product) {
        setScanError('Product not found for this IMEI');
        setScanLoading(false);
        return;
      }

      const variant = product.variants?.find(v => v.variant_id === variantId) || product.variants?.[0];

      if (!variant || variant.stock <= 0) {
        setScanError('Product out of stock');
        setScanLoading(false);
        return;
      }

      // Check if already in cart
      const existingItem = cart.find((item) => item.variant_id === variant.variant_id && item.imei === imei);
      if (existingItem) {
        setScanError('This IMEI is already in the cart');
        setScanLoading(false);
        return;
      }

      // Add to cart with IMEI pre-filled (like normal products)
      const newItem = {
        variant_id: variant.variant_id,
        product_id: product.product_id,
        title: product.title,
        variantColor: variant.color || variant.name || null,
        price: variant.price,
        image: variant.image
          ? variant.image.startsWith('http://') || variant.image.startsWith('https://')
            ? variant.image
            : `${API_BASE}/${variant.image.replace(/\\/g, '/')}`
          : getProductImage(product),
        quantity: 1,
        stock: variant.stock,
        imei: imei,
        imeiId: data.imeiId || null,
        imeiValid: 'valid',
        imeiError: null,
        imeiWarning: null,
      };

      setCart((prevCart) => [...prevCart, newItem]);
      setImeiInputs((prev) => ({ ...prev, [variant.variant_id]: imei }));
      imeiInputsRef.current[variant.variant_id] = imei;

      setScanImeiInput('');
      toast.success(`Added: ${product.title} (${variant.color || variant.name || 'Default'})`);

    } catch (err) {
      console.error('Scan IMEI error:', err);
      const errorData = err.response?.data;
      if (errorData?.status === 'used') {
        setScanError('IMEI has already been used in another order');
      } else if (errorData?.status === 'reserved') {
        setScanError('IMEI is reserved for another order');
      } else if (errorData?.status === 'not_found') {
        setScanError('IMEI not found in database');
      } else {
        setScanError(err.response?.data?.error || 'Failed to scan IMEI. Please try again.');
      }
    } finally {
      setScanLoading(false);
    }
  };

  // Variant selection
  const handleVariantSelect = (productId, variantId) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  };

  const getSelectedVariant = (product) => {
    const selectedId = selectedVariants[product.product_id];
    if (selectedId) {
      return product.variants.find((v) => v.variant_id === selectedId) || product.variants[0];
    }
    return product.variants?.[0];
  };

  // Add to cart
  const addToCart = async (product) => {
    const variant = getSelectedVariant(product);
    if (!variant || variant.stock <= 0) {
      setError('Product out of stock');
      return;
    }

    const existingItem = cart.find((item) => item.variant_id === variant.variant_id);
    if (existingItem) {
      if (existingItem.quantity >= variant.stock) {
        setError('Insufficient stock');
        return;
      }
      updateQuantity(variant.variant_id, existingItem.quantity + 1);
    } else {
      const newItem = {
        variant_id: variant.variant_id,
        product_id: product.product_id,
        title: product.title,
        variantColor: variant.color || variant.name || null,
        price: variant.price,
        image: variant.image
          ? variant.image.startsWith('http://') || variant.image.startsWith('https://')
            ? variant.image
            : `${API_BASE}/${variant.image.replace(/\\/g, '/')}`
          : getProductImage(product),
        quantity: 1,
        stock: variant.stock,
        imei: '',
        imeiId: null,
        imeiValid: null,
        imeiError: null,
        imeiWarning: null,
      };
      setCart((prevCart) => [...prevCart, newItem]);
      setImeiInputs((prev) => ({ ...prev, [variant.variant_id]: '' }));
      imeiInputsRef.current[variant.variant_id] = '';
      toast.info('Scan or enter IMEI for this product');
    }
  };

  // Update quantity
  const updateQuantity = (variantId, quantity) => {
    if (quantity <= 0) return removeFromCart(variantId);
    const item = cart.find((i) => i.variant_id === variantId);
    if (item && quantity > item.stock) return setError('Insufficient stock');
    setCart((prevCart) => prevCart.map((i) => (i.variant_id === variantId ? { ...i, quantity } : i)));
  };

  // Remove from cart
  const removeFromCart = (variantId) => {
    setCart((prevCart) => prevCart.filter((i) => i.variant_id !== variantId));
    setImeiInputs((prev) => {
      const newState = { ...prev };
      delete newState[variantId];
      return newState;
    });
    delete imeiInputsRef.current[variantId];
    if (debounceTimerRef.current[variantId]) {
      clearTimeout(debounceTimerRef.current[variantId]);
      delete debounceTimerRef.current[variantId];
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const allImeisValid = cart.length > 0 && cart.every((item) => item.imeiValid === 'valid');
  const pendingImeis = cart.filter((item) => !item.imei || item.imeiValid !== 'valid');

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return setError('Cart is empty');
    setError('');

    if (paymentMethod === 'mpesa') {
      setShowMpesaModal(true);
      setMpesaModalError('');
    } else {
      await processImmediateCheckout();
    }
  };

  const handleMpesaSubmit = async () => {
    if (!mpesaPhone.trim() || !/^\d{10,}$/.test(mpesaPhone.replace(/\D/g, ''))) {
      return setMpesaModalError('Please enter a valid phone number');
    }
    setShowMpesaModal(false);
    await initiateMpesaPayment();
  };

  const processImmediateCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/pos/checkout`,
        { cartItems: cart, total: total.toFixed(2), payment_method: paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReceiptData(response.data.receipt);
      setShowReceipt(true);
      setCart([]);
      setImeiInputs({});
      imeiInputsRef.current = {};
      setMpesaPhone('');
      setError('');
      setCheckoutLoading(false);
      toast.success('Checkout successful!');
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMsg = err.response?.data?.message || 'Checkout failed';
      setError(errorMsg);
      toast.error(errorMsg);
      setCheckoutLoading(false);
    }
  };

  const initiateMpesaPayment = async () => {
    setCheckoutLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${API_URL}/pos/checkout`,
        { cartItems: cart, total: total.toFixed(2), payment_method: 'mpesa', phone_number: mpesaPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.checkoutRequestID) {
        setMpesaCheckoutId(response.data.checkoutRequestID);
        setIsPolling(true);
        toast.success('M-Pesa payment initiated. Check your phone.');
      } else {
        throw new Error('M-Pesa initiation failed. No Checkout ID received.');
      }
    } catch (err) {
      console.error('M-Pesa initiation error:', err);
      const errorMsg = err.response?.data?.message || 'M-Pesa initiation failed.';
      setError(errorMsg);
      toast.error(errorMsg);
      setCheckoutLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Background image
  const backgroundImage = posBackground || elegantwaterBg;

  // Redirect if no token
  if (!token) {
    navigate('/login');
    return null;
  }

  // Show receipt
  if (showReceipt && receiptData) {
    return (
      <POSReceipt
        receipt={receiptData}
        onNewSale={() => {
          setShowReceipt(false);
          setReceiptData(null);
        }}
      />
    );
  }

  return (
    <div 
      className="pos-page-container" 
      style={{ 
        display: 'flex', 
        minHeight: '100vh',
        background: `url(${backgroundImage}) center/cover no-repeat fixed`,
        backgroundColor: '#000000'
      }}
    >
      {/* Glass Overlay for entire page */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 0
      }} />

      {/* Sidebar */}
      <aside className={`pos-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`} style={{
        width: sidebarOpen ? '260px' : '60px',
        background: 'rgba(20, 20, 30, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%'
            }}
          >
            <Menu size={18} />
            {sidebarOpen && <span style={{ fontWeight: 600 }}>POS System</span>}
          </button>
        </div>

        {/* View Toggle */}
        {/* View Toggle - Windows Explorer Style */}


        {/* POS Mode Toggle - Products vs Scan IMEI */}
        {sidebarOpen && (
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setPosMode('products')}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: posMode === 'products' ? '#636b68' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 500
                }}
              >
                <Grid size={16} />
                View All Products
              </button>
              <button
                onClick={() => setPosMode('scan-imei')}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: posMode === 'scan-imei' ? '#636b68' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 500
                }}
              >
                <ScanBarcode size={16} />
                Scan IMEI to Add
              </button>
            </div>
          </div>
        )}

        {/* Wallpaper Settings */}
        {sidebarOpen && settingsExpanded && (
          <div style={{
            padding: '16px',
            margin: '0 16px',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '13px', 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 500
            }}>
              <Image size={14} /> Background Settings
            </h4>
            <label style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}>
              <Upload size={14} /> Upload Wallpaper
              <input 
                type='file' 
                accept='image/*' 
                onChange={handleWallpaperUpload}
                style={{ display: 'none' }}
              />
            </label>
            {posBackground && (
              <button
                onClick={handleWallpaperReset}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                Reset to Default
              </button>
            )}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User Footer Section - VS Code style */}
        {sidebarOpen && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            {/* User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(59,130,246,0.25)',
                color: '#60a5fa',
                flexShrink: 0
              }}>
                <User size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'white',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user ? (user.name || user.username) : 'Cashier User'}
                </span>
                {user && user.role && (
                  <span style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.6)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.role}
                  </span>
                )}
              </div>
            </div>
            {/* User Actions */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                title="Settings"
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  background: settingsExpanded ? 'rgba(59,130,246,0.25)' : 'transparent'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(59,130,246,0.25)'}
                onMouseLeave={(e) => e.target.style.background = settingsExpanded ? 'rgba(59,130,245,0.25)' : 'transparent'}
              >
                <Settings size={18} />
              </button>
              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239,68,68,0.25)';
                  e.target.style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '60px',
        transition: 'margin-left 0.3s ease',
        padding: '20px',
        position: 'relative',
        zIndex: 5,
        minHeight: '100vh'
      }}>
        {/* Header */}
        <GlassmorphicContainer>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
           <div style={{ display: 'flex', alignItems: 'center' }}>
      <img 
        src={logoDark} 
        alt="Logo" 
        style={{
          width: '60px',  
          height: 'auto',
          transition: 'transform 0.3s ease',
          cursor:'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      />
    </div>
            
            {/* Search */}
            <div style={{ position: 'relative', width: '300px' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.5)',
                zIndex: 1
              }} size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    zIndex: 1
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </GlassmorphicContainer>

        {/* Alerts */}
        {isPolling && (
          <GlassmorphicContainer style={{ marginTop: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#60a5fa'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa', animation: 'pulse 1.5s infinite' }} />
              Awaiting M-Pesa payment confirmation for Ksh {total.toLocaleString('en-KE')}... Please ask the customer to complete the transaction on their phone.
            </div>
          </GlassmorphicContainer>
        )}
        
        {error && (
          <GlassmorphicContainer style={{ marginTop: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#f87171'
            }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
          </GlassmorphicContainer>
        )}

        {/* Products and Cart Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: posMode === 'scan-imei' ? '1fr 380px' : '1fr 400px', 
          gap: '20px',
          marginTop: '20px'
        }}>
          {/* Main Content Area - Products or Scan IMEI */}
          <GlassmorphicContainer>
            {posMode === 'scan-imei' ? (
              /* Scan IMEI to Add Mode */
              <div>
                <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ScanBarcode size={20} /> Scan IMEI to Add to Cart
                </h2>

                {/* IMEI Scanner Input */}
                <form onSubmit={handleScanImeiToCart} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <ScanBarcode style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255,255,255,0.5)',
                        zIndex: 1
                      }} size={20} />
                      <input
                        type="text"
                        placeholder="Scan or enter IMEI/Serial Number here..."
                        value={scanImeiInput}
                        onChange={(e) => {
                          setScanImeiInput(e.target.value);
                          setScanError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleScanImeiToCart();
                          }
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '14px 14px 14px 44px',
                          background: 'rgba(255,255,255,0.1)',
                          border: `1px solid ${scanError ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                          borderRadius: '10px',
                          color: 'white',
                          fontSize: '16px',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={scanLoading || !scanImeiInput.trim()}
                      style={{
                        padding: '14px 28px',
                        background: scanLoading ? 'rgba(100,100,100,0.5)' : '#10b981',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: scanLoading || !scanImeiInput.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {scanLoading ? 'Scanning...' : 'Add to Cart'}
                    </button>
                  </div>
                  {scanError && (
                    <p style={{ color: '#ef4444', fontSize: '13px', margin: '8px 0 0' }}>{scanError}</p>
                  )}
                </form>

                {/* Scanned Products Table */}
                {cart.length > 0 ? (
                  <div>
                    <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '12px' }}>Scanned Products ({cart.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        color: 'white'
                      }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Image</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Product</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>IMEI</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Price</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Qty</th>
                            <th style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Total</th>
                            <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map((item) => (
                            <tr key={item.variant_id + '-' + item.imei} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '12px' }}>
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                  onError={(e) => { e.target.src = '/images/poster1.jpg'; }}
                                />
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.title}</div>
                                {item.variantColor && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{item.variantColor}</div>}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ 
                                  background: item.imeiValid === 'valid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  color: item.imeiValid === 'valid' ? '#10b981' : 'white'
                                }}>
                                  {item.imei || 'N/A'}
                                </div>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
                                Ksh {item.price?.toLocaleString()}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                  <button
                                    onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      background: 'rgba(255,255,255,0.1)',
                                      border: '1px solid rgba(255,255,255,0.2)',
                                      borderRadius: '4px',
                                      color: 'white',
                                      cursor: 'pointer',
                                      fontSize: '14px'
                                    }}
                                  >
                                    -
                                  </button>
                                  <span style={{ color: 'white', minWidth: '20px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      background: 'rgba(255,255,255,0.1)',
                                      border: '1px solid rgba(255,255,255,0.2)',
                                      borderRadius: '4px',
                                      color: 'white',
                                      cursor: 'pointer',
                                      fontSize: '14px'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
                                Ksh {(item.price * item.quantity).toLocaleString()}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button
                                  onClick={() => removeFromCart(item.variant_id)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '4px',
                                    color: '#ef4444',
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 40px', color: 'rgba(255,255,255,0.5)' }}>
                    <ScanBarcode size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p style={{ fontSize: '16px', margin: 0 }}>Scan an IMEI to add products to cart</p>
                    <p style={{ fontSize: '13px', margin: '8px 0 0', opacity: 0.7 }}>The product will be automatically detected and added</p>
                  </div>
                )}
              </div>
            ) : (
              /* Products View (Table or Grid) */
              <>
              {/* View Toggle - Windows Explorer Style */}
{sidebarOpen && (
  <div style={{ 
    padding: '12px 16px', 
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }}>
    <button
      onClick={() => setViewMode('table')}
      style={{
        padding: '8px',
        background: viewMode === 'table' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
        border: viewMode === 'table' ? '1px solid #10b981' : '1px solid transparent',
        borderRadius: '6px',
        color: viewMode === 'table' ? '#10b981' : 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        width: '36px',
        height: '36px'
      }}
      title="Table View"
    >
      <Table size={18} />
    </button>
    <button
      onClick={() => setViewMode('grid')}
      style={{
        padding: '8px',
        background: viewMode === 'grid' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
        border: viewMode === 'grid' ? '1px solid #10b981' : '1px solid transparent',
        borderRadius: '6px',
        color: viewMode === 'grid' ? '#10b981' : 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        width: '36px',
        height: '36px'
      }}
      title="Grid View"
    >
      <Grid size={18} />
    </button>
    <div style={{ 
      width: '1px', 
      height: '24px', 
      background: 'rgba(255,255,255,0.1)',
      margin: '0 8px'
    }} />
    <span style={{ 
      color: 'rgba(255,255,255,0.5)', 
      fontSize: '12px',
      marginLeft: '4px'
    }}>
      View
    </span>
  </div>
)}
                
            
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Loading products...
                  </div>
                ) : displayProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    No products found
                  </div>
                ) : viewMode === 'table' ? (
                  /* Table View */
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      color: 'white'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)' }}>Image</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)' }}>Product</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)' }}>Variant</th>
                          <th style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>Price</th>
                          <th style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>Stock</th>
                          <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayProducts.map((product) => {
                          const variant = getSelectedVariant(product);
                          const isOutOfStock = !variant || variant.stock <= 0;
                          return (
                            <tr key={product.product_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '12px' }}>
                                <img
                                  src={variant?.image ? (variant.image.startsWith('http') ? variant.image : `${API_BASE}/${variant.image}`) : getProductImage(product)}
                                  alt={product.title}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                                  onError={(e) => { e.target.src = '/images/poster1.jpg'; }}
                                />
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: 500 }}>{product.title}</div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                {product.variants?.length > 1 ? (
                                  <select
                                    value={selectedVariants[product.product_id] || variant?.variant_id || ''}
                                    onChange={(e) => handleVariantSelect(product.product_id, Number(e.target.value))}
                                    style={{
                                      background: 'rgba(255,255,255,0.1)',
                                      border: '1px solid rgba(255,255,255,0.2)',
                                      borderRadius: '6px',
                                      color: 'white',
                                      padding: '6px 10px',
                                      fontSize: '13px'
                                    }}
                                  >
                                    {product.variants.map((v) => (
                                      <option key={v.variant_id} value={v.variant_id} disabled={v.stock <= 0} style={{ color: 'black' }}>
                                        {v.color || v.name || `Variant ${v.variant_id}`} - Ksh {v.price?.toLocaleString()}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span>{variant?.color || variant?.name || '-'}</span>
                                )}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                                Ksh {variant?.price?.toLocaleString() || 'N/A'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <span style={{
                                  color: variant?.stock > 10 ? '#10b981' : variant?.stock > 0 ? '#f59e0b' : '#ef4444',
                                  fontWeight: 500
                                }}>
                                  {variant?.stock || 0}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button
                                  onClick={() => addToCart(product)}
                                  disabled={isOutOfStock || checkoutLoading || isPolling}
                                  style={{
                                    background: isOutOfStock ? 'rgba(100,100,100,0.5)' : '#10b981',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    padding: '8px 16px',
                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    fontWeight: 500
                                  }}
                                >
                                  Add
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Grid View */
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {displayProducts.map((product) => {
                      const variant = getSelectedVariant(product);
                      const isOutOfStock = !variant || variant.stock <= 0;
                      return (
                        <div key={product.product_id} style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          padding: '12px',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <img
                            src={variant?.image ? (variant.image.startsWith('http') ? variant.image : `${API_BASE}/${variant.image}`) : getProductImage(product)}
                            alt={product.title}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => { e.target.src = '/images/poster1.jpg'; }}
                          />
                          <h3 style={{ color: 'white', fontSize: '14px', margin: '12px 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.title}
                          </h3>
                          <p style={{ color: '#10b981', fontWeight: 600, margin: 0 }}>Ksh {variant?.price?.toLocaleString() || 'N/A'}</p>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '4px 0' }}>Stock: {variant?.stock || 0}</p>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock || checkoutLoading || isPolling}
                            style={{
                              width: '100%',
                              marginTop: '8px',
                              padding: '8px',
                              background: isOutOfStock ? 'rgba(100,100,100,0.5)' : '#10b981',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              fontWeight: 500
                            }}
                          >
                            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </GlassmorphicContainer>

          {/* Cart Section - Always visible */}
          <GlassmorphicContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: 'white', fontSize: '18px', margin: 0 }}>
                {posMode === 'scan-imei' ? 'Cart' : `Cart (${cart.length})`}
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={resetSale}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#ef4444',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                Cart is empty
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
                  {cart.map((item) => {
                    const currentImeiValue = imeiInputs[item.variant_id] ?? item.imei ?? '';
                    return (
                      <div key={item.variant_id} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ color: 'white', margin: '0 0 4px', fontSize: '14px' }}>{item.title}</h4>
                            {item.variantColor && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>{item.variantColor}</p>}
                            <p style={{ color: '#10b981', fontWeight: 600, margin: '8px 0 0' }}>Ksh {item.price.toLocaleString()}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              -
                            </button>
                            <span style={{ color: 'white', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* IMEI Input */}
                        <div style={{ marginTop: '12px' }}>
                          <input
                            type="text"
                            placeholder="Scan IMEI/Serial Number"
                            value={currentImeiValue}
                            onChange={(e) => handleImeiChange(item.variant_id, e.target.value)}
                            autoComplete="off"
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: item.imeiValid === 'valid' ? 'rgba(16, 185, 129, 0.2)' : item.imeiValid === 'invalid' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                              border: `1px solid ${item.imeiValid === 'valid' ? '#10b981' : item.imeiValid === 'invalid' ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          />
                          {!item.imei && (
                            <p style={{ color: '#f59e0b', fontSize: '11px', margin: '6px 0 0' }}>⚠ Scan IMEI to enable checkout</p>
                          )}
                          {item.imeiError && (
                            <p style={{ color: '#ef4444', fontSize: '11px', margin: '6px 0 0' }}>{item.imeiError}</p>
                          )}
                          {!item.imei && (
                            <button
                              onClick={() => autoFillImei(item.variant_id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#3b82f6',
                                fontSize: '11px',
                                cursor: 'pointer',
                                marginTop: '4px',
                                textDecoration: 'underline'
                              }}
                            >
                              Auto-fill IMEI
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => removeFromCart(item.variant_id)}
                          style={{
                            width: '100%',
                            marginTop: '8px',
                            padding: '6px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Cart Summary */}
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>Total:</span>
                    <span style={{ color: '#10b981', fontSize: '24px', fontWeight: 700 }}>Ksh {total.toLocaleString()}</span>
                  </div>

                  {/* Payment Method */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <label style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: paymentMethod === 'cash' ? '#10b981' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ display: 'none' }}
                      />
                      Cash
                    </label>
                    <label style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: paymentMethod === 'mpesa' ? '#10b981' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={paymentMethod === 'mpesa'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ display: 'none' }}
                      />
                      M-Pesa
                    </label>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || isPolling || !allImeisValid}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: !allImeisValid ? 'rgba(100,100,100,0.5)' : '#10b981',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 700,
                      cursor: !allImeisValid ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {checkoutLoading
                      ? 'Processing...'
                      : !allImeisValid
                      ? `Scan IMEIs (${pendingImeis.length} pending)`
                      : 'Checkout'}
                  </button>
                </div>
              </>
            )}
          </GlassmorphicContainer>
        </div>
      </main>

      {/* M-Pesa Modal */}
      {showMpesaModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(20, 20, 30, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '24px',
            width: '400px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ color: 'white', margin: '0 0 16px', fontSize: '18px' }}>Enter M-Pesa Phone Number</h3>
            <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 700, margin: '0 0 16px' }}>Total: Ksh {total.toLocaleString()}</p>
            <input
              type="tel"
              placeholder="254XXXXXXXXX"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                marginBottom: '12px'
              }}
            />
            {mpesaModalError && <p style={{ color: '#ef4444', fontSize: '14px', margin: '0 0 16px' }}>{mpesaModalError}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowMpesaModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMpesaSubmit}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Pay with M-Pesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add keyframe animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div> 
  );
};

export default POSPage;