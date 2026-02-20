-- Fix hero_slides table - update .jpg to .webp
-- Run these SQL commands in phpMyAdmin

UPDATE hero_slides 
SET image_url = REPLACE(image_url, '.jpg', '.webp') 
WHERE image_url LIKE '%.jpg';

UPDATE hero_slides 
SET image_url = REPLACE(image_url, '.jpeg', '.webp') 
WHERE image_url LIKE '%.jpeg';

UPDATE hero_slides 
SET image_url = REPLACE(image_url, '.png', '.webp') 
WHERE image_url LIKE '%.png';

-- Verify the update
SELECT id, image_url FROM hero_slides;
