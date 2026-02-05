import db from "../config/db.js";


export const getTotalRevenue = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
    `);

    return rows[0].total_revenue || 0;
  } catch (err) {
    console.error("Error fetching total revenue:", err);
    throw err;
  }
};

export const getTotalDailySales = async () => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE(o.created_at) AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      GROUP BY DATE(o.created_at)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);

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
      WHERE o.status IN ('paid', 'delivered', 'shipped')
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
              SUM((oi.price - oi.unit_buying_price - oi.unit_discount) * oi.quantity) AS total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE o.status = 'delivered'
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
      WHERE o.status IN ('shipped', 'delivered')
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
             SUM((oi.price - oi.unit_buying_price - oi.unit_discount) * oi.quantity) AS total_profit,
             AVG(oi.price) AS average_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.variant_id
      JOIN products p ON pv.product_id = p.product_id
      WHERE o.status IN ('shipped', 'delivered')
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
        SUM(CASE WHEN o.status IN ('shipped', 'delivered') THEN oi.quantity ELSE 0 END) as sold_quantity,
        SUM(CASE WHEN o.status IN ('shipped', 'delivered') THEN oi.quantity * oi.price ELSE 0 END) as revenue,
        SUM(CASE WHEN o.status IN ('shipped', 'delivered') THEN oi.quantity * (oi.price - oi.unit_buying_price - oi.unit_discount) ELSE 0 END) as profit
      FROM product_batches pb
      LEFT JOIN order_items oi ON oi.variant_id = pb.variant_id 
        AND oi.created_at >= pb.date_received
      LEFT JOIN orders o ON oi.order_id = o.id
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
      SELECT DATE(o.created_at) AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_type = 'pos'
      GROUP BY DATE(o.created_at)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);

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
      SELECT DATE(o.created_at) AS order_date, 
             SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_type = 'online'
      GROUP BY DATE(o.created_at)
      ORDER BY order_date DESC
    `);

    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);

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