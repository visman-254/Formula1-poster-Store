import db from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import products from CSV
export const importProductsFromCSV = async (csvData, imageMapping = {}) => {
  console.log('========== STARTING CSV IMPORT ==========');
  console.log('Received imageMapping:', JSON.stringify(imageMapping, null, 2));
  
  const lines = csvData.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  console.log(`Processing ${dataLines.length} product rows from CSV`);

  for (let rowIndex = 0; rowIndex < dataLines.length; rowIndex++) {
    const line = dataLines[rowIndex];
    console.log(`\n--- Processing Row ${rowIndex + 1} ---`);
    
    try {
      // Parse CSV line (handle quoted values)
      const values = parseCSVLine(line);
      console.log('Parsed CSV values:', values);
      
      if (values.length < 6) {
        const error = `Row skipped: Not enough columns (found ${values.length}, need at least 6)`;
        console.error(error);
        results.failed++;
        results.errors.push(`${error} - ${line.substring(0, 50)}`);
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

      console.log('Extracted fields:', {
        title,
        description: description?.substring(0, 30) + '...',
        categoryName,
        color,
        buyingPrice,
        sellingPrice,
        stock,
        discount,
        imageUrl
      });

      // Validate required fields
      if (!title || !categoryName || !sellingPrice) {
        const error = `Row skipped: Missing required fields (title, category, or price)`;
        console.error(error);
        results.failed++;
        results.errors.push(`${error} - ${title || 'Unknown'}`);
        continue;
      }

      // Find or create category
      console.log(`Finding/creating category: "${categoryName}"`);
      let categoryId = await getOrCreateCategory(categoryName);
      console.log(`Category ID: ${categoryId}`);

      // Insert product
      console.log(`Inserting product: "${title}"`);
      const [productResult] = await db.execute(
        `INSERT INTO products (title, description, category_id, is_visible, is_deleted) 
         VALUES (?, ?, ?, 1, 0)`,
        [title, description || '', categoryId]
      );
      
      const productId = productResult.insertId;
      console.log(`Product created with ID: ${productId}`);

      // Insert variant
      const profitMargin = (parseFloat(sellingPrice) || 0) - (parseFloat(buyingPrice) || 0) + (parseFloat(discount) || 0);
      
      // Process image URL - use mapping to translate original filename to timestamp filename
      let imagePath = null;
      if (imageUrl && imageUrl.trim()) {
        const originalFilename = imageUrl.trim();
        console.log(`Processing image: original filename = "${originalFilename}"`);
        
        // Check if we have a mapping for this image (uploaded during this session)
        if (imageMapping && imageMapping[originalFilename]) {
          const timestampFilename = imageMapping[originalFilename];
          imagePath = `uploads/images/${timestampFilename}`;
          console.log(`✓ Found in imageMapping: "${originalFilename}" → "${timestampFilename}"`);
          console.log(`Final image path: ${imagePath}`);
          
          // Verify the file exists
          const fullPath = path.join(__dirname, '..', imagePath);
          if (fs.existsSync(fullPath)) {
            console.log(`✓ Image file exists on disk: ${fullPath}`);
          } else {
            console.warn(`⚠ Image file NOT found on disk: ${fullPath}`);
          }
        } else if (originalFilename.includes('/')) {
          // Already a path
          imagePath = originalFilename;
          console.log(`Using provided path: ${imagePath}`);
        } else {
          // Check if file exists with original name (legacy uploads)
          imagePath = `uploads/images/${originalFilename}`;
          console.log(`No mapping found, using original filename: ${imagePath}`);
          
          // Check if file exists with original name
          const fullPath = path.join(__dirname, '..', imagePath);
          if (fs.existsSync(fullPath)) {
            console.log(`✓ Image file exists at: ${fullPath}`);
          } else {
            console.warn(`⚠ Image file NOT found at expected location: ${fullPath}`);
            console.warn('Make sure you uploaded the images first or the filenames match exactly');
          }
        }
      } else {
        console.log('No image URL provided for this product');
      }

      // Insert variant
      console.log(`Inserting variant for product ${productId}`);
      console.log('Variant data:', {
        product_id: productId,
        color: color || 'Default',
        price: parseFloat(sellingPrice) || 0,
        buying_price: parseFloat(buyingPrice) || 0,
        profit_margin: profitMargin,
        discount: parseFloat(discount) || 0,
        stock: parseInt(stock) || 0,
        image: imagePath
      });

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
      
      console.log(`✓ Successfully imported product: ${title} (ID: ${productId})`);
      results.success++;
      
    } catch (error) {
      console.error(`✗ Error processing row ${rowIndex + 1}:`, error);
      results.failed++;
      results.errors.push(`Error: ${error.message} - ${line.substring(0, 100)}`);
    }
  }

  console.log('\n========== IMPORT COMPLETE ==========');
  console.log(`✓ Success: ${results.success} products`);
  console.log(`✗ Failed: ${results.failed} products`);
  if (results.errors.length > 0) {
    console.log('Errors:', results.errors);
  }
  console.log('=====================================');

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
  console.log(`Looking up category: "${categoryName}"`);
  
  // Try to find existing category
  const [existing] = await db.execute(
    'SELECT category_id FROM categories WHERE category_name = ? AND is_deleted = 0',
    [categoryName]
  );
  
  if (existing.length > 0) {
    console.log(`Found existing category: ${categoryName} (ID: ${existing[0].category_id})`);
    return existing[0].category_id;
  }
  
  // Create new category
  console.log(`Category "${categoryName}" not found, creating new one`);
  const [result] = await db.execute(
    'INSERT INTO categories (category_name, parent_id, is_deleted) VALUES (?, NULL, 0)',
    [categoryName]
  );
  
  console.log(`Created new category: ${categoryName} (ID: ${result.insertId})`);
  return result.insertId;
}

// Import inventory/stock updates from CSV
export const importInventoryFromCSV = async (csvData) => {
  console.log('========== STARTING INVENTORY IMPORT ==========');
  
  const lines = csvData.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  console.log(`Processing ${dataLines.length} inventory rows from CSV`);

  for (let rowIndex = 0; rowIndex < dataLines.length; rowIndex++) {
    const line = dataLines[rowIndex];
    console.log(`\n--- Processing Inventory Row ${rowIndex + 1} ---`);
    
    try {
      const values = parseCSVLine(line);
      console.log('Parsed CSV values:', values);
      
      if (values.length < 3) {
        const error = `Row skipped: Not enough columns (found ${values.length}, need at least 3)`;
        console.error(error);
        results.failed++;
        results.errors.push(`${error} - ${line.substring(0, 50)}`);
        continue;
      }

      const [variantId, stock, buyingPrice] = values;
      console.log(`Updating variant ID: ${variantId}, stock: ${stock}, buyingPrice: ${buyingPrice}`);
      
      if (!variantId) {
        const error = `Row skipped: Missing variant ID`;
        console.error(error);
        results.failed++;
        results.errors.push(error);
        continue;
      }

      // First, check if variant exists
      const [variantCheck] = await db.execute(
        'SELECT * FROM product_variants WHERE variant_id = ?',
        [parseInt(variantId)]
      );
      
      if (variantCheck.length === 0) {
        const error = `Variant ID ${variantId} not found`;
        console.error(error);
        results.failed++;
        results.errors.push(error);
        continue;
      }
      
      console.log('Current variant data:', variantCheck[0]);

      // Update variant
      if (stock !== undefined && stock !== '') {
        console.log(`Updating stock to ${parseInt(stock)}`);
        await db.execute(
          'UPDATE product_variants SET stock = ? WHERE variant_id = ?',
          [parseInt(stock), parseInt(variantId)]
        );
      }
      
      if (buyingPrice !== undefined && buyingPrice !== '') {
        console.log(`Updating buying price to ${parseFloat(buyingPrice)}`);
        
        // Get current price to recalculate profit margin
        const [current] = await db.execute(
          'SELECT price FROM product_variants WHERE variant_id = ?',
          [parseInt(variantId)]
        );
        
        if (current.length > 0) {
          const profit = parseFloat(current[0].price) - parseFloat(buyingPrice);
          console.log(`Recalculated profit margin: ${profit}`);
          
          await db.execute(
            'UPDATE product_variants SET buying_price = ?, profit_margin = ? WHERE variant_id = ?',
            [parseFloat(buyingPrice), profit, parseInt(variantId)]
          );
        }
      }
      
      console.log(`✓ Successfully updated variant ${variantId}`);
      results.success++;
      
    } catch (error) {
      console.error(`✗ Error processing row ${rowIndex + 1}:`, error);
      results.failed++;
      results.errors.push(`Error: ${error.message} - ${line.substring(0, 100)}`);
    }
  }

  console.log('\n========== INVENTORY IMPORT COMPLETE ==========');
  console.log(`✓ Success: ${results.success} items`);
  console.log(`✗ Failed: ${results.failed} items`);
  if (results.errors.length > 0) {
    console.log('Errors:', results.errors);
  }
  console.log('==============================================');

  return results;
};