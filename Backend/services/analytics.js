
import db from "../config/db.js";
import { calculateInventoryValue } from "./product.js";


export const getTotalRevenue = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    return rows[0].total_revenue || 0;
  } catch (err) {
    console.error("Error fetching total revenue:", err);
    return 0;
  }
};

export const getTotalDailySales = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE(o.created_at + INTERVAL 3 HOUR)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);

    // normalize rows to YYYY-MM-DD
    const normalizedRows = rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_revenue: Number(row.total_revenue) || 0,
    }));

    const currentDayData = normalizedRows.find(
      row => row.order_date === currentDate
    );

    if (!currentDayData) {
      normalizedRows.push({ order_date: currentDate, total_revenue: 0 });
    }

    return normalizedRows;
  } catch (err) {
    console.error("Error fetching total daily sales:", err);
    throw err;
  }
};

export const getTotalMonthlySales = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthData = rows.find(row => row.order_date === currentMonth);

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_revenue: 0 });
    }

    return rows;
  } catch (err) {
    console.error("Error fetching total monthly sales:", err);
    throw err;
  }
};

export const getproductSalesVolume = async () => {

  try{
    const [rows] = await db.execute(`
      SELECT p.product_id, p.title AS product_name,
             SUM(oi.quantity) AS total_quantity_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE o.status IN ('paid', 'delivered', 'shipped', 'pos_completed')
      GROUP BY p.product_id, p.title
      ORDER BY total_quantity_sold DESC
    `);

    return rows;
  } catch (err) {
    console.error("Error fetching product sales volume:", err);
    throw err;
  }

}

export const getProductProfit = async () => {
  try{
    const [rows] = await db.execute(`
      SELECT p.product_id, p.title AS product_name,
              SUM((oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE o.status IN ('paid', 'delivered', 'shipped', 'pos_completed')
      GROUP BY p.product_id, p.title
      ORDER BY total_profit DESC
    `);      
      
    return rows;
  } catch (err) {
    console.error("Error fetching product profit:", err);
    throw err;
   
  }



};

export const getProductRevenue = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT p.product_id, p.title AS product_name,
             SUM(oi.price * oi.quantity) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY p.product_id, p.title
      ORDER BY total_revenue DESC
    `);
    return rows;
  } catch (err) {
    console.error("Error fetching product revenue:", err);
    throw err;
  }
};


export const getProductPerformance = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT p.product_id, p.title AS product_name, 
             SUM(oi.quantity) AS total_quantity_sold,
             SUM(oi.quantity * oi.price) AS total_revenue,
             SUM((oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) * oi.quantity) AS total_profit,
             AVG(oi.price) AS average_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY p.product_id, p.title
      ORDER BY total_revenue DESC
    `);
    return rows;
  } catch (err) {
    console.error("Error fetching product performance:", err);
    throw err;
  }
};

export const getBatchProfitTrajectory = async (variantId) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        pb.date_received,
        pb.buying_price,
        pb.quantity_received,
        SUM(CASE WHEN o.status IN ('paid', 'shipped', 'delivered', 'pos_completed') THEN oi.quantity ELSE 0 END) as sold_quantity,
        SUM(CASE WHEN o.status IN ('paid', 'shipped', 'delivered', 'pos_completed') THEN oi.quantity * oi.price ELSE 0 END) as revenue,
        SUM(CASE WHEN o.status IN ('paid', 'shipped', 'delivered', 'pos_completed') THEN oi.quantity * (oi.price - CASE WHEN oi.unit_buying_price > 0 THEN oi.unit_buying_price ELSE pv.buying_price END - oi.unit_discount) ELSE 0 END) as profit
      FROM product_batches pb
      LEFT JOIN order_items oi ON oi.variant_id = pb.variant_id 
        AND oi.created_at >= pb.date_received
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE pb.variant_id = ?
      GROUP BY pb.batch_id
      ORDER BY pb.date_received
    `, [variantId]);
    
    return rows;
  } catch (err) {
    console.error("Error fetching batch trajectory:", err);
    throw err;
  }
};

export const getProductCostHistory = async (productId) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        DATE(pb.date_received) as purchase_date,
        AVG(pb.buying_price) as avg_buying_price,
        SUM(pb.quantity_received) as total_received,
        pv.buying_price as current_avg_price
      FROM product_batches pb
      JOIN product_variants pv ON pb.variant_id = pv.variant_id
      WHERE pv.product_id = ?
      GROUP BY DATE(pb.date_received)
      ORDER BY purchase_date DESC
    `, [productId]);
    
    return rows;
  } catch (err) {
    console.error("Error fetching cost history:", err);
    throw err;
  }
};

