import { createPOSOrder, generateReceipt, getPOSOrders, getCashierSales } from "../services/pos.js";
import { getProducts, reduceProductStock, getProductByVariantId } from "../services/product.js";
import { createOrder } from "../services/orders.js";
import { createOrderItem } from "../services/OrderItems.js";
import { getAccessToken, initiateSTKPush } from "../services/mpesa.js";
import db from "../config/db.js";

// Helper to format image URLs
const formatProductImage = (req, image) => {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;

  // Normalize path separators to forward slashes
  const normalizedImage = String(image).replace(/\\/g, "/");

  const cleaned = normalizedImage.replace(/^\/+/, "");
  const normalizedPath = cleaned.includes("uploads/images")
    ? cleaned
    : `uploads/images/${cleaned}`;

  return `${req.protocol}://${req.get("host")}/${normalizedPath}`;
};

const formatProduct = (req, product) => {
  const formattedProduct = { ...product };

  // 1. Format all standard variant images first
  if (formattedProduct.variants) {
    formattedProduct.variants = formattedProduct.variants.map(variant => ({
      ...variant,
      image: formatProductImage(req, variant.image),
    }));
  }

  // 2. Handle Bundle Image Splicing
  if (formattedProduct.is_bundle) {
    // Format child products recursively
    if (formattedProduct.bundle_products) {
      formattedProduct.bundle_products = formattedProduct.bundle_products.map(bp => formatProduct(req, bp));
    }

    // Get images from product.images (gallery) first, then fallback to bundle_products
    let bundleImages = [];
    if (formattedProduct.images && formattedProduct.images.length >= 2) {
      bundleImages = formattedProduct.images.slice(0, 2).map(img => formatProductImage(req, img));
    } else if (formattedProduct.bundle_products && formattedProduct.bundle_products.length > 0) {
      bundleImages = formattedProduct.bundle_products
        .map(bp => bp.primaryImage)
        .filter(img => img !== null)
        .slice(0, 2);
    }

    // Set a new property 'bundleImages' for the frontend to use
    if (bundleImages.length >= 2) {
      formattedProduct.bundleImages = bundleImages;
    }

    // Set primaryImage
    formattedProduct.primaryImage = bundleImages.length > 0 ? bundleImages[0] : null;

  } else {
    // Standard product logic
    const firstVariantWithImage = formattedProduct.variants?.find(v => v.image);
    if (firstVariantWithImage) {
      formattedProduct.primaryImage = firstVariantWithImage.image;
    } else if (formattedProduct.images && formattedProduct.images.length > 0) {
      formattedProduct.primaryImage = formatProductImage(req, formattedProduct.images[0]);
    } else {
      formattedProduct.primaryImage = null;
    }
  }

  return formattedProduct;
};

/**
 * GET /api/pos/products
 */
