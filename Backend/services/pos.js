import db from "../config/db.js";
import { reduceProductStock, getProductByVariantId } from "./product.js";
import { createOrderItem } from "./OrderItems.js";

/**
 * Create a POS (Point of Sale) order - immediate stock reduction, no payment callback needed
 * @param {number} sales_person_id - User ID of the cashier
 * @param {number} total - Total amount
 * @param {array} cartItems - Array of items: [{variant_id, quantity, price, title, image}, ...]
 * @param {string} payment_method - Payment method: 'cash', 'mpesa', 'card'
 * @param {string} phone_number - (Optional) Buyer's phone number for M-Pesa
 * @returns {object} Order details with receipt data
 */
export const createPOSOrder = async (sales_person_id, total, cartItems, payment_method = "cash", phone_number = null) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Create order record with order_type='pos'
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, total, status, order_type, sales_person_id, payment_method, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [sales_person_id, total, "pos_completed", "pos", sales_person_id, payment_method]
    );

    const orderId = orderResult.insertId;

    // Process each cart item - reduce stock immediately
    const receiptItems = [];
    for (const item of cartItems) {
      // Create order item
      const orderItemId = await createOrderItem(
        orderId,
        item.variant_id,
        item.quantity,
        item.price,
        item.title,
        item.image,
        connection
      );

      // Get product details to check if bundle
      const product = await getProductByVariantId(item.variant_id);
      let totalCOGS = 0;

      // If bundle, reduce stock for all components
      if (product && product.is_bundle) {
        const bundleComponents = JSON.parse(product.bundle_of || "[]");
        for (const component of bundleComponents) {
          if (component.variant_id && component.quantity) {
            const quantityToReduce = component.quantity * item.quantity;
            const componentCOGS = await reduceProductStock(
              component.variant_id,
              quantityToReduce,
              connection
            );
            totalCOGS += componentCOGS * quantityToReduce;
          }
        }
      } else {
        // Regular product - reduce stock
        totalCOGS = await reduceProductStock(item.variant_id, item.quantity, connection);
        totalCOGS *= item.quantity;
      }

      // Update order item with cost of goods sold
      const averageUnitCOGS = item.quantity > 0 ? totalCOGS / item.quantity : 0;
      await connection.execute(
        "UPDATE order_items SET unit_buying_price = ? WHERE id = ?",
        [averageUnitCOGS, orderItemId]
      );

      // Add to receipt items
      receiptItems.push({
        ...item,
        unit_cost: averageUnitCOGS,
        line_total: item.price * item.quantity,
      });
    }

    await connection.commit();

    return {
      success: true,
      orderId,
      total,
      payment_method,
      phone_number,
      items: receiptItems,
      timestamp: new Date().toISOString(),
      message: "POS order created successfully",
    };
  } catch (err) {
    await connection.rollback();
    console.error("Error creating POS order:", err.message);
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Generate receipt data for printing
 * @param {number} orderId - Order ID
 * @returns {object} Receipt details
 */
export const generateReceipt = async (orderId) => {
  try {
    const [orderRows] = await db.execute(
      `SELECT o.id, o.total, o.created_at, o.payment_method, 
              u.username, u.email
       FROM orders o
       JOIN users u ON o.sales_person_id = u.id
       WHERE o.id = ? AND o.order_type = 'pos'`,
      [orderId]
    );

    if (!orderRows.length) {
      throw new Error("POS order not found");
    }

    const order = orderRows[0];

    // Get order items
    const [items] = await db.execute(
      `SELECT oi.product_name, oi.quantity, oi.price, oi.product_image
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [orderId]
    );

    return {
      orderId: order.id,
      cashier: order.username,
      timestamp: order.created_at,
      paymentMethod: order.payment_method,
      items: items.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      total: order.total,
    };
  } catch (err) {
    console.error("Error generating receipt:", err.message);
    throw err;
  }
};

/**
 * Get POS orders for analytics (admin only)
 * @param {number} limit - Number of records to fetch
 * @returns {array} List of POS orders
 */
export const getPOSOrders = async (limit = 50) => {
  try {
    const [orders] = await db.execute(
      `SELECT o.id, o.total, o.created_at, o.payment_method, u.username
       FROM orders o
       JOIN users u ON o.sales_person_id = u.id
       WHERE o.order_type = 'pos'
       ORDER BY o.created_at DESC
       LIMIT ?`,
      [limit]
    );

    return orders;
  } catch (err) {
    console.error("Error fetching POS orders:", err.message);
    throw err;
  }
};

/**
 * Get POS sales by cashier
 * @param {number} sales_person_id - Cashier user ID
 * @returns {object} Sales statistics
 */
export const getCashierSales = async (sales_person_id) => {
  try {
    const [stats] = await db.execute(
      `SELECT COUNT(*) as total_orders, SUM(total) as total_amount
       FROM orders
       WHERE order_type = 'pos' AND sales_person_id = ?`,
      [sales_person_id]
    );

    return stats[0] || { total_orders: 0, total_amount: 0 };
  } catch (err) {
    console.error("Error fetching cashier sales:", err.message);
    throw err;
  }
};
