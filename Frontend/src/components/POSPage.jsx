import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { toast } from 'sonner';
import POSReceipt from './POSReceipt';
import './POSPage.css';
import API_BASE from '../config';

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

  // --- IMEI input state (separate from cart) ---
  const [imeiInputs, setImeiInputs] = useState({}); // { variant_id: rawInputValue }

  // --- 🔥 CRITICAL: REF THAT ALWAYS HAS LATEST IMEI VALUE (for debounced callback) ---
  const imeiInputsRef = useRef({}); // mirror of imeiInputs, updated synchronously

  // --- Polling state ---
  const [isPolling, setIsPolling] = useState(false);
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState(null);
  const pollingIntervalRef = useRef(null);

  // --- Debounce timer ref ---
  const debounceTimerRef = useRef({});

  // --- Validation request ID ref (race condition prevention) ---
  const validationReqIdRef = useRef(0);
  const latestValidationVariantRef = useRef(null);

  const API_URL = `${API_BASE}/api`;
  const token = localStorage.getItem('token');

  // ------------------------------------------------------------------
  // Utility functions
  // ------------------------------------------------------------------
  const resetSale = () => {
    setCart([]);
    setImeiInputs({});
    imeiInputsRef.current = {}; // clear ref
    setMpesaPhone('');
    setError('');
    setCheckoutLoading(false);
    setShowReceipt(false);
    setReceiptData(null);
    setIsPolling(false);
    setMpesaCheckoutId(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // ------------------------------------------------------------------
  // API calls
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // Polling logic (unchanged)
  // ------------------------------------------------------------------
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
          } else if (
            ['failed', 'cancelled', 'not_found', 'paid_but_order_failed'].includes(data.status)
          ) {
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

  // ------------------------------------------------------------------
  // Product image helper (unchanged)
  // ------------------------------------------------------------------
  const getProductImage = (product) => {
    const fallback = '/fallback.jpg';
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

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ------------------------------------------------------------------
  // IMEI validation (unchanged, but uses callback correctly)
  // ------------------------------------------------------------------
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
          {
            imeiNumber: imeiValue.trim(),
            variantId,
            productId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { data } = response;

        // Stale check
        if (latestValidationVariantRef.current !== variantId || validationReqIdRef.current !== requestId) {
          return { valid: null, status: 'stale' };
        }

        if (!data.valid) {
          return {
            valid: false,
            status: data.status || 'error',
            error: data.error || 'IMEI validation failed',
          };
        }

        if (data.warning) {
          return {
            valid: true,
            status: data.status || 'available',
            warning: data.warning,
            error: null,
          };
        }

        return { valid: true, status: data.status || 'new', error: null };
      } catch (err) {
        if (latestValidationVariantRef.current !== variantId) {
          return { valid: null, status: 'stale' };
        }

        const errorData = err.response?.data;

        if (errorData?.status === 'used') {
          return {
            valid: false,
            status: 'used',
            error: 'IMEI has already been used in another order',
          };
        }
        if (errorData?.status === 'reserved') {
          return {
            valid: false,
            status: 'reserved',
            error: 'IMEI is reserved for another order',
          };
        }
        if (errorData?.status === 'not_found') {
          return {
            valid: false,
            status: 'not_found',
            error: errorData?.error || 'IMEI not found in database',
          };
        }
        if (errorData?.status === 'wrong_product') {
          return {
            valid: false,
            status: 'wrong_product',
            error: errorData?.error || 'IMEI belongs to a different product',
            found_product_title: errorData?.found_product_title,
            found_variant_color: errorData?.found_variant_color,
          };
        }
        if (errorData?.status === 'wrong_variant') {
          return {
            valid: false,
            status: 'wrong_variant',
            error: errorData?.error || 'IMEI belongs to a different variant',
            found_variant_id: errorData?.found_variant_id,
            found_product_title: errorData?.found_product_title,
            found_variant_color: errorData?.found_variant_color,
          };
        }

        console.error('IMEI validation error:', errorData || err.message);
        return {
          valid: false,
          status: 'error',
          error: 'Failed to validate IMEI. Please try again.',
        };
      }
    },
    [API_URL, token]
  );

  // ------------------------------------------------------------------
  // ✅ FIXED: IMEI input change handler – updates ref synchronously
  // ------------------------------------------------------------------
  const handleImeiChange = (variantId, rawValue) => {
    // 1. Update ref IMMEDIATELY (synchronous, no stale closure)
    imeiInputsRef.current[variantId] = rawValue;

    // 2. Update state for UI (async)
    setImeiInputs((prev) => ({
      ...prev,
      [variantId]: rawValue,
    }));

    // 3. Clear any pending debounce for this variant
    if (debounceTimerRef.current[variantId]) {
      clearTimeout(debounceTimerRef.current[variantId]);
    }

    // 4. Get the cart item to retrieve productId
    const cartItem = cart.find((i) => i.variant_id === variantId);
    if (!cartItem) return;

    // 5. Clean the IMEI for validation only (remove control characters, NOT truncate)
    const cleanedImei = rawValue.replace(/[\r\n\t\x00-\x1F]/g, '');

    // 6. If IMEI is empty, clear validation state immediately
    if (!cleanedImei) {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.variant_id === variantId
            ? {
                ...item,
                imei: '',
                imeiValid: null,
                imeiError: null,
                imeiWarning: null,
              }
            : item
        )
      );
      return;
    }

    // 7. Update cart with EXACT IMEI value (preserve full string)
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variant_id === variantId
          ? {
              ...item,
              imei: cleanedImei,
              imeiValid: null,
              imeiError: null,
              imeiWarning: null,
            }
          : item
      )
    );

    // 8. Debounce validation: wait 500ms after last keystroke
    debounceTimerRef.current[variantId] = setTimeout(async () => {
      // ✅ CRITICAL: Read from REF, not from state (state is stale in this closure)
      const currentRaw = imeiInputsRef.current[variantId] || '';
      const currentCleaned = currentRaw.replace(/[\r\n\t\x00-\x1F]/g, '');

      // Only validate if the input has at least 5 chars
      if (currentCleaned.length < 5) return;

      const result = await validateImei(
        currentCleaned,
        variantId,
        cartItem.product_id
      );

      // If result is stale, do nothing
      if (result.status === 'stale') return;

      // Update cart with validation result - PRESERVE the IMEI value
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.variant_id === variantId
            ? {
                ...item,
                imei: currentCleaned, // keep the full value
                imeiValid: result.valid ? 'valid' : 'invalid',
                imeiError: result.error || null,
                imeiWarning: result.warning || null,
              }
            : item
        )
      );

      // Show toast based on result
      if (result.valid) {
        if (result.warning) {
          toast.warning(result.warning);
        } else {
          toast.success('IMEI is valid');
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    }, 500);
  };

  // ------------------------------------------------------------------
  // ✅ FIXED: Auto-fill IMEI (also updates ref)
  // ------------------------------------------------------------------
  const autoFillImei = async (variantId) => {
    try {
      const response = await axios.post(
        `${API_URL}/imei/auto-assign`,
        {
          variantId,
          orderId: 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.imei) {
        const imei = response.data.imei;
        
        // Update ref immediately
        imeiInputsRef.current[variantId] = imei;
        
        // Update state for UI
        setImeiInputs((prev) => ({ ...prev, [variantId]: imei }));
        
        // Update cart
        setCart((prevCart) =>
          prevCart.map((item) =>
            item.variant_id === variantId
              ? {
                  ...item,
                  imei,
                  imeiId: response.data.imeiId,
                  imeiValid: 'valid',
                  imeiError: null,
                }
              : item
          )
        );
        
        toast.success(`IMEI auto-filled: ${imei}`);
      }
    } catch (err) {
      console.error('Auto-fill failed:', err);
      // Silent fail – user can enter manually
    }
  };

  // ------------------------------------------------------------------
  // Variant selection (unchanged)
  // ------------------------------------------------------------------
  const handleVariantSelect = (productId, variantId) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variantId }));
  };

  const getSelectedVariant = (product) => {
    const selectedId = selectedVariants[product.product_id];
    if (selectedId) {
      return (
        product.variants.find((v) => v.variant_id === selectedId) ||
        product.variants[0]
      );
    }
    return product.variants[0];
  };

  // ------------------------------------------------------------------
  // Add to cart (unchanged)
  // ------------------------------------------------------------------
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
      // Initialize local IMEI input state and ref for this variant
      setImeiInputs((prev) => ({ ...prev, [variant.variant_id]: '' }));
      imeiInputsRef.current[variant.variant_id] = ''; // also initialize ref
      toast.info('Scan or enter IMEI for this product');
    }
  };

  // ------------------------------------------------------------------
  // Quantity updates (unchanged)
  // ------------------------------------------------------------------
  const updateQuantity = (variantId, quantity) => {
    if (quantity <= 0) return removeFromCart(variantId);
    const item = cart.find((i) => i.variant_id === variantId);
    if (item && quantity > item.stock) return setError('Insufficient stock');
    setCart((prevCart) =>
      prevCart.map((i) =>
        i.variant_id === variantId ? { ...i, quantity } : i
      )
    );
  };

  // ------------------------------------------------------------------
  // ✅ FIXED: Remove from cart – also clean ref
  // ------------------------------------------------------------------
  const removeFromCart = (variantId) => {
    setCart((prevCart) => prevCart.filter((i) => i.variant_id !== variantId));
    // Remove from IMEI input state
    setImeiInputs((prev) => {
      const newState = { ...prev };
      delete newState[variantId];
      return newState;
    });
    // ✅ Also delete from ref
    delete imeiInputsRef.current[variantId];
    // Clear any pending debounce timer
    if (debounceTimerRef.current[variantId]) {
      clearTimeout(debounceTimerRef.current[variantId]);
      delete debounceTimerRef.current[variantId];
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Check if all cart items have valid IMEIs
  const allImeisValid = cart.length > 0 && cart.every((item) => item.imeiValid === 'valid');
  const pendingImeis = cart.filter((item) => !item.imei || item.imeiValid !== 'valid');

  // ------------------------------------------------------------------
  // Checkout (unchanged)
  // ------------------------------------------------------------------
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
        {
          cartItems: cart,
          total: total.toFixed(2),
          payment_method: paymentMethod,
        },
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
        {
          cartItems: cart,
          total: total.toFixed(2),
          payment_method: 'mpesa',
          phone_number: mpesaPhone,
        },
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

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!token) {
    navigate('/login');
    return null;
  }

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
    <div className="pos-page-container">
      {/* Info / Error alerts */}
      {isPolling && (
        <div className="pos-info-alert">
          <p>
            Awaiting M-Pesa payment confirmation for Ksh{' '}
            {total.toLocaleString('en-KE')}... Please ask the customer to
            complete the transaction on their phone.
          </p>
        </div>
      )}
      {error && (
        <div className="pos-error-alert">
          <p>{error}</p>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="pos-main-layout">
        {/* Products Grid */}
        <div className="pos-products-section">
          <div className="search-container" style={{ marginBottom: '1rem' }}>
            <div className="relative w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 w-full"
                />
                {searchTerm && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : (
            <div className="pos-products-grid">
              {filteredProducts.map((product) => {
                const variants = product.variants || [];
                const selectedVariant = getSelectedVariant(product);
                const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;
                const hasMultipleVariants = variants.length > 1;

                const selectedVariantImage = selectedVariant?.image;
                const getImageUrl = (path) => {
                  if (!path) return null;
                  if (path.startsWith('http://') || path.startsWith('https://'))
                    return path;
                  return `${API_BASE}/${path.replace(/\\/g, '/')}`;
                };
                const imageUrl = selectedVariantImage
                  ? getImageUrl(selectedVariantImage)
                  : getProductImage(product);

                return (
                  <Card
                    key={product.product_id}
                    className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                  >
                    <CardContent className="p-0">
                      <div className="pos-product-image-wrapper">
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="pos-product-image"
                          onError={(e) => {
                            e.target.src = '/fallback.jpg';
                          }}
                        />
                        {isOutOfStock && (
                          <div className="pos-stock-badge">Out of Stock</div>
                        )}
                      </div>
                      <div className="pos-product-info">
                        <p className="pos-product-title">{product.title}</p>

                        {/* Variant Selector (dropdown) */}
                        {hasMultipleVariants && (
                          <div className="pos-variant-selector">
                            <select
                              value={selectedVariant?.variant_id || ''}
                              onChange={(e) =>
                                handleVariantSelect(
                                  product.product_id,
                                  Number(e.target.value)
                                )
                              }
                              className="pos-variant-dropdown"
                            >
                              {variants.map((v) => (
                                <option
                                  key={v.variant_id}
                                  value={v.variant_id}
                                  disabled={v.stock <= 0}
                                >
                                  {v.color || v.name || `Variant ${v.variant_id}`}
                                  {' - Ksh '}
                                  {v.price?.toLocaleString('en-KE')}
                                  {v.stock <= 0
                                    ? ' (Out of Stock)'
                                    : ` (${v.stock} in stock)`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Variant chips */}
                        {hasMultipleVariants && (
                          <div className="pos-variant-chips">
                            {variants.map((v) => (
                              <button
                                key={v.variant_id}
                                className={`pos-variant-chip ${
                                  selectedVariant?.variant_id === v.variant_id
                                    ? 'active'
                                    : ''
                                } ${v.stock <= 0 ? 'disabled' : ''}`}
                                onClick={() =>
                                  v.stock > 0 &&
                                  handleVariantSelect(
                                    product.product_id,
                                    v.variant_id
                                  )
                                }
                                title={`${v.color || v.name || 'Variant'} - Ksh ${v.price?.toLocaleString('en-KE')} (${v.stock} in stock)`}
                              >
                                {v.color || v.name || `V${v.variant_id}`}
                              </button>
                            ))}
                          </div>
                        )}

                        <p className="pos-product-price">
                          Ksh{' '}
                          {selectedVariant?.price?.toLocaleString('en-KE') ||
                            'N/A'}
                        </p>
                        <p className="pos-product-stock">
                          Stock: {selectedVariant?.stock || 0}
                        </p>
                        <Button
                          onClick={() => addToCart(product)}
                          disabled={isOutOfStock || checkoutLoading || isPolling}
                          className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="pos-cart-section">
          <Card className="sticky-cart">
            <CardHeader>
              <CardTitle>Cart ({cart.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p>Cart is empty</p>
              ) : (
                <>
                  <div className="pos-cart-items">
                    {cart.map((item) => {
                      // Get the current IMEI input value from local state
                      const currentImeiValue = imeiInputs[item.variant_id] ?? item.imei ?? '';

                      return (
                        <div key={item.variant_id} className="pos-cart-item">
                          <div className="pos-cart-item-info">
                            <p className="pos-cart-item-name">{item.title}</p>
                            {item.variantColor && (
                              <p className="pos-cart-item-variant">
                                Variant: {item.variantColor}
                              </p>
                            )}
                            <p className="pos-cart-item-price">
                              Ksh {item.price.toLocaleString('en-KE')}
                            </p>
                            <div className="flex gap-1">
                              {/* ✅ IMEI Input - NO maxLength, value from imeiInputs state */}
                              <Input
                                type="text"
                                placeholder="Scan IMEI/Serial Number"
                                value={currentImeiValue}
                                onChange={(e) => handleImeiChange(item.variant_id, e.target.value)}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                className={`w-full mt-1 text-sm ${
                                  item.imeiValid === 'valid'
                                    ? 'border-green-500 bg-green-50'
                                    : item.imeiValid === 'invalid'
                                    ? 'border-red-500 bg-red-50'
                                    : ''
                                }`}
                              />
                              {item.imeiValid === 'valid' && (
                                <span className="mt-2 text-green-600" title="IMEI Valid">
                                  ✓
                                </span>
                              )}
                              {item.imeiValid === 'invalid' && (
                                <span className="mt-2 text-red-600" title="IMEI Invalid">
                                  ✗
                                </span>
                              )}
                            </div>
                            {!item.imei && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠ Scan IMEI to enable checkout
                              </p>
                            )}
                            {item.imeiError && (
                              <p className="text-xs text-red-500 mt-1">
                                {item.imeiError}
                              </p>
                            )}
                            {item.imeiWarning && (
                              <p className="text-xs text-amber-500 mt-1">
                                {item.imeiWarning}
                              </p>
                            )}
                            {/* Auto-fill button */}
                            {!item.imei && (
                              <button
                                onClick={() => autoFillImei(item.variant_id)}
                                className="text-xs text-blue-600 underline mt-1"
                              >
                                Auto-fill IMEI
                              </button>
                            )}
                          </div>
                          <div className="pos-cart-item-actions">
                            <div className="quantity-controls">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQuantity(item.variant_id, item.quantity - 1)
                                }
                              >
                                -
                              </Button>
                              <span className="quantity-display">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQuantity(item.variant_id, item.quantity + 1)
                                }
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.variant_id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="cart-summary">
                    <div className="cart-total">
                      <span>Total:</span>
                      <span>Ksh {total.toLocaleString('en-KE')}</span>
                    </div>
                    <div className="payment-methods">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === 'cash'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        Cash
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="mpesa"
                          checked={paymentMethod === 'mpesa'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        M-Pesa
                      </label>
                    </div>
                    <Button
                      onClick={handleCheckout}
                      disabled={checkoutLoading || isPolling || !allImeisValid}
                      className={`w-full mt-4 font-bold ${
                        !allImeisValid
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {checkoutLoading
                        ? 'Processing...'
                        : !allImeisValid
                        ? `Scan IMEIs (${pendingImeis.length} pending)`
                        : 'Checkout'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* M-Pesa Modal */}
      {showMpesaModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Enter M-Pesa Phone Number</h3>
            <p>Total: Ksh {total.toLocaleString('en-KE')}</p>
            <Input
              type="tel"
              placeholder="254XXXXXXXXX"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
            />
            {mpesaModalError && <p className="error-text">{mpesaModalError}</p>}
            <div className="modal-actions">
              <Button variant="outline" onClick={() => setShowMpesaModal(false)}>
                Cancel
              </Button>
              <Button className="bg-green-600 text-white" onClick={handleMpesaSubmit}>
                Pay with M-Pesa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;