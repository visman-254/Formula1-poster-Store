import { createPOSOrder, generateReceipt, getPOSOrders, getCashierSales } from "../services/pos.js";
import { getProducts } from "../services/product.js";
import { getAccessToken, initiateSTKPush } from "../services/mpesa.js";

/**
 * GET /api/pos/products - Get all products for POS interface
 * Only accessible by cashiers
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
 * POST /api/pos/checkout - Create POS order and reduce stock immediately
 * Body: { cartItems, total, payment_method }
 * Only accessible by cashiers
 */
export const checkoutAsCashier = async (req, res) => {
  try {
    const sales_person_id = req.user.id;
    const { cartItems, total, payment_method = "cash", phone_number } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    // Validate payment method
    if (!["cash", "mpesa", "card"].includes(payment_method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Validate phone number for M-Pesa
    if (payment_method === "mpesa") {
      if (!phone_number) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payment" });
      }
    }

    // Create POS order - this will reduce stock immediately
    const result = await createPOSOrder(sales_person_id, total, cartItems, payment_method, phone_number);

    // If M-Pesa, initiate STK push
    if (payment_method === "mpesa") {
      try {
        const token = await getAccessToken(
          process.env.MPESA_CONSUMER_KEY,
          process.env.MPESA_CONSUMER_SECRET
        );

        // Format phone number to international format if needed
        let formattedPhone = phone_number.replace(/\D/g, ""); // Remove non-digits
        if (formattedPhone.length === 10) {
          formattedPhone = "254" + formattedPhone.substring(1); // Convert to 254XXXXXXXXX
        } else if (!formattedPhone.startsWith("254")) {
          formattedPhone = "254" + formattedPhone; // Add country code
        }

        const stkPushResponse = await initiateSTKPush({
          shortcode: process.env.MPESA_SHORTCODE,
          passkey: process.env.MPESA_PASSKEY,
          amount: Math.round(total),
          phoneNumber: formattedPhone,
          token,
          callbackUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/mpesa/callback`,
        });

        // Generate receipt
        const receipt = await generateReceipt(result.orderId);

        return res.status(201).json({
          success: true,
          orderId: result.orderId,
          message: "Sale recorded. M-Pesa prompt sent to buyer's phone",
          receipt,
          mpesaResponse: stkPushResponse,
        });
      } catch (mpesaError) {
        console.error("M-Pesa STK push error:", mpesaError.message);
        // Still return success for POS order, but note the M-Pesa issue
        const receipt = await generateReceipt(result.orderId);
        return res.status(201).json({
          success: true,
          orderId: result.orderId,
          message: "Sale recorded but M-Pesa prompt failed to send. Order created.",
          receipt,
          mpesaError: mpesaError.message,
        });
      }
    }

    // Generate receipt
    const receipt = await generateReceipt(result.orderId);

    res.status(201).json({
      success: true,
      orderId: result.orderId,
      message: "Sale completed successfully",
      receipt,
    });
  } catch (error) {
    console.error("Cashier checkout error:", error);
    res.status(500).json({
      message: "Checkout failed",
      error: error.message,
    });
  }
};

/**
 * GET /api/pos/receipt/:orderId - Get receipt details for a POS order
 * Only accessible by cashiers
 */
export const getReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;

    const receipt = await generateReceipt(parseInt(orderId));
    res.json(receipt);
  } catch (error) {
    console.error("Error generating receipt:", error);
    res.status(404).json({ message: "Order not found or not a POS order" });
  }
};

/**
 * GET /api/pos/orders - Get all POS orders (admin only)
 */
export const getAllPOSOrders = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const orders = await getPOSOrders(parseInt(limit));
    res.json(orders);
  } catch (error) {
    console.error("Error fetching POS orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * GET /api/pos/cashier/sales - Get current cashier's sales stats
 * Only accessible by cashiers
 */
export const getMySales = async (req, res) => {
  try {
    const sales_person_id = req.user.id;
    const stats = await getCashierSales(sales_person_id);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching sales stats:", error);
    res.status(500).json({ message: "Failed to fetch sales statistics" });
  }
};

/**
 * GET /api/pos/cashier/:cashierId/sales - Get specific cashier's sales stats (admin only)
 */
export const getCashierSalesAdmin = async (req, res) => {
  try {
    const { cashierId } = req.params;
    const stats = await getCashierSales(parseInt(cashierId));
    res.json(stats);
  } catch (error) {
    console.error("Error fetching cashier sales:", error);
    res.status(500).json({ message: "Failed to fetch sales statistics" });
  }
};
