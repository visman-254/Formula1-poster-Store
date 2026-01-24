import React from 'react';
import './Cart.css';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";  
import API_BASE from "../config";
import { MessageCircle } from "lucide-react";  

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
    if (image && (image.startsWith('http') || image.startsWith('/'))) {
      return image;
    }
    return `${API_BASE}/${image}`;
  };

  //  WhatsApp order message generator (WITH UNIT PRICE + QTY + ITEM TOTAL)
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

  //  Render bundled or single product image
  const renderCartImage = (item) => {
    if (
      item.is_bundle &&
      Array.isArray(item.bundle_products) &&
      item.bundle_products.length >= 2
    ) {
      const leftImage =
        item.bundle_products[0]?.variants?.[0]?.image ||
        item.bundle_products[0]?.primaryImage;
      const rightImage =
        item.bundle_products[1]?.variants?.[0]?.image ||
        item.bundle_products[1]?.primaryImage;

      if (leftImage && rightImage) {
        return (
          <div className="bundle-image-splice-cart">
            <img
              src={resolveImageUrl(leftImage)}
              className="bundle-splice-image-left-cart"
              alt="Bundle item 1"
            />
            <img
              src={resolveImageUrl(rightImage)}
              className="bundle-splice-image-right-cart"
              alt="Bundle item 2"
            />
          </div>
        );
      }
    }

    return (
      <img
        className="card-img"
        src={resolveImageUrl(item.image)}
        alt={item.title}
      />
    );
  };

  if (cartItems.length === 0) {
    return <h1 className="empty-cart">Your cart is empty.</h1>;
  }

  return (
    <div className="cart-container">
      {cartItems.map((item) => (
        <Card key={item.variant_id} className="border-0 shadow-none">
          <CardContent className="card-content-wrapper">
            {renderCartImage(item)}

            <div>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>

              <CardContent className="card-price">
                <Button
                  className="delete-button"
                  onClick={() =>
                    decreaseQuantity(item.variant_id, item.title)
                  }
                >
                  -
                </Button>

                <span>
                  Ksh {parseFloat(item.price).toFixed(2)} ×{" "}
                  {parseInt(item.quantity)} ={" "}
                  <strong>
                    Ksh {(item.price * item.quantity).toFixed(2)}
                  </strong>
                </span>

                <Button
                  className="add-button"
                  onClick={() => addToCart(item)}
                >
                  +
                </Button>
              </CardContent>

              <CardFooter>
                <Button
                  className="remove-from-button"
                  onClick={() =>
                    removeFromCart(item.variant_id, item.title)
                  }
                >
                  Remove
                </Button>
              </CardFooter>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="mt-4 text-xl">
        <p>Total Items: {totalItems}</p>
        <p>Total Price: Kshs {totalPrice.toFixed(2)}</p>
      </div>

      {/*  Checkout + WhatsApp side-by-side */}
      <div className="cart-action-row">
        <Link to="/checkout">
          <Button className="check dark:text-white dark:bg-black">
            Checkout
          </Button>
        </Link>

        <a
          href={generateWhatsAppOrderLink()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="whatsapp-order">
            <MessageCircle size={18} style={{ marginRight: 6 }} />
            Order via WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
};

export default Cart;
