import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
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

  // --- Polling State ---
  const [isPolling, setIsPolling] = useState(false);
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState(null);
  const pollingIntervalRef = useRef(null);

  const API_URL = `${API_BASE}/api`;
  const token = localStorage.getItem('token');

  // --- Utility Functions ---
  const resetSale = () => {
    setCart([]);
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

  // --- API Calls ---
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

  // --- Polling Logic ---
  useEffect(() => {
    if (isPolling && mpesaCheckoutId) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const { data } = await axios.get(`${API_URL}/pos/payment-status/${mpesaCheckoutId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (data.status === 'paid' && data.receipt) {
            setReceiptData(data.receipt);
            setShowReceipt(true);
            resetSale(); // This will also stop the polling
          } else if (['failed', 'cancelled', 'not_found', 'paid_but_order_failed'].includes(data.status)) {
            setError(`Payment failed or was not found. Status: ${data.status}`);
            resetSale();
          }
          // If status is 'pending', do nothing and let it poll again.
        } catch (err) {
          console.error('Polling error:', err);
          setError('An error occurred while checking payment status.');
          resetSale();
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, mpesaCheckoutId, API_URL, token]);


  // Get product image
  const getProductImage = (product) => {
    if (!product) return '/fallback.jpg';
    if (product.is_bundle && product.bundleImages?.length > 0) return product.bundleImages[0];
    const variant = product.variants?.[0];
    if (variant?.image) return variant.image;
    if (product.images?.length > 0) return product.images[0]?.image_url || product.images[0];
    if (product.primaryImage) return product.primaryImage;
    return '/fallback.jpg';
  };

  const filteredProducts = products.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- Cart Functions ---
  const updateImei = (variant_id, imeiValue) => setCart(cart.map((i) => (i.variant_id === variant_id ? { ...i, imei: imeiValue } : i)));
  const addToCart = (product) => {
    const variant = product.variants[0];
    if (!variant || variant.stock <= 0) return setError('Product out of stock');
    const existing = cart.find((i) => i.variant_id === variant.variant_id);
    if (existing) {
      if (existing.quantity >= variant.stock) return setError('Insufficient stock');
      updateQuantity(variant.variant_id, existing.quantity + 1);
    } else {
      setCart([...cart, { ...product, ...variant, quantity: 1, title: product.title, image: getProductImage(product), imei: '' }]);
    }
  };
  const updateQuantity = (variant_id, quantity) => {
    if (quantity <= 0) return removeFromCart(variant_id);
    const item = cart.find((i) => i.variant_id === variant_id);
    if (item && quantity > item.stock) return setError('Insufficient stock');
    setCart(cart.map((i) => (i.variant_id === variant_id ? { ...i, quantity } : i)));
  };
  const removeFromCart = (variant_id) => setCart(cart.filter((i) => i.variant_id !== variant_id));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- Checkout Functions ---
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
      const response = await axios.post(`${API_URL}/pos/checkout`, {
        cartItems: cart, total: total.toFixed(2), payment_method: paymentMethod,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setReceiptData(response.data.receipt);
      setShowReceipt(true);
      resetSale();
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Checkout failed');
      setCheckoutLoading(false);
    }
  };

  const initiateMpesaPayment = async () => {
    setCheckoutLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/pos/checkout`, {
        cartItems: cart, total: total.toFixed(2), payment_method: 'mpesa', phone_number: mpesaPhone,
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.success && response.data.checkoutRequestID) {
        setMpesaCheckoutId(response.data.checkoutRequestID);
        setIsPolling(true);
      } else {
        throw new Error("M-Pesa initiation failed. No Checkout ID received.");
      }
    } catch (err) {
      console.error('M-Pesa initiation error:', err);
      setError(err.response?.data?.message || 'M-Pesa initiation failed.');
      setCheckoutLoading(false);
    }
  };

  // --- RENDER LOGIC ---
  if (!token) {
    navigate('/login');
    return null;
  }

  if (showReceipt && receiptData) {
    return <POSReceipt receipt={receiptData} onNewSale={() => { setShowReceipt(false); setReceiptData(null); }} />;
  }

  return (
    <div className="pos-page-container">
      {/* Search Section & Alerts */}
      {isPolling && (
        <div className="pos-info-alert">
          <p>Awaiting M-Pesa payment confirmation for Ksh {total.toLocaleString('en-KE')}... Please ask the customer to complete the transaction on their phone.</p>
        </div>
      )}
      {error && (
        <div className="pos-error-alert">
          <p>{error}</p>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      
      {/* Main Layout */}
      <div className="pos-main-layout">
        {/* Products Grid */}
        <div className="pos-products-section">
          {loading ? <p>Loading...</p> : (
            <div className="pos-products-grid">
              {filteredProducts.map((product) => (
                <Card key={product.product_id} className={`pos-product-card ${product.variants[0]?.stock <= 0 ? 'out-of-stock' : ''}`}>
                  <CardContent className="p-0">
                    <img src={getProductImage(product)} alt={product.title} className="pos-product-image" />
                    {product.variants[0]?.stock <= 0 && <div className="pos-stock-badge">Out of Stock</div>}
                    <div className="pos-product-info">
                      <p className="pos-product-title">{product.title}</p>
                      <p className="pos-product-price">Ksh {product.variants[0]?.price?.toLocaleString('en-KE')}</p>
                      <Button onClick={() => addToCart(product)} disabled={product.variants[0]?.stock <= 0 || checkoutLoading || isPolling} className="w-full mt-2">Add to Cart</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="pos-cart-section">
          <Card className="sticky-cart">
            <CardHeader><CardTitle>Cart ({cart.length})</CardTitle></CardHeader>
            <CardContent>
              {cart.length === 0 ? <p>Cart is empty</p> : (
                <>
                  <div className="pos-cart-items">
                    {cart.map((item) => (
                      <div key={item.variant_id} className="pos-cart-item">
                        <div>
                          <p>{item.title}</p>
                          <p>Ksh {item.price.toLocaleString('en-KE')}</p>
                          <Input type='text' placeholder='IMEI/Serial' value={item.imei} onChange={(e) => updateImei(item.variant_id, e.target.value)} className="w-full mt-1" />
                        </div>
                        <div className="pos-cart-quantity">
                          <button onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}>−</button>
                          <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.variant_id, parseInt(e.target.value) || 1)} />
                          <button onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}>+</button>
                        </div>
                        <p>Ksh {(item.price * item.quantity).toLocaleString('en-KE')}</p>
                        <button onClick={() => removeFromCart(item.variant_id)}><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="pos-cart-summary">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-lg">Ksh {total.toLocaleString('en-KE')}</span>
                  </div>
                  <div className="pos-payment-method">
                    <select id="payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} disabled={checkoutLoading || isPolling} className="w-full mt-2 p-2">
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <Button onClick={handleCheckout} disabled={checkoutLoading || cart.length === 0 || isPolling} className="w-full mt-4">
                    {checkoutLoading ? (isPolling ? 'Awaiting Payment...' : 'Processing...') : '✓ Checkout & Print'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* M-Pesa Modal */}
      {showMpesaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader><CardTitle>M-Pesa Payment</CardTitle></CardHeader>
            <CardContent>
              <p>Enter phone number to receive payment prompt.</p>
              <Input id="mpesa-phone" type="tel" placeholder="e.g., 0712345678" value={mpesaPhone} onChange={(e) => { setMpesaPhone(e.target.value); setMpesaModalError(''); }} autoFocus />
              {mpesaModalError && <p className="text-red-500 text-sm mt-2">{mpesaModalError}</p>}
              <p>Amount: <strong>Ksh {total.toLocaleString('en-KE')}</strong></p>
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
              <Button onClick={() => setShowMpesaModal(false)} variant="ghost">Cancel</Button>
              <Button onClick={handleMpesaSubmit} disabled={!mpesaPhone.trim()}>✓ Proceed</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default POSPage;