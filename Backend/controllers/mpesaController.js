import dotenv from "dotenv";
import db from "../config/db.js";
import { getAccessToken, initiateSTKPush } from "../services/mpesa.js";
import { createOrder } from "../services/orders.js";
import { createPOSOrder } from "../services/pos.js";
import { createOrderItem } from "../services/OrderItems.js";
import { reduceProductStock, getProductByVariantId } from "../services/product.js";
import { sendOrderCreationNotification, sendUserOrderConfirmation } from "../services/whatsapp.js";

dotenv.config();

// Initiate STK Push
export const stkPush = async (req, res) => {
  console.log("STK Push initiated with body:", JSON.stringify(req.body, null, 2));
 try {
 const { phoneNumber, amount, user_id, cartItems, deliveryFee, address } = req.body;
 if (!phoneNumber || !amount || !user_id || !cartItems) {
 return res.status(400).json({ message: "Missing required fields" });
 }

 const token = await getAccessToken(
 process.env.MPESA_CONSUMER_KEY,
 process.env.MPESA_CONSUMER_SECRET
 );

 const response = await initiateSTKPush({
 shortcode: process.env.MPESA_BUSINESS_SHORT_CODE,
 passkey: process.env.MPESA_PASS_KEY,
 amount,
 phoneNumber,
token,
 });

 const checkoutRequestID =
 response.CheckoutRequestID || response.checkoutRequestID;

 // Save pending transaction
 await db.execute(
 `INSERT INTO mpesa_transactions
 (checkout_id, user_id, amount, phone, cart_items, status, delivery_fee, delivery_address)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
 [checkoutRequestID, user_id, amount, phoneNumber, JSON.stringify(cartItems), "pending", deliveryFee, address]
 );

 return res.json({
success: true,
 message: "STK Push initiated. Awaiting user confirmation.",
 checkoutRequestID,
 });
 } catch (err) {
 console.error("STK Push Error:", err);
 return res.status(500).json({ success: false, message: "STK push failed" });
 }
};



// ... (other imports)

export const mpesaCallback = async (req, res) => {
  console.log("M-Pesa Callback Hit:", req.originalUrl); // Log which callback was hit
  console.log("STK Callback Received:", JSON.stringify(req.body, null, 2));

  try {
    const { Body } = req.body;
    const stkCallback = Body?.stkCallback;

    if (!stkCallback) {
      console.log("No valid stkCallback payload in the request body.");
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;
    
    console.log(`Processing callback for CheckoutRequestID: ${CheckoutRequestID} - ResultCode: ${ResultCode} (${ResultDesc})`);

    const [txRows] = await db.execute(
      `SELECT * FROM mpesa_transactions WHERE checkout_id = ? LIMIT 1`,
      [CheckoutRequestID]
    );

    if (!txRows.length) {
      console.log(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}. Ignoring callback.`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const tx = txRows[0];
    console.log("Found transaction in DB:", JSON.stringify(tx, null, 2));

    if (ResultCode === 0) {
      console.log(`Payment successful for ${CheckoutRequestID}.`);
      
      // Robust check for POS: No delivery address (NULL or empty) and has user_id (salesperson)
      const isPosTransaction = (!tx.delivery_address || tx.delivery_address === '') && tx.user_id;

      // Extract metadata common to both flows
      const newAmount = CallbackMetadata?.Item?.find(item => item.Name === "Amount")?.Value;
      const mpesaReceiptNumber = CallbackMetadata?.Item?.find(item => item.Name === "MpesaReceiptNumber")?.Value;
      const amountPaid = newAmount || tx.amount;

      if (isPosTransaction) {
        console.log(`Processing as POS transaction for user ID: ${tx.user_id}`);
        const connection = await db.getConnection();
        try {
          await connection.beginTransaction();

          await connection.execute(
            `UPDATE mpesa_transactions SET status = 'paid', merchant_request_id = ?, updated_at = NOW() WHERE checkout_id = ?`,
            [mpesaReceiptNumber, CheckoutRequestID]
          );

          // Use standard createOrder to avoid deadlocks/issues with createPOSOrder service
          const orderId = await createOrder(tx.user_id, amountPaid, "paid", mpesaReceiptNumber, 0, null, connection);
          const cartItems = JSON.parse(tx.cart_items);

          for (const item of cartItems) {
            const variantId = item.variant_id || item.product_id;
            const orderItemId = await createOrderItem(orderId, variantId, item.quantity, item.price, item.title, item.image, item.imei || null, connection);
            
            // Stock Reduction Logic
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
          
          // Explicitly mark as POS and link checkout ID
          await connection.execute(
            `UPDATE orders SET checkout_request_id = ?, order_type = 'pos', sales_person_id = ? WHERE id = ?`,
            [CheckoutRequestID, tx.user_id, orderId]
          );
          
          console.log(`POS order ${orderId} created successfully via manual flow.`);

          await connection.commit();
          console.log(`Transaction for ${CheckoutRequestID} committed successfully.`);
          
        } catch (posError) {
          console.error(`Error processing POS transaction for ${CheckoutRequestID}:`, posError);
          await connection.rollback();
          await db.execute(
            `UPDATE mpesa_transactions SET status = 'failed', failure_reason = ? WHERE checkout_id = ?`,
            [posError.message, CheckoutRequestID]
          );
        } finally {
          if (connection) connection.release();
        }

      } else {
        console.log(`Processing as regular online order for user ID: ${tx.user_id}`);
        const connection = await db.getConnection();
        try {
          await connection.beginTransaction();

          await connection.execute(
            `UPDATE mpesa_transactions SET status = 'paid', merchant_request_id = ?, updated_at = NOW() WHERE checkout_id = ?`,
            [mpesaReceiptNumber, CheckoutRequestID]
          );

          const orderId = await createOrder(tx.user_id, amountPaid, "paid", mpesaReceiptNumber, tx.delivery_fee, tx.delivery_address, connection);
          const cartItems = JSON.parse(tx.cart_items);

          for (const item of cartItems) {
            const orderItemId = await createOrderItem(orderId, item.variant_id, item.quantity, item.price, item.title, item.image, null, connection);
            const product = await getProductByVariantId(item.variant_id);
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
              totalCOGS = await reduceProductStock(item.variant_id, item.quantity, connection);
              totalCOGS *= item.quantity;
            }

            const averageUnitCOGS = item.quantity > 0 ? totalCOGS / item.quantity : 0;
            await connection.execute('UPDATE order_items SET unit_buying_price = ? WHERE id = ?', [averageUnitCOGS, orderItemId]);
          }

          await connection.commit();

          const orderDetails = { id: orderId, total: amountPaid, cartItems: cartItems, delivery_fee: tx.delivery_fee, delivery_address: tx.delivery_address };
          await sendOrderCreationNotification(orderDetails);
          await sendUserOrderConfirmation(tx.phone, orderDetails);

          console.log(`Payment successful and online order ${orderId} created for ${CheckoutRequestID}.`);
        } catch (transactionError) {
          await connection.rollback();
          console.error("Online Order Transaction Error:", transactionError.message);
          await db.execute(
            `UPDATE mpesa_transactions SET status = 'failed', updated_at = NOW(), failure_reason = ? WHERE checkout_id = ?`,
            [transactionError.message, CheckoutRequestID]
          );
          throw transactionError;
        } finally {
          if (connection) connection.release();
        }
      }
    } else {
      console.log(`Payment failed or was cancelled for ${CheckoutRequestID}. ResultCode: ${ResultCode}. Updating status to 'failed'.`);
      await db.execute(
        `UPDATE mpesa_transactions SET status = 'failed', failure_reason = ? WHERE checkout_id = ?`,
        [ResultDesc, CheckoutRequestID]
      );
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("Fatal mpesaCallback Error:", err.message);
    return res.status(200).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
  }
};

// Frontend polling endpoint
export const getPaymentStatus = async (req, res) => {
 try {
 const { checkoutRequestID } = req.params;
 const [rows] = await db.execute(
 `SELECT status FROM mpesa_transactions WHERE checkout_id = ? LIMIT 1`,
 [checkoutRequestID]
 );
 if (!rows.length) {
 return res.json({ status: "pending" });
 }

 const status = rows[0].status || "pending";
 let receipt = null;

 if (status === "paid") {
   // Fetch order details for receipt generation
   const [orders] = await db.execute(
     `SELECT id, total, created_at, payment_method FROM orders WHERE checkout_request_id = ? LIMIT 1`,
     [checkoutRequestID]
   );

   if (orders.length > 0) {
     const order = orders[0];
     const [items] = await db.execute(
       `SELECT product_name as name, quantity, price FROM order_items WHERE order_id = ?`,
       [order.id]
     );

     receipt = {
       orderId: order.id,
       total: order.total,
       date: order.created_at,
       paymentMethod: order.payment_method,
       items: items.map(i => ({
         name: i.name,
         quantity: i.quantity,
         price: i.price,
         total: i.price * i.quantity
       }))
     };
   }
 }

 return res.json({ status, receipt });
 } catch (err) {
console.error("Error fetching payment status:", err);
 return res.status(500).json({ status: "pending" });
}
};