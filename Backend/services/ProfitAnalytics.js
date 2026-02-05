
import db from "../config/db.js";


export const getProfitAnalytics = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT SUM(oi.price - oi.unit_buying_price - oi.unit_discount) AS total_profit 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('shipped', 'delivered')
    `);

    return rows[0]?.total_profit || 0;
  } catch (err) {
    console.error("Error fetching total profit:", err);
    throw err;
  }
};


export const getTotalDailyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at) AS order_date, 
             SUM(oi.price - oi.unit_buying_price - oi.unit_discount) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('shipped', 'delivered')
      GROUP BY DATE(o.created_at)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);

    
    const currentDayData = rows.find(row => {
      const rowDate = new Date(row.order_date).toISOString().slice(0, 10);
      return rowDate === currentDate;
    });

    if (!currentDayData) {
      rows.push({ order_date: currentDate, total_profit: 0 });
    }

    
    return rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_profit: row.total_profit || 0,
    }));
  } catch (err) {
    console.error("Error fetching total daily profit:", err);
    throw err;
  }
};


export const getTotalMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS order_date, 
             SUM(oi.price - oi.unit_buying_price - oi.unit_discount) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('shipped', 'delivered')
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const currentMonthData = rows.find(
      row => row.order_date === currentMonth
    );

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_profit: 0 });
    }

    return rows.map(row => ({
      order_date: row.order_date,
      total_profit: row.total_profit || 0,
    }));
  } catch (err) {
    console.error("Error fetching total monthly profit:", err);
    throw err;
  }
};
// Add to the end of your services/ProfitAnalytics.js file:

export const getPOSDailyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at) AS order_date, 
             SUM(oi.price - oi.unit_buying_price - oi.unit_discount) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('shipped', 'delivered', 'pos_completed') 
        AND o.order_type = 'pos'
      GROUP BY DATE(o.created_at)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);

    const currentDayData = rows.find(row => {
      const rowDate = new Date(row.order_date).toISOString().slice(0, 10);
      return rowDate === currentDate;
    });

    if (!currentDayData) {
      rows.push({ order_date: currentDate, total_profit: 0 });
    }

    return rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_profit: row.total_profit || 0,
    }));
  } catch (err) {
    console.error("Error fetching POS daily profit:", err);
    throw err;
  }
};

export const getOnlineDailyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at) AS order_date, 
             SUM(oi.price - oi.unit_buying_price - oi.unit_discount) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('shipped', 'delivered')
        AND o.order_type = 'online'
      GROUP BY DATE(o.created_at)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);

    const currentDayData = rows.find(row => {
      const rowDate = new Date(row.order_date).toISOString().slice(0, 10);
      return rowDate === currentDate;
    });

    if (!currentDayData) {
      rows.push({ order_date: currentDate, total_profit: 0 });
    }

    return rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_profit: row.total_profit || 0,
    }));
  } catch (err) {
    console.error("Error fetching Online daily profit:", err);
    throw err;
  }
};

export const getPOSMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS order_date, 
             SUM(oi.price - oi.unit_buying_price - oi.unit_discount) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('shipped', 'delivered', 'pos_completed')
        AND o.order_type = 'pos'
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const currentMonthData = rows.find(
      row => row.order_date === currentMonth
    );

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_profit: 0 });
    }

    return rows.map(row => ({
      order_date: row.order_date,
      total_profit: row.total_profit || 0,
    }));
  } catch (err) {
    console.error("Error fetching POS monthly profit:", err);
    throw err;
  }
};

export const getOnlineMonthlyProfit = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS order_date, 
             SUM(oi.price - oi.unit_buying_price - oi.unit_discount) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('shipped', 'delivered')
        AND o.order_type = 'online'
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const currentMonthData = rows.find(
      row => row.order_date === currentMonth
    );

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_profit: 0 });
    }

    return rows.map(row => ({
      order_date: row.order_date,
      total_profit: row.total_profit || 0,
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
        SUM(oi.price - oi.unit_buying_price - oi.unit_discount) AS total_profit,
        COUNT(DISTINCT o.id) AS order_count,
        AVG(oi.price - oi.unit_buying_price - oi.unit_discount) AS avg_profit_per_order
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('shipped', 'delivered', 'pos_completed')
      GROUP BY o.order_type
      ORDER BY total_profit DESC
    `);

    return rows;
  } catch (err) {
    console.error("Error fetching profit by order type:", err);
    throw err;
  }
};