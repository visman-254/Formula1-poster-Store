import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current file's directory (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory using absolute path
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');
const PUBLIC_PATH = 'uploads/images'; // Path for database storage

console.log('Image upload directory:', UPLOAD_DIR);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directory if it doesn't exist
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.log('Creating upload directory:', UPLOAD_DIR);
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Use timestamp + original extension to avoid conflicts
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uniqueSuffix}${ext}`;
    
    console.log(`Processing file: ${file.originalname} → ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed! (JPEG, JPG, PNG, WebP, GIF)'));
  }
});

// POST /api/upload/images
// Upload multiple images at once
router.post('/upload/images', upload.array('images', 50), async (req, res) => {
  console.log('\n========== IMAGE UPLOAD REQUEST ==========');
  
  try {
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({ 
        success: false,
        message: 'No images uploaded' 
      });
    }

    console.log(`Received ${req.files.length} file(s) for upload`);

    // Build response with mapping of original filenames to timestamp filenames
    const uploadedFiles = req.files.map(file => {
      const fileInfo = {
        filename: file.filename,
        originalName: file.originalname,
        path: `${PUBLIC_PATH}/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      };
      
      console.log('File saved:', {
        original: file.originalname,
        savedAs: file.filename,
        fullPath: path.join(UPLOAD_DIR, file.filename),
        publicPath: fileInfo.path
      });
      
      return fileInfo;
    });

    // Create a mapping object for easy reference
    const mapping = {};
    uploadedFiles.forEach(file => {
      mapping[file.originalName] = file.filename;
    });

    console.log('\nImage Mapping (use this in your CSV import):');
    console.log(JSON.stringify(mapping, null, 2));
    console.log('===========================================\n');

    res.json({
      success: true,
      message: `${uploadedFiles.length} image(s) uploaded successfully`,
      files: uploadedFiles,
      mapping: mapping // Include mapping for convenience
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload images',
      error: error.message 
    });
  }
});

// GET /api/upload/images
// List all uploaded images
router.get('/upload/images', async (req, res) => {
  console.log('\n========== LIST IMAGES REQUEST ==========');
  
  try {
    // Check if upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.log('Upload directory does not exist yet');
      return res.json({ 
        success: true,
        images: [],
        count: 0
      });
    }

    // Read all files in the directory
    const files = fs.readdirSync(UPLOAD_DIR);
    console.log(`Found ${files.length} total files in upload directory`);

    // Filter for image files only
    const images = files
      .filter(file => {
        const isValid = /\.(jpg|jpeg|png|webp|gif)$/i.test(file);
        if (!isValid) {
          console.log(`Skipping non-image file: ${file}`);
        }
        return isValid;
      })
      .map(file => {
        const filePath = path.join(UPLOAD_DIR, file);
        let stats;
        try {
          stats = fs.statSync(filePath);
        } catch (err) {
          stats = { size: 0, mtime: new Date() };
        }
        
        return {
          filename: file,
          path: `${PUBLIC_PATH}/${file}`,
          size: stats.size,
          uploadedAt: stats.mtime
        };
      });

    console.log(`Returning ${images.length} image(s)`);
    if (images.length > 0) {
      console.log('First 5 images:', images.slice(0, 5).map(img => img.filename));
    }
    console.log('========================================\n');

    res.json({
      success: true,
      images: images,
      count: images.length
    });

  } catch (error) {
    console.error('❌ List images error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to list images',
      error: error.message 
    });
  }
});

// DELETE /api/upload/images/:filename
// Delete a specific image (optional - useful for cleanup)
router.delete('/upload/images/:filename', async (req, res) => {
  console.log('\n========== DELETE IMAGE REQUEST ==========');
  
  try {
    const { filename } = req.params;
    
    // Security: Prevent path traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);
    
    console.log(`Attempting to delete: ${safeFilename}`);
    console.log(`Full path: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found');
      return res.status(404).json({ 
        success: false,
        message: 'File not found' 
      });
    }

    // Delete the file
    await fs.promises.unlink(filePath);
    console.log('✅ File deleted successfully');

    res.json({
      success: true,
      message: `File ${safeFilename} deleted successfully`
    });

  } catch (error) {
    console.error('❌ Delete image error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete image',
      error: error.message 
    });
  }
});

// GET /api/upload/images/check/:filename
// Check if a specific image exists (useful for debugging)
router.get('/upload/images/check/:filename', async (req, res) => {
  console.log('\n========== CHECK IMAGE REQUEST ==========');
  
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);
    
    console.log(`Checking for file: ${safeFilename}`);
    console.log(`Full path: ${filePath}`);

    const exists = fs.existsSync(filePath);
    
    let fileInfo = null;
    if (exists) {
      const stats = fs.statSync(filePath);
      fileInfo = {
        filename: safeFilename,
        path: `${PUBLIC_PATH}/${safeFilename}`,
        size: stats.size,
        uploadedAt: stats.mtime,
        absolutePath: filePath
      };
      console.log('✅ File exists:', fileInfo);
    } else {
      console.log('❌ File does not exist');
    }

    res.json({
      success: true,
      exists,
      fileInfo,
      uploadDirectory: UPLOAD_DIR,
      publicPath: `${PUBLIC_PATH}/${safeFilename}`
    });

  } catch (error) {
    console.error('❌ Check image error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check image',
      error: error.message 
    });
  }
});

export default router;