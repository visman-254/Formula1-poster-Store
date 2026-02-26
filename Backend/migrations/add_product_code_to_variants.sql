-- Add product_code (barcode/SKU) field to product_variants table
-- This enables barcode scanning for quick stock entry
-- Run this SQL in your MySQL database

-- Add product_code column if it doesn't exist
ALTER TABLE product_variants ADD COLUMN product_code VARCHAR(100) NULL;

-- Add index for faster barcode lookups (ignore if already exists)
-- MySQL doesn't support IF NOT EXISTS for indexes, so we use this workaround:
-- ALTER TABLE product_variants ADD INDEX idx_product_code (product_code);

-- Note: If you get an error about duplicate key, the column already exists

-- Sample queries to verify and test:

-- 1. View current variants with their codes
-- SELECT variant_id, color, price, stock, product_code FROM product_variants LIMIT 10;

-- 2. Update a variant with a product code
-- UPDATE product_variants SET product_code = 'S26-BLK-256-8GB' WHERE variant_id = 1;

-- 3. Find variant by barcode
-- SELECT pv.*, p.title as product_name 
-- FROM product_variants pv 
-- JOIN products p ON pv.product_id = p.product_id 
-- WHERE pv.product_code = 'S26-BLK-256-8GB';

-- 4. Auto-generate product codes from existing color values (optional)
-- UPDATE product_variants SET product_code = CONCAT('PRD-', variant_id, '-', REPLACE(color, ' ', '-')) 
-- WHERE product_code IS NULL OR product_code = '';
