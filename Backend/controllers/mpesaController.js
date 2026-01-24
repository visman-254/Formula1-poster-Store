import dotenv from "dotenv";
import db from "../config/db.js";
import { getAccessToken, initiateSTKPush } from "../services/mpesa.js";
import { createOrder } from "../services/orders.js";
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

// Safaricom callback
export const mpesaCallback = async (req, res) => {
 try {
 const { Body } = req.body;
 const stkCallback = Body?.stkCallback;

 if (!stkCallback) {
 console.log("No valid callback body received.");
 return res.status(200).json({ message: "No valid callback body" });
 }

console.log("STK Callback Received:", JSON.stringify(req.body, null, 2));

 const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;
 const checkoutID = CheckoutRequestID;
 let newStatus = "failed"; // default status

 const [txRows] = await db.execute(
 `SELECT * FROM mpesa_transactions WHERE checkout_id = ? LIMIT 1`,
[checkoutID]
);

 if (!txRows.length) {
 console.log("Transaction not found for checkout ID:", checkoutID);
return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" }); }

const tx = txRows[0];
  console.log("Transaction from DB:", JSON.stringify(tx, null, 2));

 if (ResultCode === 0) {
    const connection = await db.getConnection(); // Get connection from the pool
    try {
      await connection.beginTransaction(); // Start transaction

      const newAmount = CallbackMetadata?.Item?.find(item => item.Name === "Amount")?.Value;
      const mpesaReceiptNumber = CallbackMetadata?.Item?.find(item => item.Name === "MpesaReceiptNumber")?.Value;
      const amountPaid = newAmount || tx.amount;

      // Update mpesa_transactions within the transaction
      await connection.execute(
        `UPDATE mpesa_transactions SET status = 'paid', merchant_request_id = ?, updated_at = NOW() WHERE checkout_id = ?`,
        [mpesaReceiptNumber, checkoutID]
      );

      // Pass connection to createOrder
      const orderId = await createOrder(tx.user_id, amountPaid, "paid", mpesaReceiptNumber, tx.delivery_fee, tx.delivery_address, connection);

      const cartItems = JSON.parse(tx.cart_items);
      for (const item of cartItems) {
        // Pass connection to createOrderItem
        const orderItemId = await createOrderItem(
          orderId,
          item.variant_id,
          item.quantity,
          item.price,
          item.title,
          item.image,
          connection
        );

        const product = await getProductByVariantId(item.variant_id);
        let totalCOGS = 0;

        if (product && product.is_bundle) {
          const bundleComponents = JSON.parse(product.bundle_of || '[]');
          for (const component of bundleComponents) {
            if (component.variant_id && component.quantity) {
              const quantityToReduce = component.quantity * item.quantity;
              // Pass connection to reduceProductStock
              const componentCOGS = await reduceProductStock(component.variant_id, quantityToReduce, connection);
              totalCOGS += componentCOGS * quantityToReduce;
            }
          }
        } else {
          // Pass connection to reduceProductStock
          totalCOGS = await reduceProductStock(item.variant_id, item.quantity, connection);
          totalCOGS *= item.quantity;
        }

        const averageUnitCOGS = item.quantity > 0 ? totalCOGS / item.quantity : 0;
        // Use connection for the update
        await connection.execute(
          'UPDATE order_items SET unit_buying_price = ? WHERE id = ?',
          [averageUnitCOGS, orderItemId]
        );
      }

      await connection.commit(); // Commit the transaction if all goes well

      // Notifications should only be sent after a successful commit
      const orderDetails = {
        id: orderId,
        total: amountPaid,
        cartItems: cartItems,
        delivery_fee: tx.delivery_fee,
        delivery_address: tx.delivery_address
      };
      await sendOrderCreationNotification(orderDetails);
      await sendUserOrderConfirmation(tx.phone, orderDetails);

      console.log("Payment successful and order created:", checkoutID);

    } catch (transactionError) {
      await connection.rollback(); // Rollback on error
      console.error("Transaction Error:", transactionError.message);

      // Decide on the final status based on the error
      // For instance, if it's a stock issue, you might want a specific status.
      await db.execute(
        `UPDATE mpesa_transactions SET status = 'failed', updated_at = NOW(), failure_reason = ? WHERE checkout_id = ?`,
        [transactionError.message, checkoutID]
      );

      // Rethrow or handle, but for the callback, we must still respond gracefully.
      // The main catch block will handle the final response to Safaricom.
      throw transactionError; // Re-throw to be caught by the outer catch

    } finally {
      if (connection) connection.release(); // Release connection back to the pool
    }
  } else {
 console.log(`Payment failed/cancelled for ${checkoutID}. Result Code: ${ResultCode}, Description: ${ResultDesc}`);
 newStatus = "failed";
 await db.execute(
 `UPDATE mpesa_transactions SET status = ?, updated_at = NOW() WHERE checkout_id = ?`,
 [newStatus, checkoutID]
 );
 }

 return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
 } catch (err) {
 console.error("mpesaCallback Error:", err);
 return res.status(200).json({ ResultCode: 0, ResultDesc: "Internal Server Error" });
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

 return res.json({ status: rows[0].status || "pending" });
 } catch (err) {
console.error("Error fetching payment status:", err);
 return res.status(500).json({ status: "pending" });
}
};