
import db from "../config/db.js";


export const getProfitAnalytics = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT SUM(oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) AS total_profit 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    return rows[0]?.total_profit || 0;
  } catch (err) {
    console.error("Error fetching total profit:", err);
    return 0; // Return 0 instead of throwing to prevent 500 errors
  }
};


export const getTotalDailyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE(o.created_at + INTERVAL 3 HOUR)
      ORDER BY order_date DESC
    `);

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
    // Return a default structure with zero values instead of throwing
    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000;
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);
    return [{ order_date: currentDate, total_profit: 0 }];
  }
};


export const getTotalMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m') AS order_date, 
             SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS total_profit
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
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return [{ order_date: currentMonth, total_profit: 0 }];
  }
};

export const getPOSDailyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS total_profit
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
    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000;
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);
    return [{ order_date: currentDate, total_profit: 0 }];
  }
};

export const getOnlineDailyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS total_profit
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
    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000;
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);
    return [{ order_date: currentDate, total_profit: 0 }];
  }
};

export const getPOSMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m') AS order_date, 
             SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS total_profit
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
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return [{ order_date: currentMonth, total_profit: 0 }];
  }
};

export const getOnlineMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at + INTERVAL 3 HOUR, '%Y-%m') AS order_date, 
             SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS total_profit
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
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return [{ order_date: currentMonth, total_profit: 0 }];
  }
};

export const getProfitByOrderType = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        o.order_type,
        SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS total_profit,
        COUNT(DISTINCT o.id) AS order_count,
        AVG((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS avg_profit_per_order
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY o.order_type
      ORDER BY total_profit DESC
    `);

    return rows;
  } catch (err) {
    console.error("Error fetching profit by order type:", err);
    return [];
  }
};
