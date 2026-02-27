-- Script to move products from deleted categories to Uncategorized
-- This fixes products that were in categories that have been deleted

-- First, find all products whose category is deleted or doesn't exist
SELECT p.product_id, p.title, p.category_id, c.category_name as old_category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE p.is_deleted = 0 
AND (c.is_deleted = 1 OR c.category_id IS NULL)
AND p.category_id IS NOT NULL
AND p.category_id != 127;

-- Update products from deleted categories to Uncategorized (category_id = 127)
UPDATE products p
LEFT JOIN categories c ON p.category_id = c.category_id
SET p.category_id = 127
WHERE p.is_deleted = 0 
AND (c.is_deleted = 1 OR c.category_id IS NULL)
AND p.category_id IS NOT NULL
AND p.category_id != 127;

-- Verify the update
SELECT p.product_id, p.title, p.category_id, c.category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
WHERE p.category_id = 127;
