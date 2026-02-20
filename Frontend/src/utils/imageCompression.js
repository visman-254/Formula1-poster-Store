/**
 * Client-side Image Compression Utilities
 * Uses Canvas API to compress images in the browser
 */

/**
 * Compress an image using Canvas API
 * @param {string} imageUrl - URL or base64 of the image
 * @param {object} options - Compression options
 * @returns {Promise<string>} - Base64 compressed image
 */
export const compressImage = (imageUrl, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
    mimeType = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF'; // White background for transparency
      ctx.fillRect(0, 0, width, height);
      
      // Draw image with smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Get compressed data URL
      canvas.toDataURL(mimeType, quality, (err, dataUrl) => {
        if (err) {
          reject(err);
        } else {
          resolve(dataUrl);
        }
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Handle different URL types
    if (imageUrl.startsWith('data:')) {
      img.src = imageUrl;
    } else if (imageUrl.startsWith('http')) {
      img.src = imageUrl;
    } else {
      // Relative URL
      img.src = imageUrl;
    }
  });
};

/**
 * Compress multiple images in batch
 * @param {string[]} imageUrls - Array of image URLs
 * @param {object} options - Compression options
 * @returns {Promise<string[]>} - Array of compressed base64 images
 */
export const compressImages = async (imageUrls, options = {}) => {
  const results = await Promise.allSettled(
    imageUrls.map(url => compressImage(url, options))
  );
  
  return results.map((result, index) => 
    result.status === 'fulfilled' ? result.value : imageUrls[index]
  );
};

/**
 * Create a lazy loading image component with compression
 * This shows a placeholder until the compressed version is ready
 */
export const createCompressedImage = (src, options = {}) => {
  const {
    onLoad,
    onError,
    ...imgProps
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      // Compress on load
      compressImage(src, { quality: 0.8 }).then(compressedSrc => {
        resolve({ 
          src: compressedSrc, 
          originalSrc: src,
          width: img.width, 
          height: img.height,
          loaded: true 
        });
        if (onLoad) onLoad(compressedSrc);
      }).catch(() => {
        // Fallback to original if compression fails
        resolve({ 
          src, 
          originalSrc: src,
          width: img.width, 
          height: img.height,
          loaded: true 
        });
        if (onLoad) onLoad(src);
      });
    };

    img.onerror = () => {
      resolve({ 
        src: src || '/fallback.jpg', 
        originalSrc: src,
        loaded: false 
      });
      if (onError) onError(src);
    };

    img.src = src;
  });
};

/**
 * Check if browser supports WebP
 */
export const supportsWebP = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

/**
 * Get optimal mime type based on browser support
 */
export const getOptimalMimeType = () => {
  return supportsWebP() ? 'image/webp' : 'image/jpeg';
};

export default {
  compressImage,
  compressImages,
  createCompressedImage,
  supportsWebP,
  getOptimalMimeType
};
