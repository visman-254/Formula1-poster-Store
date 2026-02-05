import db from "../config/db.js";

const groupOrders = (rows, isAdmin = false) => {
  const orders = {};
  rows.forEach(row => {
    if (!orders[row.order_id]) {
      orders[row.order_id] = {
        id: row.order_id,
        total: row.total,
        status: row.status,
        order_type: row.order_type,
        sales_person_id: row.sales_person_id,
        created_at: row.created_at,
        delivery_fee: row.delivery_fee,
        delivery_address: row.delivery_address,
        paid_for_delivery: row.paid_for_delivery,
        items: [],
      };
      if (isAdmin) {
        orders[row.order_id].user = {
          id: row.user_id,
          username: row.username,
          email: row.email,
        };
        orders[row.order_id].mpesa_details = {
          phone: row.mpesa_phone,
          merchant_request_id: row.mpesa_merchant_request_id,
        };
      }
    }
    if (row.variant_id) {
      orders[row.order_id].items.push({
        variant_id: row.variant_id,
        name: row.product_name,
        image: row.product_image,
        color: row.color,
        quantity: row.quantity,
        price: row.price,
        unit_buying_price: row.unit_buying_price,
        unit_discount: row.unit_discount,
      });
    }
  });
  return Object.values(orders);
};

// ---------------- CREATE ----------------

// Create an order
export const createOrder = async (user_id, total, status = "pending", mpesa_merchant_request_id = null, delivery_fee = 0, delivery_address = null, connection = null) => {
  console.log("Creating order with params:", { user_id, total, status, mpesa_merchant_request_id, delivery_fee, delivery_address });
  const paid_for_delivery = delivery_fee > 0;
  const dbConnection = connection || db;
  const [result] = await dbConnection.execute(
    "INSERT INTO orders (user_id, total, status, mpesa_merchant_request_id, delivery_fee, delivery_address, paid_for_delivery) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [user_id, total, status, mpesa_merchant_request_id, delivery_fee, delivery_address, paid_for_delivery]
  );
  return result.insertId;
};

// ---------------- GET (User Orders) ----------------

export const getOrders = async (user_id) => {
  const [rows] = await db.execute(
    `SELECT 
      o.id AS order_id,
      o.total,
      o.status,
      o.created_at,
      o.delivery_fee,
      o.delivery_address,
      o.paid_for_delivery,
      oi.variant_id,
      oi.quantity,
      oi.price,
      oi.unit_buying_price,
      oi.unit_discount,
      oi.product_name AS product_name, 
      oi.product_image AS product_image, 
      pv.color
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC`,
    [user_id]
  );

  console.log('Rows from DB:', JSON.stringify(rows, null, 2));

  return groupOrders(rows);
};

// ---------------- ADMIN ORDERS ----------------

// Get ALL orders (admin only)
export const giveAllOrders = async () => {
  const [rows] = await db.execute(
    `SELECT 
      o.id AS order_id,
      o.user_id,
      o.total,
      o.status,
      o.order_type,
      o.created_at,
      o.delivery_fee,
      o.delivery_address,
      o.paid_for_delivery,
      o.sales_person_id,
      u.username,
      u.email,
      oi.variant_id,
      oi.quantity,
      oi.price,
      oi.unit_buying_price,
      oi.unit_discount,
      oi.product_name AS product_name,
      oi.product_image AS product_image,
      pv.color,
      mt.phone AS mpesa_phone,
      mt.merchant_request_id AS mpesa_merchant_request_id
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
    LEFT JOIN mpesa_transactions mt ON o.mpesa_merchant_request_id = mt.merchant_request_id
    ORDER BY o.created_at DESC`
  );

  return groupOrders(rows, true);
};
// ---------------- FULL DETAILS ----------------

// Get full order details with products & user info
export const getFullOrderDetails = async (order_id) => {
  const [rows] = await db.execute(
    `SELECT 
o.id AS order_id,
o.status,
o.created_at,
u.id AS user_id,
u.username,
u.email,
oi.variant_id,
oi.quantity,
oi.price,
oi.unit_buying_price,
oi.unit_discount,
oi.product_name AS product_name,       
oi.product_image AS product_image,     
pv.color,
mt.phone AS mpesa_phone,
mt.merchant_request_id AS mpesa_merchant_request_id
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id 
-- LEFT JOIN products p ON pv.product_id = p.product_id       
LEFT JOIN mpesa_transactions mt
ON o.mpesa_merchant_request_id = mt.merchant_request_id
WHERE o.id = ?`,
    [order_id]
  );

  if (!rows.length) return null;

  const firstRow = rows[0];

  return {
    order_id: firstRow.order_id,
    status: firstRow.status,
    created_at: firstRow.created_at,
    user: {
      id: firstRow.user_id,
      username: firstRow.username,
      email: firstRow.email,
    },
    mpesa_details: {
      phone: firstRow.mpesa_phone,
      merchant_request_id: firstRow.mpesa_merchant_request_id
    },
    items: rows
      .filter(r => r.variant_id) // skip if no items
      .map(r => ({
        variant_id: r.variant_id,
        name: r.product_name,
        image: r.product_image,
        color: r.color,
        quantity: r.quantity,
        price: r.price,
        unit_buying_price: r.unit_buying_price,
        unit_discount: r.unit_discount,
      })),
  };
};


// Update order status
export const updateOrderStatus = async (orderId, status) => {
  if (!status) throw new Error("Status required");
  await db.execute("UPDATE orders SET status = ? WHERE id = ?", [
    status,
    orderId,
  ]);
};


export const checkAndMarkBackorder = async (orderId) => {
  const [rows] = await db.execute(
    `SELECT oi.variant_id, pv.stock 
FROM order_items oi 
JOIN product_variants pv ON pv.variant_id = oi.variant_id
WHERE oi.order_id = ?`,
    [orderId]
  );

  const hasBackorder = rows.some(r => r.stock < 0);
  if (hasBackorder) {
    await db.execute("UPDATE orders SET status = 'backorder' WHERE id = ?", [orderId]);
  }
};

export const getBackorderedOrdersData = async () => {
  try {
    const [rows] = await db.execute(
      `SELECT
        oi.order_id,
        o.user_id,
        o.created_at AS order_date,
        u.username,
        u.email,
        p.product_id,
        pv.variant_id,
        pv.stock AS current_variant_stock,
        p.title AS product_name,
        pv.color,
        oi.quantity AS ordered_quantity
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE pv.stock < 0
        AND o.status IN ('pending', 'backorder', 'processing')
      ORDER BY o.created_at ASC`
    );

    return rows;
  } catch (err) {
    console.error("Error fetching backordered order data:", err);
    return [];
  }
};