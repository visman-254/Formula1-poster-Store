
-- =====================================================
-- RUN THESE SQL COMMANDS IN PHPMYADMIN
-- =====================================================

-- 1. Fix hero_slides table (files are .webp, need to update DB)
UPDATE hero_slides 
SET image_url = REPLACE(image_url, '.jpg', '.webp') 
WHERE image_url LIKE '%.jpg';

UPDATE hero_slides 
SET image_url = REPLACE(image_url, '.jpeg', '.webp') 
WHERE image_url LIKE '%.jpeg';

UPDATE hero_slides 
SET image_url = REPLACE(image_url, '.png', '.webp') 
WHERE image_url LIKE '%.png';

-- 2. Fix product_promotions table (DB has .webp, files now .webp - should match)

-- 3. Fix admin_settings (wallpaper) - DB has .webp, files now .webp

-- 4. Check current state of all tables
SELECT 'hero_slides' as table_name, COUNT(*) as count FROM hero_slides;
SELECT 'product_promotions' as table_name, COUNT(*) as count FROM product_promotions;
SELECT 'admin_settings' as table_name, COUNT(*) as count FROM admin_settings WHERE setting_key = 'wallpaper';

-- 5. Verify paths (should all be .webp now)
SELECT id, image_url FROM hero_slides;
SELECT id, image_url FROM product_promotions;
SELECT id, setting_key, setting_value FROM admin_settings WHERE setting_key = 'wallpaper';
