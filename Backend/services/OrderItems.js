
import db from '../config/db.js';

export const createOrderItem = async (order_id, variant_id, quantity, price, title, image, imei_serial = null, connection = null) => {
  const dbConnection = connection || db;
  
  // The unit_buying_price will be calculated and updated later in the main transaction.
  const unit_buying_price = 0.00; 

  const [variantRows] = await dbConnection.execute(
    'SELECT discount, title, image FROM product_variants JOIN products ON product_variants.product_id = products.product_id WHERE variant_id = ?',
    [variant_id]
  );
  
  const discount = variantRows[0]?.discount || 0;
  const final_product_name = title || variantRows[0]?.title;
  const final_product_image = image || variantRows[0]?.image;

  const [result] = await dbConnection.execute(
    'INSERT INTO order_items (order_id, variant_id, quantity, price, unit_buying_price, unit_discount, product_name, product_image, imei_serial) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [order_id, variant_id, quantity, price, unit_buying_price, discount, final_product_name, final_product_image, imei_serial]
  );
  return result.insertId;
}


export const getOrdersByVariantId = async (variant_id) => {
  const [orders] = await db.execute(
    'SELECT * FROM order_items WHERE variant_id = ?',
    [variant_id]
  );
  return orders;
};

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
        p.title AS product_name,
        pv.image AS product_image,
        pv.color,
        p.is_bundle,
        p.bundle_of,
        mt.phone AS mpesa_phone,
        mt.checkout_id AS mpesa_checkout_id,
        mt.merchant_request_id AS mpesa_merchant_request_id
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
      LEFT JOIN products p ON pv.product_id = p.product_id
      LEFT JOIN mpesa_transactions mt ON o.mpesa_merchant_request_id = mt.merchant_request_id
      WHERE o.id = ?`,
    [order_id]
  );

  if (!rows.length) return null;

  const items = [];
  for (const r of rows) {
    if (r.is_bundle && r.bundle_of) {
      // Expand bundle into individual items
      const bundleComponents = JSON.parse(r.bundle_of);
      for (const component of bundleComponents) {
        // Get details for each component
        const [compRows] = await db.execute(
          `SELECT p.title AS product_name, pv.image AS product_image, pv.color, pv.buying_price, pv.discount
           FROM product_variants pv
           JOIN products p ON pv.product_id = p.product_id
           WHERE pv.variant_id = ?`,
          [component.variant_id]
        );
        if (compRows.length > 0) {
          const comp = compRows[0];
          items.push({
            variant_id: component.variant_id,
            name: comp.product_name,
            image: comp.product_image,
            color: comp.color,
            quantity: component.quantity * r.quantity, // Multiply by bundle quantity
            price: (r.price / bundleComponents.reduce((sum, c) => sum + c.quantity, 0)) * component.quantity, // Pro-rate price
            unit_buying_price: comp.buying_price,
            unit_discount: comp.discount,
            is_bundle_item: true, // Mark as part of bundle
            bundle_variant_id: r.variant_id, // Add bundle variant id to group them
          });
        }
      }
    } else {
      // Regular item
      items.push({
        variant_id: r.variant_id,
        name: r.product_name,
        image: r.product_image,
        color: r.color,
        quantity: r.quantity,
        price: r.price,
        unit_buying_price: r.unit_buying_price,
        unit_discount: r.unit_discount,
      });
    }
  }

  return {
    order_id: rows[0].order_id,
    status: rows[0].status,
    created_at: rows[0].created_at,
    user: {
      id: rows[0].user_id,
      username: rows[0].username,
      email: rows[0].email,
    },
    mpesa_details: {
      phone: rows[0].mpesa_phone,
      checkout_id: rows[0].mpesa_checkout_id,
      merchant_request_id: rows[0].mpesa_merchant_request_id
    },
    items: items
  };
};

export const getOrdersByUser = async (user_id) => {
  const [rows] = await db.execute(
    `SELECT
        o.id AS order_id,
        o.total,
        o.status,
        o.created_at,
        oi.variant_id,
        oi.quantity,
        oi.price,
        oi.unit_buying_price,
        oi.unit_discount,
        p.title AS product_name,
        pv.image AS product_image,
        pv.color,
        p.is_bundle,
        p.bundle_of
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
      LEFT JOIN products p ON pv.product_id = p.product_id
      WHERE o.user_id = ?`,
    [user_id]
  );

  // group by order_id
  const ordersMap = {};
  for (const r of rows) {
    if (!ordersMap[r.order_id]) {
      ordersMap[r.order_id] = {
        id: r.order_id,
        total: r.total,
        status: r.status,
        created_at: r.created_at,
        items: []
      };
    }
    if (r.variant_id) {
      if (r.is_bundle && r.bundle_of) {
        // Expand bundle
        const bundleComponents = JSON.parse(r.bundle_of);
        for (const component of bundleComponents) {
          const [compRows] = await db.execute(
            `SELECT p.title AS product_name, pv.image AS product_image, pv.color, pv.buying_price, pv.discount
             FROM product_variants pv
             JOIN products p ON pv.product_id = p.product_id
             WHERE pv.variant_id = ?`,
            [component.variant_id]
          );
          if (compRows.length > 0) {
            const comp = compRows[0];
            ordersMap[r.order_id].items.push({
              variant_id: component.variant_id,
              name: comp.product_name,
              image: comp.product_image,
              color: comp.color,
              quantity: component.quantity * r.quantity,
              price: (r.price / bundleComponents.reduce((sum, c) => sum + c.quantity, 0)) * component.quantity,
              unit_buying_price: comp.buying_price,
              unit_discount: comp.discount,
              is_bundle_item: true,
              bundle_variant_id: r.variant_id,
            });
          }
        }
      } else {
        ordersMap[r.order_id].items.push({
          variant_id: r.variant_id,
          name: r.product_name,
          image: r.product_image,
          color: r.color,
          quantity: r.quantity,
          price: r.price,
          unit_buying_price: r.unit_buying_price,
          unit_discount: r.unit_discount
        });
      }
    }
  }

  return Object.values(ordersMap);
};