// Add to the end of your services/analytics.js file:

export const getPOSDailySales = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_type = 'pos'
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE(o.created_at + INTERVAL 3 HOUR)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);

    // normalize rows to YYYY-MM-DD
    const normalizedRows = rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_revenue: Number(row.total_revenue) || 0,
    }));

    const currentDayData = normalizedRows.find(
      row => row.order_date === currentDate
    );

    if (!currentDayData) {
      normalizedRows.push({ order_date: currentDate, total_revenue: 0 });
    }

    return normalizedRows;
  } catch (err) {
    console.error("Error fetching POS daily sales:", err);
    throw err;
  }
};

export const getOnlineDailySales = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at + INTERVAL 3 HOUR) AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_type = 'online'
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE(o.created_at + INTERVAL 3 HOUR)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
    const localDate = new Date(now.getTime() + timeOffset);
    const currentDate = localDate.toISOString().slice(0, 10);

    // normalize rows to YYYY-MM-DD
    const normalizedRows = rows.map(row => ({
      order_date: new Date(row.order_date).toISOString().slice(0, 10),
      total_revenue: Number(row.total_revenue) || 0,
    }));

    const currentDayData = normalizedRows.find(
      row => row.order_date === currentDate
    );

    if (!currentDayData) {
      normalizedRows.push({ order_date: currentDate, total_revenue: 0 });
    }

    return normalizedRows;
  } catch (err) {
    console.error("Error fetching Online daily sales:", err);
    throw err;
  }
};

export const getPOSMonthlySales = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_type = 'pos'
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthData = rows.find(row => row.order_date === currentMonth);

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_revenue: 0 });
    }

    return rows;
  } catch (err) {
    console.error("Error fetching POS monthly sales:", err);
    throw err;
  }
};

export const getOnlineMonthlySales = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_type = 'online'
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthData = rows.find(row => row.order_date === currentMonth);

    if (!currentMonthData) {
      rows.push({ order_date: currentMonth, total_revenue: 0 });
    }

    return rows;
  } catch (err) {
    console.error("Error fetching Online monthly sales:", err);
    throw err;
  }
};

export const getSalesByOrderType = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        o.order_type,
        COUNT(DISTINCT o.id) AS order_count,
        SUM(oi.quantity * oi.price) AS total_revenue,
        SUM(oi.quantity) AS total_quantity
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY o.order_type
      ORDER BY total_revenue DESC
    `);

    return rows;
  } catch (err) {
    console.error("Error fetching sales by order type:", err);
    throw err;
  }
};

export const getOrderTypeDailyComparison = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        DATE(o.created_at) AS order_date,
        o.order_type,
        SUM(oi.quantity * oi.price) AS total_revenue
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.order_type IN ('pos', 'online')
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
      GROUP BY DATE(o.created_at), o.order_type
      ORDER BY order_date DESC
      LIMIT 30
    `);

    // Transform data for chart
    const dateMap = {};
    rows.forEach(row => {
      const date = new Date(row.order_date).toISOString().slice(0, 10);
      if (!dateMap[date]) {
        dateMap[date] = { order_date: date, pos: 0, online: 0 };
      }
      dateMap[date][row.order_type] = Number(row.total_revenue) || 0;
    });

    return Object.values(dateMap).sort((a, b) => 
      new Date(a.order_date) - new Date(b.order_date)
    );
  } catch (err) {
    console.error("Error fetching order type daily comparison:", err);
    throw err;
  }
};

