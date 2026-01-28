import db from "../config/db.js";
import { reduceProductStock, getProductByVariantId } from "./product.js";
import { createOrderItem } from "./OrderItems.js";

export const createPOSOrder = async (
  sales_person_id,
  total,
  cartItems,
  payment_method = "cash",
  phone_number = null
) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders 
        (user_id, total, status, order_type, sales_person_id, payment_method, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [sales_person_id, total, "paid", "pos", sales_person_id, payment_method]
    );

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await createOrderItem(
        orderId,
        item.variant_id,
        item.quantity,
        item.price,
        item.title,
        item.image,
        item.imei || null,
        connection
      );

      const product = await getProductByVariantId(item.variant_id);

      if (product?.is_bundle) {
        const bundleComponents = JSON.parse(product.bundle_of || "[]");
        for (const component of bundleComponents) {
          const qty = component.quantity * item.quantity;
          await reduceProductStock(component.variant_id, qty, connection);
        }
      } else {
        await reduceProductStock(item.variant_id, item.quantity, connection);
      }
    }

    await connection.commit();

    return {
      success: true,
      orderId,
      total,
      payment_method,
      phone_number,
      timestamp: new Date().toISOString(),
    };

  } catch (err) {
    await connection.rollback();
    console.error("POS ORDER ERROR:", err.message);
    throw err;
  } finally {
    connection.release();
  }
};

export const generateReceipt = async (orderId) => {
  const [orderRows] = await db.execute(
    `SELECT o.id, o.total, o.created_at, o.payment_method, u.username
     FROM orders o
     JOIN users u ON o.sales_person_id = u.id
     WHERE o.id = ? AND o.order_type = 'pos'`,
    [orderId]
  );

  if (!orderRows.length) throw new Error("Receipt not found");

  const [items] = await db.execute(
    `SELECT product_name, quantity, price, imei_serial as imei
     FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  return {
    orderId: orderRows[0].id,
    cashier: orderRows[0].username,
    timestamp: orderRows[0].created_at,
    paymentMethod: orderRows[0].payment_method,
    items: items.map((i) => ({
      name: i.product_name,
      quantity: i.quantity,
      price: i.price,
      total: i.price * i.quantity,
      imei: i.imei ,
    })),
    total: orderRows[0].total,
  };
};

export const getPOSOrders = async (limit = 50) => {
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
};

export const getCashierSales = async (sales_person_id) => {
  const [stats] = await db.execute(
    `SELECT COUNT(*) as total_orders, SUM(total) as total_amount
     FROM orders WHERE order_type = 'pos' AND sales_person_id = ?`,
    [sales_person_id]
  );

  return stats[0] || { total_orders: 0, total_amount: 0 };
};