export const getPOSProducts = async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products.map((p) => formatProduct(req, p)));
  } catch (error) {
    console.error("Error fetching POS products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/**
 * POST /api/pos/checkout
 */
export const checkoutAsCashier = async (req, res) => {
  console.log("Received POS checkout request:", JSON.stringify(req.body, null, 2));

  try {
    const sales_person_id = req.user.id;
    const { cartItems, total, payment_method = "cash", phone_number } = req.body;

    if (!cartItems?.length) {
      console.log("Checkout failed: Cart is empty.");
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!total || total <= 0) {
      console.log(`Checkout failed: Invalid total - ${total}`);
      return res.status(400).json({ message: "Invalid total" });
    }

    if (!["cash", "mpesa", "card"].includes(payment_method)) {
      console.log(`Checkout failed: Invalid payment method - ${payment_method}`);
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // =====================
    // CASH & CARD → COMPLETE SALE IMMEDIATELY
    // =====================
    if (payment_method === "cash" || payment_method === "card") {
      console.log(`Processing ${payment_method} payment for user ${sales_person_id}...`);
      
      const connection = await db.getConnection();
      let orderId;
      
      try {
        await connection.beginTransaction();
        
        // Create base order
        orderId = await createOrder(sales_person_id, total, "paid", null, 0, null, connection);
        
        // Process items
        for (const item of cartItems) {
            const variantId = item.variant_id || item.product_id;
            const orderItemId = await createOrderItem(orderId, variantId, item.quantity, item.price, item.title, item.image, item.imei || null, connection);
            
            // Stock Reduction
            const product = await getProductByVariantId(variantId);
            let totalCOGS = 0;

            if (product && product.is_bundle) {
              const bundleComponents = JSON.parse(product.bundle_of || '[]');
              for (const component of bundleComponents) {
                if (component.variant_id && component.quantity) {
                  const quantityToReduce = component.quantity * item.quantity;
                  const componentCOGS = await reduceProductStock(component.variant_id, quantityToReduce, connection);
                  totalCOGS += componentCOGS * quantityToReduce;
                }
              }
            } else {
              totalCOGS = await reduceProductStock(variantId, item.quantity, connection);
              totalCOGS *= item.quantity;
            }
            
            const averageUnitCOGS = item.quantity > 0 ? totalCOGS / item.quantity : 0;
            await connection.execute('UPDATE order_items SET unit_buying_price = ? WHERE id = ?', [averageUnitCOGS, orderItemId]);
        }

        // Mark as POS
        await connection.execute(
            `UPDATE orders SET order_type = 'pos', sales_person_id = ?, payment_method = ? WHERE id = ?`,
            [sales_person_id, payment_method, orderId]
        );

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }

      const receipt = await generateReceipt(orderId);
      console.log(`Sale completed successfully for order: ${orderId}. Sending response.`);

      return res.status(201).json({
        success: true,
        message: "Sale completed",
        receipt,
      });
    }

    // =====================
    // MPESA → PAYMENT FIRST
    // =====================
    console.log("Processing M-Pesa payment...");
    if (!phone_number) {
      console.log("M-Pesa checkout failed: Phone number is required.");
      return res.status(400).json({ message: "Phone number required for Mpesa" });
    }

    console.log("Requesting M-Pesa access token...");
    const token = await getAccessToken(
      process.env.MPESA_CONSUMER_KEY,
      process.env.MPESA_CONSUMER_SECRET
    );
    console.log("M-Pesa access token obtained:", token ? "Token received" : "Token is null/undefined");

    let formattedPhone = phone_number.replace(/\D/g, "");
    if (formattedPhone.length === 10) {
      formattedPhone = "254" + formattedPhone.substring(1);
    }
    console.log(`Formatted phone number: ${formattedPhone}`);

    console.log("Initiating STK push...");
    const stkPush = await initiateSTKPush({
      shortcode: process.env.MPESA_BUSINESS_SHORT_CODE,
      passkey: process.env.MPESA_PASS_KEY,
      amount: Math.round(total),
      phoneNumber: formattedPhone,
      token,
    });
    console.log("STK push initiated. Response:", stkPush);
    
    const checkoutRequestID = stkPush.CheckoutRequestID || stkPush.checkoutRequestID;
    console.log(`CheckoutRequestID: ${checkoutRequestID}`);

    if (!checkoutRequestID) {
      console.error("STK Push failed: No CheckoutRequestID in response.", stkPush);
      return res.status(500).json({
        message: "M-Pesa STK push failed. Check server logs.",
        error: stkPush.errorMessage || "No checkout request ID returned."
      });
    }

    console.log("Saving pending transaction to database...");
    await db.execute(
      `INSERT INTO mpesa_transactions
      (checkout_id, user_id, amount, phone, cart_items, status, delivery_address)
      VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [checkoutRequestID, sales_person_id, Math.round(total), formattedPhone, JSON.stringify(cartItems), "pending"]
    );
    console.log("Pending transaction saved successfully.");

    return res.status(200).json({
      success: true,
      message: "M-Pesa prompt sent. Awaiting payment confirmation.",
      checkoutRequestID,
    });

  } catch (error) {
    console.error("POS Checkout Error:", error);
    res.status(500).json({ message: "Checkout failed", error: error.message });
  }
};

/**
 * GET /api/pos/payment-status/:checkoutId
 */
export const getPOSPaymentStatus = async (req, res) => {
  try {
    const { checkoutId } = req.params;

    // 1. Check status in mpesa_transactions
    const [txRows] = await db.execute(
      `SELECT status FROM mpesa_transactions WHERE checkout_id = ? LIMIT 1`,
      [checkoutId]
    );

    if (!txRows.length) {
      return res.status(404).json({ status: "not_found" });
    }

    const status = txRows[0].status;

    // 2. If paid, find order and generate receipt
    if (status === "paid") {
      const [orderRows] = await db.execute(
        `SELECT id FROM orders WHERE checkout_request_id = ? LIMIT 1`,
        [checkoutId]
      );

      if (!orderRows.length) {
        // This case can happen if the callback processed but failed to create the order
        return res.status(404).json({ status: "paid_but_order_failed" });
      }
      
      const orderId = orderRows[0].id;
      const receipt = await generateReceipt(orderId);
      
      return res.json({ status: "paid", receipt });
    }

    // 3. If not paid, just return the status
    return res.json({ status });

  } catch (error) {
    console.error("Get POS Payment Status Error:", error);
    res.status(500).json({ message: "Failed to get payment status", error: error.message });
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