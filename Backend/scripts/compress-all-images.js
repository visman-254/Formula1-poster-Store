// One-time script to compress all existing images to WebP
// Run with: node scripts/compress-all-images.js
// Requires: npm install sharp (already in package.json)

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');
const HERO_DIR = path.join(__dirname, '..', 'uploads', 'hero');

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 800;
const QUALITY = 80;

async function compressImage(filePath, outputPath) {
  try {
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;

    await sharp(filePath)
      .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    const newStats = fs.statSync(outputPath);
    const newSize = newStats.size;
    const saved = ((1 - newSize / originalSize) * 100).toFixed(1);

    return {
      original: path.basename(filePath),
      converted: path.basename(outputPath),
      originalSize: (originalSize / 1024).toFixed(1) + ' KB',
      newSize: (newSize / 1024).toFixed(1) + ' KB',
      saved: saved + '%'
    };
  } catch (err) {
    return { error: err.message, file: path.basename(filePath) };
  }
}

async function processDirectory(dirPath, type) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const results = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    
    // Skip non-images and already-WebP
    if (!SUPPORTED_FORMATS.includes(ext)) continue;
    if (ext === '.webp') {
      console.log(`  ⏭️  Skipping (already WebP): ${file}`);
      continue;
    }

    const originalPath = path.join(dirPath, file);
    const basename = path.basename(file, ext);
    const webpPath = path.join(dirPath, `${basename}.webp`);

    console.log(`  Processing: ${file}...`);
    const result = await compressImage(originalPath, webpPath);

    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
      results.push({ error: result.error, file: result.file });
    } else {
      // Remove original file
      fs.unlinkSync(originalPath);
      console.log(`  ✅ Converted: ${result.original} → ${result.converted} (saved ${result.saved})`);
      results.push(result);
    }
  }

  return results;
}

async function main() {
  console.log('\n🖼️  Image Compression Script');
  console.log('============================\n');
  console.log(`Settings: max ${MAX_SIZE}px, WebP quality ${QUALITY}%\n`);

  console.log(`📁 Processing: ${UPLOAD_DIR}`);
  const productResults = await processDirectory(UPLOAD_DIR, 'product');
  
  console.log(`\n📁 Processing: ${HERO_DIR}`);
  const heroResults = await processDirectory(HERO_DIR, 'hero');

  const totalConverted = productResults.filter(r => !r.error).length + heroResults.filter(r => !r.error).length;
  const totalErrors = productResults.filter(r => r.error).length + heroResults.filter(r => r.error).length;

  console.log('\n============================');
  console.log(`✅ Total converted: ${totalConverted}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  console.log('\n⚠️  IMPORTANT: Now update your database to reference the new .webp files!');
  console.log('   For product images, update the image path from .jpg/.png to .webp\n');
}

main().catch(console.error);
