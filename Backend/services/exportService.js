import ExcelJS from 'exceljs';
import db from '../config/db.js';

// Export orders to Excel with optional filters
export const exportOrdersToExcel = async (filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders');

  // Add headers
  worksheet.columns = [
    { header: 'Order ID', key: 'order_id', width: 10 },
    { header: 'Date', key: 'created_at', width: 20 },
    { header: 'Customer', key: 'username', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Order Type', key: 'order_type', width: 15 },
    { header: 'Delivery Address', key: 'delivery_address', width: 30 },
    { header: 'Sales Person', key: 'sales_person', width: 20 },
  ];

  // Build query with optional filters
  let query = `
    SELECT 
      o.id AS order_id,
      o.created_at,
      o.total,
      o.status,
      o.order_type,
      o.delivery_address,
      o.sales_person_id,
      u.username,
      u.email,
      sp.username AS sales_person_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN users sp ON o.sales_person_id = sp.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (filters.status) {
    query += ' AND o.status = ?';
    params.push(filters.status);
  }
  if (filters.startDate) {
    query += ' AND o.created_at >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND o.created_at <= ?';
    params.push(filters.endDate);
  }
  
  query += ' ORDER BY o.created_at DESC';

  const [rows] = await db.execute(query, params);

  // Add data rows
  rows.forEach(row => {
    worksheet.addRow({
      order_id: row.order_id,
      created_at: new Date(row.created_at).toLocaleString(),
      username: row.username || 'N/A',
      email: row.email || 'N/A',
      total: parseFloat(row.total),
      status: row.status,
      order_type: row.order_type || 'regular',
      delivery_address: row.delivery_address || 'N/A',
      sales_person: row.sales_person_name || 'N/A',
    });
  });

  // Format currency column
  worksheet.getColumn(5).numFmt = '#,##0.00';
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  return await workbook.xlsx.writeBuffer();
};

// Export products to Excel
export const exportProductsToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  worksheet.columns = [
    { header: 'Product ID', key: 'product_id', width: 10 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Category', key: 'category_name', width: 20 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Selling Price', key: 'price', width: 15 },
    { header: 'Buying Price', key: 'buying_price', width: 15 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Visible', key: 'is_visible', width: 10 },
  ];

  const [rows] = await db.execute(`
    SELECT p.product_id, p.title, p.is_visible, c.category_name,
           pv.color, pv.price, pv.buying_price, pv.stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_variants pv ON p.product_id = pv.product_id
    WHERE p.is_deleted = FALSE
  `);

  rows.forEach(row => {
    worksheet.addRow({
      product_id: row.product_id,
      title: row.title,
      category_name: row.category_name || 'Uncategorized',
      color: row.color || 'N/A',
      price: row.price ? Number(row.price) : 0,
      buying_price: row.buying_price ? Number(row.buying_price) : 0,
      stock: row.stock || 0,
      is_visible: row.is_visible ? 'Yes' : 'No',
    });
  });

  // Format currency columns
  worksheet.getColumn(5).numFmt = '#,##0.00';
  worksheet.getColumn(6).numFmt = '#,##0.00';
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  return await workbook.xlsx.writeBuffer();
};

// Export all batches to Excel (detailed batch-level view)
export const exportBatchesToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Batches');

  worksheet.columns = [
    { header: 'Batch ID', key: 'batch_id', width: 10 },
    { header: 'Product', key: 'title', width: 30 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Batch Date', key: 'created_at', width: 15 },
    { header: 'Original Qty', key: 'quantity', width: 12 },
    { header: 'Remaining Qty', key: 'remaining_quantity', width: 15 },
    { header: 'Unit Buying Price', key: 'buying_price', width: 18 },
    { header: 'Batch Value', key: 'batch_value', width: 15 },
  ];

  const [batches] = await db.execute(`
    SELECT pb.batch_id, pb.quantity, pb.remaining_quantity, pb.buying_price, pb.created_at,
           p.title, pv.color
    FROM product_batches pb
    JOIN product_variants pv ON pb.variant_id = pv.variant_id
    JOIN products p ON pv.product_id = p.product_id
    WHERE pb.remaining_quantity > 0
    ORDER BY pb.created_at DESC
  `);

  batches.forEach(batch => {
    worksheet.addRow({
      batch_id: batch.batch_id,
      title: batch.title,
      color: batch.color,
      created_at: new Date(batch.created_at).toISOString().slice(0, 10),
      quantity: batch.quantity,
      remaining_quantity: batch.remaining_quantity,
      buying_price: Number(batch.buying_price) || 0,
      batch_value: (batch.remaining_quantity || 0) * (Number(batch.buying_price) || 0),
    });
  });

  // Format currency columns
  worksheet.getColumn(7).numFmt = '#,##0.00';
  worksheet.getColumn(8).numFmt = '#,##0.00';
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  return await workbook.xlsx.writeBuffer();
};

// Export inventory to Excel with stock values
export const exportInventoryToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory');

  worksheet.columns = [
    { header: 'Variant ID', key: 'variant_id', width: 12 },
    { header: 'Product', key: 'title', width: 30 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Stock', key: 'stock', width: 12 },
    { header: 'Buying Price', key: 'buying_price', width: 15 },
    { header: 'Selling Price', key: 'price', width: 15 },
    { header: 'Stock Value', key: 'stock_value', width: 15 },
    { header: 'Low Stock Alert', key: 'low_stock', width: 15 },
  ];

  const [rows] = await db.execute(`
    SELECT pv.variant_id, p.title, pv.color, pv.stock, 
           pv.buying_price, pv.price
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.product_id
    WHERE p.is_deleted = FALSE
  `);

  // Get all batches to calculate WAC (Weighted Average Cost)
  const [batches] = await db.execute(`
    SELECT variant_id, remaining_quantity, buying_price
    FROM product_batches
    WHERE remaining_quantity > 0
  `);

  // Calculate WAC for each variant
  const wacByVariant = {};
  batches.forEach(batch => {
    if (!wacByVariant[batch.variant_id]) {
      wacByVariant[batch.variant_id] = { totalCost: 0, totalQty: 0 };
    }
    wacByVariant[batch.variant_id].totalCost += (batch.remaining_quantity * batch.buying_price);
    wacByVariant[batch.variant_id].totalQty += batch.remaining_quantity;
  });

  // Calculate WAC for each variant
  Object.keys(wacByVariant).forEach(variantId => {
    const data = wacByVariant[variantId];
    wacByVariant[variantId] = data.totalQty > 0 ? data.totalCost / data.totalQty : 0;
  });

  // Calculate total remaining stock from batches for each variant
  const stockFromBatches = {};
  batches.forEach(batch => {
    if (!stockFromBatches[batch.variant_id]) {
      stockFromBatches[batch.variant_id] = 0;
    }
    stockFromBatches[batch.variant_id] += batch.remaining_quantity;
  });

  rows.forEach(row => {
    const wac = wacByVariant[row.variant_id] || row.buying_price || 0;
    // Use actual stock from product_variants, not batch stock
    const variantStock = row.stock || 0;
    const stockValue = variantStock * (row.buying_price || 0);
    worksheet.addRow({
      variant_id: row.variant_id,
      title: row.title,
      color: row.color,
      stock: variantStock,
      buying_price: row.buying_price ? Number(row.buying_price) : 0,
      price: row.price ? Number(row.price) : 0,
      stock_value: stockValue,
      low_stock: variantStock < 5 ? 'LOW' : 'OK',
    });
  });

  // Format currency columns
  worksheet.getColumn(5).numFmt = '#,##0.00';
  worksheet.getColumn(6).numFmt = '#,##0.00';
  worksheet.getColumn(7).numFmt = '#,##0.00';
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  return await workbook.xlsx.writeBuffer();
};

// Export order items to Excel
export const exportOrderItemsToExcel = async (orderId = null) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Order Items');

  worksheet.columns = [
    { header: 'Order ID', key: 'order_id', width: 10 },
    { header: 'Product Name', key: 'product_name', width: 30 },
    { header: 'Color', key: 'color', width: 15 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Selling Price', key: 'price', width: 15 },
    { header: 'Buying Price', key: 'buying_price', width: 15 },
    { header: 'Discount', key: 'unit_discount', width: 15 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Profit', key: 'profit', width: 15 },
    { header: 'IMEI Serial', key: 'imei_serial', width: 20 },
  ];

  let query = `
    SELECT 
      oi.order_id,
      oi.product_name,
      pv.color,
      oi.quantity,
      oi.price,
      oi.unit_buying_price,
      oi.unit_discount,
      oi.imei_serial,
      (oi.quantity * oi.price - oi.unit_discount) AS total,
      (oi.quantity * (oi.price - oi.unit_buying_price - oi.unit_discount)) AS profit
    FROM order_items oi
    LEFT JOIN product_variants pv ON oi.variant_id = pv.variant_id
  `;
  
  const params = [];
  
  if (orderId) {
    query += ' WHERE oi.order_id = ?';
    params.push(orderId);
  }
  
  query += ' ORDER BY oi.order_id DESC';

  const [rows] = await db.execute(query, params);

  rows.forEach(row => {
    const profit = (row.quantity * (row.price - row.unit_buying_price - row.unit_discount)) || 0;
    worksheet.addRow({
      order_id: row.order_id,
      product_name: row.product_name,
      color: row.color || 'N/A',
      quantity: row.quantity,
      price: row.price ? Number(row.price) : 0,
      buying_price: row.unit_buying_price ? Number(row.unit_buying_price) : 0,
      unit_discount: row.unit_discount ? Number(row.unit_discount) : 0,
      total: row.total ? Number(row.total) : 0,
      profit: profit,
      imei_serial: row.imei_serial || 'N/A',
    });
  });

  // Format currency columns (Unit Price, Buying Price, Unit Discount, Total, Profit)
  worksheet.getColumn(5).numFmt = '#,##0.00';
  worksheet.getColumn(6).numFmt = '#,##0.00';
  worksheet.getColumn(7).numFmt = '#,##0.00';
  worksheet.getColumn(8).numFmt = '#,##0.00';
  worksheet.getColumn(9).numFmt = '#,##0.00';
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  return await workbook.xlsx.writeBuffer();
};

// Export users/customers to Excel
export const exportUsersToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');

  worksheet.columns = [
    { header: 'User ID', key: 'id', width: 10 },
    { header: 'Username', key: 'username', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Created At', key: 'created_at', width: 20 },
  ];

  const [rows] = await db.execute(`
    SELECT id, username, email, role, created_at
    FROM users
    ORDER BY created_at DESC
  `);

  rows.forEach(row => {
    worksheet.addRow({
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      created_at: new Date(row.created_at).toLocaleString(),
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  return await workbook.xlsx.writeBuffer();
};
