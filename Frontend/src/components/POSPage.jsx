import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import POSReceipt from './POSReceipt';
import './POSPage.css';

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

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/products`, {
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
  }, [token]);

  // Get product image from variant or gallery
  const getProductImage = (product) => {
    if (!product) return '/fallback.jpg';
    
    // For bundles, use bundleImages if available
    if (product.is_bundle && product.bundleImages && product.bundleImages.length > 0) {
      return product.bundleImages[0];
    }

    // Try variant image first
    const variant = product.variants?.[0];
    if (variant?.image) {
      return variant.image;
    }

    // Try product gallery images
    if (product.images && product.images.length > 0) {
      const galleryImage = product.images[0]?.image_url || product.images[0];
      if (galleryImage) return galleryImage;
    }

    // Fallback to primaryImage
    if (product.primaryImage) {
      return product.primaryImage;
    }

    return '/fallback.jpg';
  };

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    // Skip products without variants (except bundles)
    if (!product.is_bundle && (!product.variants || product.variants.length === 0)) {
      return false;
    }
    return product.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Add to cart
  const addToCart = (product) => {
    const variant = product.variants[0];
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
      setCart([
        ...cart,
        {
          variant_id: variant.variant_id,
          product_id: product.product_id,
          title: product.title,
          price: variant.price,
          image: getProductImage(product),
          quantity: 1,
          stock: variant.stock,
        },
      ]);
    }
    setError('');
  };

  // Update quantity
  const updateQuantity = (variant_id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(variant_id);
      return;
    }

    const item = cart.find((item) => item.variant_id === variant_id);
    if (item && quantity > item.stock) {
      setError('Insufficient stock');
      return;
    }

    setCart(
      cart.map((item) =>
        item.variant_id === variant_id ? { ...item, quantity } : item
      )
    );
    setError('');
  };

  // Remove from cart
  const removeFromCart = (variant_id) => {
    setCart(cart.filter((item) => item.variant_id !== variant_id));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.16; // Assuming 16% VAT
  const total = subtotal + tax;

  // Handle checkout - show M-Pesa modal if needed, otherwise process
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (paymentMethod === 'mpesa') {
      // For M-Pesa, show phone number modal instead of processing immediately
      setShowMpesaModal(true);
      setMpesaModalError('');
      return;
    }

    // For cash and card, process immediately
    await processCheckout();
  };

  // Handle M-Pesa phone submission
  const handleMpesaSubmit = async () => {
    if (!mpesaPhone.trim()) {
      setMpesaModalError('Phone number is required');
      return;
    }

    // Validate phone number format (optional - adjust as needed)
    if (!/^\d{10,}$/.test(mpesaPhone.replace(/\D/g, ''))) {
      setMpesaModalError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    // Close modal and process checkout
    setShowMpesaModal(false);
    await processCheckout();
  };

  // Process the actual checkout
  const processCheckout = async () => {
    setCheckoutLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE}/pos/checkout`,
        {
          cartItems: cart,
          total: total.toFixed(2),
          payment_method: paymentMethod,
          ...(paymentMethod === 'mpesa' && { phone_number: mpesaPhone }),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Show receipt
      setReceiptData(response.data.receipt);
      setShowReceipt(true);
      setCart([]);
      setMpesaPhone('');
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  if (showReceipt && receiptData) {
    return <POSReceipt receipt={receiptData} onNewSale={() => setShowReceipt(false)} />;
  }

  return (
    <div className="pos-page-container">
      {/* Search Section */}
      <div className="pos-search-section">
        <div className="pos-search-wrapper">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 h-10 text-sm border border-gray-300 rounded-md focus:border-transparent dark:border-gray-600 dark:text-white w-full sm:w-64"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
            {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
          </div>
        </div>
      </div>

      {error && (
        <div className="pos-error-alert">
          <p>{error}</p>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="pos-main-layout">
        {/* Products Grid - Left Side */}
        <div className="pos-products-section">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="pos-products-grid">
              {filteredProducts.map((product) => {
                const variant = product.variants?.[0];
                const isOutOfStock = !variant || variant.stock <= 0;
                const imageUrl = getProductImage(product);

                return (
                  <Card key={product.product_id} className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
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
                        <p className="pos-product-price">Ksh {variant?.price?.toLocaleString('en-KE') || 'N/A'}</p>
                        <p className="pos-product-stock">Stock: {variant?.stock || 0}</p>
                        <Button
                          onClick={() => addToCart(product)}
                          disabled={isOutOfStock || checkoutLoading}
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
          ) : (
            <div className="empty-search">
              <p>No products found</p>
            </div>
          )}
        </div>

        {/* Cart Section - Right Side */}
        <div className="pos-cart-section">
          <Card className="sticky-cart">
            <CardHeader>
              <CardTitle className="text-lg">🛒 Cart ({cart.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="empty-cart-message">
                  <p>Cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="pos-cart-items">
                    {cart.map((item) => (
                      <div key={item.variant_id} className="pos-cart-item">
                        <div className="pos-cart-item-info">
                          <p className="pos-cart-item-name">{item.title}</p>
                          <p className="pos-cart-item-price">Ksh {item.price.toLocaleString('en-KE')}</p>
                        </div>
                        <div className="pos-cart-quantity">
                          <button
                            onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                            className="qty-btn"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.variant_id, parseInt(e.target.value) || 1)
                            }
                            className="qty-input"
                          />
                          <button
                            onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>
                        <p className="pos-cart-item-total">
                          Ksh {(item.price * item.quantity).toLocaleString('en-KE')}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.variant_id)}
                          className="pos-cart-remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Cart Totals */}
                  <div className="pos-cart-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>Ksh {subtotal.toLocaleString('en-KE', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="summary-row">
                      <span>VAT (16%):</span>
                      <span>Ksh {tax.toLocaleString('en-KE', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="summary-row total">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-lg">Ksh {total.toLocaleString('en-KE', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="pos-payment-method">
                    <label htmlFor="payment" className="text-sm font-semibold">Payment Method:</label>
                    <select
                      id="payment"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full mt-2 p-2 border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    >
                      <option value="cash">💰 Cash</option>
                      <option value="mpesa">📱 M-Pesa</option>
                      <option value="card">💳 Card</option>
                    </select>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || cart.length === 0}
                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 rounded-lg"
                  >
                    {checkoutLoading ? '⏳ Processing...' : '✓ Checkout & Print'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* M-Pesa Phone Modal */}
      {showMpesaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">📱 M-Pesa Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter the buyer's phone number to receive M-Pesa payment prompt
              </p>
              <div>
                <label htmlFor="mpesa-phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder="e.g., 0712345678"
                  value={mpesaPhone}
                  onChange={(e) => {
                    setMpesaPhone(e.target.value);
                    setMpesaModalError('');
                  }}
                  className="w-full"
                  autoFocus
                />
                {mpesaModalError && (
                  <p className="text-red-500 text-sm mt-2">{mpesaModalError}</p>
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md text-sm">
                <p className="text-blue-800 dark:text-blue-200">
                  Amount to pay: <strong>Ksh {total.toLocaleString('en-KE', { maximumFractionDigits: 2 })}</strong>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  setShowMpesaModal(false);
                  setMpesaPhone('');
                  setMpesaModalError('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-black"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMpesaSubmit}
                disabled={checkoutLoading || !mpesaPhone.trim()}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {checkoutLoading ? '⏳ Processing...' : '✓ Proceed'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default POSPage;
