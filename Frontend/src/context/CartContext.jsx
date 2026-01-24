// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import API_BASE from "../config";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// Safely get cart from localStorage
const getInitialCart = () => {
  try {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error("Error reading cart from localStorage:", err);
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(getInitialCart);

  // Load cart from localStorage on mount
  useEffect(() => {
    setCartItems(getInitialCart());
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Add product to cart
  const addToCart = (variant) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.variant_id === variant.variant_id);
      if (existing) {
        toast.success(`${variant.title} quantity increased!`);
        return prev.map((i) =>
          i.variant_id === variant.variant_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        toast.info(`${variant.title} added to cart!`);
        return [...prev, { ...variant, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (variantId, productTitle) => {
    setCartItems((prev) => prev.filter((i) => i.variant_id !== variantId));
    toast.error(`${productTitle} removed from cart.`);
  };

  // Decrease quantity of an item
  const decreaseQuantity = (variantId, productTitle) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.variant_id === variantId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
    toast.warning(`${productTitle} quantity reduced.`);
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
    toast.info("Cart cleared.");
  };

  // Calculate total items and price
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const value = {
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    decreaseQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};