
import db from "../config/db.js";


export const getProfitAnalytics = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT SUM(oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) AS total_profit 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    return rows[0]?.total_profit || 0;
  } catch (err) {
    console.error("Error fetching total profit:", err);
    throw err;
  }
};


export const getTotalDailyProfit = async () => {
  try {
    console.log("DEBUG: Executing getTotalDailyProfit query...");
    
    // First, let's check the raw order items for today
    const [debugItems] = await db.execute(`
      SELECT oi.id, oi.order_id, oi.variant_id, oi.price, oi.unit_buying_price, oi.quantity, 
             pv.buying_price as variant_buying_price,
             (oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity as calculated_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE DATE(o.created_at + INTERVAL 3 HOUR) = CURDATE()
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);
    console.log("DEBUG: Today's order items:", JSON.stringify(debugItems, null, 2));
    
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM((oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE(o.created_at + INTERVAL 3 HOUR)
      ORDER BY order_date DESC
    `);
    console.log("DEBUG: Query result rows:", JSON.stringify(rows, null, 2));

    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);

    // Normalize rows to YYYY-MM-DD
    const normalizedRows = rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_profit: Number(row.total_profit) || 0,
    }));

    const currentDayData = normalizedRows.find(
      row => row.order_date === currentDate
    );

    if (!currentDayData) {
      normalizedRows.push({ order_date: currentDate, total_profit: 0 });
    }

    return normalizedRows;
  } catch (err) {
    console.error("Error fetching total daily profit:", err);
    throw err;
  }
};


export const getTotalMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m') AS order_date, 
             SUM((oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const currentMonthData = rows.find(
      row => row.order_date === currentMonth
    );

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_profit: 0 });
    }

    return rows.map(row => ({
      order_date: row.order_date,
      total_profit: Number(row.total_profit) || 0,
    }));
  } catch (err) {
    console.error("Error fetching total monthly profit:", err);
    throw err;
  }
};

export const getPOSDailyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM((oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
        AND o.order_type = 'pos'
      GROUP BY DATE(o.created_at + INTERVAL 3 HOUR)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);

    const normalizedRows = rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_profit: Number(row.total_profit) || 0,
    }));

    const currentDayData = normalizedRows.find(
      row => row.order_date === currentDate
    );

    if (!currentDayData) {
      normalizedRows.push({ order_date: currentDate, total_profit: 0 });
    }

    return normalizedRows;
  } catch (err) {
    console.error("Error fetching POS daily profit:", err);
    throw err;
  }
};

export const getOnlineDailyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM((oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
        AND o.order_type = 'online'
      GROUP BY DATE(o.created_at + INTERVAL 3 HOUR)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);

    const normalizedRows = rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_profit: Number(row.total_profit) || 0,
    }));

    const currentDayData = normalizedRows.find(
      row => row.order_date === currentDate
    );

    if (!currentDayData) {
      normalizedRows.push({ order_date: currentDate, total_profit: 0 });
    }

    return normalizedRows;
  } catch (err) {
    console.error("Error fetching Online daily profit:", err);
    throw err;
  }
};

export const getPOSMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m') AS order_date, 
             SUM((oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
        AND o.order_type = 'pos'
      GROUP BY DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const currentMonthData = rows.find(
      row => row.order_date === currentMonth
    );

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_profit: 0 });
    }

    return rows.map(row => ({
      order_date: row.order_date,
      total_profit: Number(row.total_profit) || 0,
    }));
  } catch (err) {
    console.error("Error fetching POS monthly profit:", err);
    throw err;
  }
};

export const getOnlineMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m') AS order_date, 
             SUM((oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
        AND o.order_type = 'online'
      GROUP BY DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const currentMonthData = rows.find(
      row => row.order_date === currentMonth
    );

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_profit: 0 });
    }

    return rows.map(row => ({
      order_date: row.order_date,
      total_profit: Number(row.total_profit) || 0,
    }));
  } catch (err) {
    console.error("Error fetching Online monthly profit:", err);
    throw err;
  }
};

export const getProfitByOrderType = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        o.order_type,
        SUM((oi.price - oi.unit_buying_price - oi.unit_discount) * oi.quantity) AS total_profit,
        COUNT(DISTINCT o.id) AS order_count,
        AVG((oi.price - oi.unit_buying_price - oi.unit_discount) * oi.quantity) AS avg_profit_per_order
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY o.order_type
      ORDER BY total_profit DESC
    `);

    return rows;
  } catch (err) {
    console.error("Error fetching profit by order type:", err);
    throw err;
  }
};
