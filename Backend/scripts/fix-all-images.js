/**
 * COMPREHENSIVE IMAGE FIX SCRIPT
 * Converts all image folders to WebP and generates SQL
 * 
 * Run: node scripts/fix-all-images.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory
const UPLOADS_DIR = path.join(__dirname, '../../Backend/uploads');

// Folders to process
const folders = {
  promotions: path.join(UPLOADS_DIR, 'promotions'),
  wallpaper: path.join(UPLOADS_DIR, 'wallpaper'),
  hero: path.join(UPLOADS_DIR, 'hero'),
  images: path.join(UPLOADS_DIR, 'images')
};

async function convertFolder(folderName, folderPath, resizeOptions = null) {
  console.log(`\n📁 Processing: ${folderName}`);
  console.log('─'.repeat(40));
  
  if (!fs.existsSync(folderPath)) {
    console.log(`  ⚠️  Folder doesn't exist, skipping`);
    return { converted: 0, errors: 0 };
  }
  
  const files = fs.readdirSync(folderPath);
  const jpgFiles = files.filter(f => /\.(jpe?g|png)$/i.test(f));
  
  if (jpgFiles.length === 0) {
    console.log(`  ✅ No images to convert`);
    return { converted: 0, errors: 0 };
  }
  
  console.log(`  Found ${jpgFiles.length} images to convert`);
  
  let converted = 0;
  let errors = 0;
  
  for (const file of jpgFiles) {
    const oldPath = path.join(folderPath, file);
    const newFileName = file.replace(/\.(jpe?g|png)$/i, '.webp');
    const newPath = path.join(folderPath, newFileName);
    
    try {
      let pipeline = sharp(oldPath).webp({ quality: 80 });
      
      if (resizeOptions) {
        pipeline = pipeline.resize(resizeOptions.width, resizeOptions.height, { 
          fit: resizeOptions.fit || 'cover' 
        });
      }
      
      await pipeline.toFile(newPath);
      
      console.log(`  ✅ ${file} → ${newFileName}`);
      
      // Delete old file
      fs.unlinkSync(oldPath);
      converted++;
    } catch (err) {
      console.error(`  ❌ Failed: ${file} - ${err.message}`);
      errors++;
    }
  }
  
  console.log(`  Summary: ${converted} converted, ${errors} errors`);
  return { converted, errors };
}

function generateSQL() {
  console.log('\n' + '='.repeat(50));
  console.log('📝 GENERATING SQL FIX COMMANDS');
  console.log('='.repeat(50));
  
  const sql = `
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
`;

  console.log(sql);
  
  // Save SQL to file
  const sqlPath = path.join(__dirname, 'fix-all-images.sql');
  fs.writeFileSync(sqlPath, sql);
  console.log(`\n💾 SQL saved to: ${sqlPath}`);
}

async function main() {
  console.log('='.repeat(50));
  console.log('   COMPREHENSIVE IMAGE FIX SCRIPT');
  console.log('='.repeat(50));
  
  let totalConverted = 0;
  let totalErrors = 0;
  
  // Convert promotions (banner size)
  const promo = await convertFolder('promotions', folders.promotions, { width: 1200, height: 400 });
  totalConverted += promo.converted;
  totalErrors += promo.errors;
  
  // Convert wallpaper (large)
  const wall = await convertFolder('wallpaper', folders.wallpaper, { width: 1920, height: 1080 });
  totalConverted += wall.converted;
  totalErrors += wall.errors;
  
  // Hero images already converted, just verify
  await convertFolder('hero', folders.hero, { width: 1920, height: 600 });
  
  // Product images already converted, just verify
  await convertFolder('images', folders.images, { width: 800, height: 800 });
  
  generateSQL();
  
  console.log('\n' + '='.repeat(50));
  console.log('   SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total converted: ${totalConverted}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log('\n✅ Next step: Run the SQL commands in phpMyAdmin');
}

main().catch(console.error);
