import db from '../config/db.js';

// Import products from CSV
export const importProductsFromCSV = async (csvData) => {
  const lines = csvData.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const line of dataLines) {
    try {
      // Parse CSV line (handle quoted values)
      const values = parseCSVLine(line);
      
      if (values.length < 6) {
        results.failed++;
        results.errors.push(`Row skipped: Not enough columns - ${line.substring(0, 50)}`);
        continue;
      }

      // Map CSV columns to data
      const [
        title,
        description,
        categoryName,
        color,
        buyingPrice,
        sellingPrice,
        stock,
        discount,
        imageUrl
      ] = values;

      // Validate required fields
      if (!title || !categoryName || !sellingPrice) {
        results.failed++;
        results.errors.push(`Row skipped: Missing required fields (title, category, or price) - ${title || 'Unknown'}`);
        continue;
      }

      // Find or create category
      let categoryId = await getOrCreateCategory(categoryName);
      
      // Insert product
      const [productResult] = await db.execute(
        `INSERT INTO products (title, description, category_id, is_visible, is_deleted) 
         VALUES (?, ?, ?, 1, 0)`,
        [title, description || '', categoryId]
      );
      
      const productId = productResult.insertId;
      
      // Insert variant
      const profitMargin = (parseFloat(sellingPrice) || 0) - (parseFloat(buyingPrice) || 0) + (parseFloat(discount) || 0);
      
      // Process image URL - convert to relative path format
      let imagePath = null;
      if (imageUrl && imageUrl.trim()) {
        // If it's already a path, use it; if it's a filename, add uploads/images/
        if (imageUrl.includes('/')) {
          imagePath = imageUrl.trim();
        } else {
          imagePath = `uploads/images/${imageUrl.trim()}`;
        }
      }
      
      await db.execute(
        `INSERT INTO product_variants (product_id, color, price, buying_price, profit_margin, discount, stock, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          color || 'Default',
          parseFloat(sellingPrice) || 0,
          parseFloat(buyingPrice) || 0,
          profitMargin,
          parseFloat(discount) || 0,
          parseInt(stock) || 0,
          imagePath
        ]
      );
      
      results.success++;
      
    } catch (error) {
      results.failed++;
      results.errors.push(`Error: ${error.message} - ${line.substring(0, 50)}`);
    }
  }

  return results;
};

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

// Get or create category
async function getOrCreateCategory(categoryName) {
  // Try to find existing category
  const [existing] = await db.execute(
    'SELECT category_id FROM categories WHERE category_name = ? AND is_deleted = 0',
    [categoryName]
  );
  
  if (existing.length > 0) {
    return existing[0].category_id;
  }
  
  // Create new category
  const [result] = await db.execute(
    'INSERT INTO categories (category_name, parent_id, is_deleted) VALUES (?, NULL, 0)',
    [categoryName]
  );
  
  return result.insertId;
}

// Import inventory/stock updates from CSV
export const importInventoryFromCSV = async (csvData) => {
  const lines = csvData.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const line of dataLines) {
    try {
      const values = parseCSVLine(line);
      
      if (values.length < 3) {
        results.failed++;
        results.errors.push(`Row skipped: Not enough columns - ${line.substring(0, 50)}`);
        continue;
      }

      const [variantId, stock, buyingPrice] = values;
      
      if (!variantId) {
        results.failed++;
        results.errors.push(`Row skipped: Missing variant ID`);
        continue;
      }

      // Update variant
      const profitMargin = buyingPrice ? 
        `(SELECT price FROM product_variants WHERE variant_id = ?) - ?` : 0;
      
      if (stock !== undefined && stock !== '') {
        await db.execute(
          'UPDATE product_variants SET stock = ? WHERE variant_id = ?',
          [parseInt(stock), parseInt(variantId)]
        );
      }
      
      if (buyingPrice !== undefined && buyingPrice !== '') {
        // Get current price to recalculate profit margin
        const [current] = await db.execute(
          'SELECT price FROM product_variants WHERE variant_id = ?',
          [parseInt(variantId)]
        );
        
        if (current.length > 0) {
          const profit = parseFloat(current[0].price) - parseFloat(buyingPrice);
          await db.execute(
            'UPDATE product_variants SET buying_price = ?, profit_margin = ? WHERE variant_id = ?',
            [parseFloat(buyingPrice), profit, parseInt(variantId)]
          );
        }
      }
      
      results.success++;
      
    } catch (error) {
      results.failed++;
      results.errors.push(`Error: ${error.message} - ${line.substring(0, 50)}`);
    }
  }

  return results;
};
