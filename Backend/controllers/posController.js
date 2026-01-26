import { createPOSOrder, generateReceipt, getPOSOrders, getCashierSales } from "../services/pos.js";
import { getProducts } from "../services/product.js";
import { getAccessToken, initiateSTKPush } from "../services/mpesa.js";

/**
 * GET /api/pos/products
 */
export const getPOSProducts = async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching POS products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/**
 * POST /api/pos/checkout
 */
export const checkoutAsCashier = async (req, res) => {
  try {
    const sales_person_id = req.user.id;
    const { cartItems, total, payment_method = "cash", phone_number } = req.body;

    if (!cartItems?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ message: "Invalid total" });
    }

    if (!["cash", "mpesa", "card"].includes(payment_method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // =====================
    // CASH & CARD → COMPLETE SALE IMMEDIATELY
    // =====================
    if (payment_method === "cash" || payment_method === "card") {
      const result = await createPOSOrder(
        sales_person_id,
        total,
        cartItems,
        payment_method
      );

      const receipt = await generateReceipt(result.orderId);

      return res.status(201).json({
        success: true,
        message: "Sale completed",
        receipt,
      });
    }

    // =====================
    // MPESA → PAYMENT FIRST
    // =====================
    if (!phone_number) {
      return res.status(400).json({ message: "Phone number required for Mpesa" });
    }

    const token = await getAccessToken(
      process.env.MPESA_CONSUMER_KEY,
      process.env.MPESA_CONSUMER_SECRET
    );

    let formattedPhone = phone_number.replace(/\D/g, "");
    if (formattedPhone.length === 10) {
      formattedPhone = "254" + formattedPhone.substring(1);
    }

    const stkPush = await initiateSTKPush({
      shortcode: process.env.MPESA_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY,
      amount: Math.round(total),
      phoneNumber: formattedPhone,
      token,
      callbackUrl: `${process.env.APP_URL || "http://localhost:5000"}/api/mpesa/callback`,
    });

    return res.status(200).json({
      success: true,
      message: "M-Pesa prompt sent. Awaiting payment confirmation.",
      checkoutRequestID: stkPush.CheckoutRequestID,
      pendingOrder: {
        sales_person_id,
        cartItems,
        total,
        payment_method,
        phone_number,
      },
    });

  } catch (error) {
    console.error("POS Checkout Error:", error);
    res.status(500).json({ message: "Checkout failed", error: error.message });
  }
};

/**
 * GET /api/pos/receipt/:orderId
 */
export const getReceipt = async (req, res) => {
  try {
    const receipt = await generateReceipt(parseInt(req.params.orderId));
    res.json(receipt);
  } catch (error) {
    console.error("Receipt Error:", error);
    res.status(404).json({ message: "Receipt not found" });
  }
};

/**
 * GET /api/pos/orders
 */
export const getAllPOSOrders = async (req, res) => {
  try {
    const orders = await getPOSOrders(parseInt(req.query.limit || 50));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch POS orders" });
  }
};

/**
 * GET /api/pos/cashier/sales
 */
export const getMySales = async (req, res) => {
  try {
    const stats = await getCashierSales(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sales" });
  }
};

/**
 * GET /api/pos/cashier/:cashierId/sales
 */
export const getCashierSalesAdmin = async (req, res) => {
  try {
    const stats = await getCashierSales(parseInt(req.params.cashierId));
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cashier stats" });
  }
  
};
