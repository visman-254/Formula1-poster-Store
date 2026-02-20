-- Fix duplicate Uncategorized categories
-- Run these SQL commands in phpMyAdmin

-- 1. First, check current Uncategorized categories
SELECT category_id, category_name, parent_id, is_deleted 
FROM categories 
WHERE category_name = 'Uncategorized';

-- 2. Move products from duplicate Uncategorized (not ID 35) to the main one (ID 35)
UPDATE products 
SET category_id = 35 
WHERE category_id IN (
  SELECT category_id FROM categories 
  WHERE category_name = 'Uncategorized' AND category_id != 35
);

-- 3. Delete duplicate Uncategorized categories (keep ID 35)
DELETE FROM categories 
WHERE category_name = 'Uncategorized' AND category_id != 35;

-- 4. Verify only one Uncategorized exists
SELECT category_id, category_name FROM categories WHERE category_name = 'Uncategorized';