// Dashboard stats aggregation
export const getDashboardStats = async () => {
  try {
    // Get total revenue (all time) - SALES amount
    const [[{ total_revenue }]] = await db.execute(`
      SELECT SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get total profit (all time) - actual profit (using variant buying_price as fallback)
    const [[{ total_profit }]] = await db.execute(`
      SELECT SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get today's date in local timezone (Africa/Nairobi UTC+3)
    const now = new Date();
    const timeOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
    const localDate = new Date(now.getTime() + timeOffset);
    const today = localDate.toISOString().slice(0, 10);

    // Get yesterday's date
    const yesterdayDate = new Date(localDate.getTime() - 86400000);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    // Get today's revenue (sales) - using Nairobi timezone (UTC+3)
    const [[{ today_revenue }]] = await db.execute(`
      SELECT COALESCE(SUM(oi.quantity * oi.price), 0) AS today_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at + INTERVAL 3 HOUR) = CURDATE()
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get today's profit - using Nairobi timezone (UTC+3) and variant buying_price as fallback
    const [[{ today_profit }]] = await db.execute(`
      SELECT COALESCE(SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity), 0) AS today_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE DATE(o.created_at + INTERVAL 3 HOUR) = CURDATE()
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get yesterday's revenue for trend calculation
    const [[{ yesterday_revenue }]] = await db.execute(`
      SELECT COALESCE(SUM(oi.quantity * oi.price), 0) AS yesterday_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at + INTERVAL 3 HOUR) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get yesterday's profit for trend calculation - using variant buying_price as fallback
    const [[{ yesterday_profit }]] = await db.execute(`
      SELECT COALESCE(SUM((oi.price - COALESCE(NULLIF(oi.unit_buying_price, 0), pv.buying_price) - COALESCE(oi.unit_discount, 0)) * oi.quantity), 0) AS yesterday_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      WHERE DATE(o.created_at + INTERVAL 3 HOUR) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND o.status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get total orders count
    const [[{ total_orders }]] = await db.execute(`
      SELECT COUNT(*) AS total_orders FROM orders 
      WHERE status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get today's orders count - using Nairobi timezone (UTC+3)
    const [[{ today_orders }]] = await db.execute(`
      SELECT COUNT(*) AS today_orders FROM orders 
      WHERE DATE(created_at + INTERVAL 3 HOUR) = CURDATE()
        AND status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get yesterday's orders for trend
    const [[{ yesterday_orders }]] = await db.execute(`
      SELECT COUNT(*) AS yesterday_orders FROM orders 
      WHERE DATE(created_at + INTERVAL 3 HOUR) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND status IN ('paid', 'shipped', 'delivered', 'pos_completed')
    `);

    // Get low stock count (products with stock <= 5)
    const [[{ low_stock_count }]] = await db.execute(`
      SELECT COUNT(DISTINCT pv.variant_id) AS low_stock_count
      FROM product_variants pv
      WHERE pv.stock <= 5 AND pv.stock > 0
    `);

    // Get out of stock count
    const [[{ out_of_stock_count }]] = await db.execute(`
      SELECT COUNT(DISTINCT pv.variant_id) AS out_of_stock_count
      FROM product_variants pv
      WHERE pv.stock = 0
    `);

    // Get preorders count
    const [[{ total_preorders }]] = await db.execute(`
      SELECT COUNT(*) AS total_preorders FROM preorders WHERE status = 'pending'
    `);

    // Get today's preorders count - using Nairobi timezone (UTC+3)
    const [[{ today_preorders }]] = await db.execute(`
      SELECT COUNT(*) AS today_preorders FROM preorders p 
      WHERE DATE(p.created_at + INTERVAL 3 HOUR) = CURDATE() AND status = 'pending'
    `);

    // Get total products count
    const [[{ total_products }]] = await db.execute(`
      SELECT COUNT(*) AS total_products FROM products WHERE is_deleted = 0
    `);

    // Get total users count (customers)
    const [[{ total_users }]] = await db.execute(`
      SELECT COUNT(*) AS total_users FROM users WHERE role = 'customer'
    `);

    // Get inventory value using WAC (Weighted Average Cost)
    const inventoryValueWAC = await calculateInventoryValue();

    return {
      revenue: {
        total: Number(total_revenue) || 0,
        today: Number(today_revenue) || 0,
        yesterday: Number(yesterday_revenue) || 0,
      },
      profit: {
        total: Number(total_profit) || 0,
        today: Number(today_profit) || 0,
        yesterday: Number(yesterday_profit) || 0,
      },
      orders: {
        total: Number(total_orders) || 0,
        today: Number(today_orders) || 0,
        yesterday: Number(yesterday_orders) || 0,
      },
      lowStock: {
        low: Number(low_stock_count) || 0,
        outOfStock: Number(out_of_stock_count) || 0,
      },
      preorders: {
        total: Number(total_preorders) || 0,
        today: Number(today_preorders) || 0,
      },
      products: {
        total: Number(total_products) || 0,
      },
      users: {
        total: Number(total_users) || 0,
      },
      inventory: {
        valueWAC: Number(inventoryValueWAC) || 0,
      },
    };
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    // Return default values instead of throwing to prevent 500 errors
    return {
      revenue: {
        total: 0,
        today: 0,
        yesterday: 0,
      },
      profit: {
        total: 0,
        today: 0,
        yesterday: 0,
      },
      orders: {
        total: 0,
        today: 0,
        yesterday: 0,
      },
      lowStock: {
        low: 0,
        outOfStock: 0,
      },
      preorders: {
        total: 0,
        today: 0,
      },
      products: {
        total: 0,
      },
      users: {
        total: 0,
      },
      inventory: {
        valueWAC: 0,
      },
    };
  }
};
