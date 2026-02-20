/**
 * Image Optimization Utilities
 * Provides functions to optimize images for frontend display
 */

// Check if browser supports WebP
const supportsWebP = () => {
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

// Cache for WebP support detection
let webPSupport = null;

/**
 * Get WebP support (cached)
 */
export const getWebPSupport = () => {
  if (webPSupport === null) {
    webPSupport = supportsWebP();
  }
  return webPSupport;
};

/**
 * Convert image URL to WebP format
 * Note: This assumes the backend serves both formats or a CDN is used
 * For local files, this is a no-op unless the server has WebP versions
 */
export const toWebP = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Don't transform data URLs or external URLs that don't support WebP
  if (url.startsWith('data:') || url.startsWith('http') && !url.includes(window.location.hostname)) {
    return url;
  }
  
  // Check if WebP is supported and convert extension
  if (getWebPSupport()) {
    // Replace common image extensions with WebP
    return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  
  return url;
};

/**
 * Generate srcset for responsive images
 * @param {string} baseUrl - Base image URL
 * @param {number[]} sizes - Array of widths to generate srcset for
 */
export const generateSrcSet = (baseUrl, sizes = [150, 300, 450, 600]) => {
  if (!baseUrl || typeof baseUrl !== 'string') return '';
  
  // Don't transform external URLs
  if (baseUrl.startsWith('http') && !baseUrl.includes(window.location.hostname)) {
    return '';
  }
  
  const webPEnabled = getWebPSupport();
  const ext = webPEnabled ? '.webp' : '';
  
  return sizes
    .map(size => {
      // Insert size before extension
      const url = baseUrl.replace(/(\.[\w]+)$/, `_${size}${ext}$1`);
      return `${url} ${size}w`;
    })
    .join(', ');
};

/**
 * Get optimized image URL with query parameters for compression
 * Use with CDN services like Cloudinary, Imgix, etc.
 * Example: optimizeImage('https://cdn.example.com/image.jpg', { width: 300, quality: 80 })
 */
export const optimizeImage = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url;
  
  const {
    width = 300,
    quality = 80,
    format = getWebPSupport() ? 'webp' : 'jpg'
  } = options;
  
  // For local uploads, return as-is (backend handles compression)
  if (!url.startsWith('http')) {
    return url;
  }
  
  // For external URLs (CDN), you can add optimization parameters here
  // This is where you'd add Cloudinary, Imgix, etc. transformations
  // Example for Cloudinary:
  // return `https://res.cloudinary.com/demo/image/upload/w_${width},q_${quality},f_${format}/${url}`;
  
  return url;
};

/**
 * Get image source with optimal settings for product listings
 * @param {string} url - Original image URL
 * @param {object} options - Additional options
 * @returns {object} - Object with src, srcSet, and other image attributes
 */
export const getOptimizedImageProps = (url, options = {}) => {
  const {
    alt = '',
    className = '',
    sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
  } = options;
  
  if (!url) {
    return {
      src: '/fallback.jpg',
      alt,
      className,
      loading: 'lazy',
      decoding: 'async'
    };
  }
  
  // Generate srcset
  const srcSet = generateSrcSet(url);
  
  return {
    src: url,
    srcSet: srcSet || undefined,
    sizes: srcSet ? sizes : undefined,
    alt,
    className,
    loading: 'lazy',
    decoding: 'async',
    width: 300,
    height: 300
  };
};

export default {
  getWebPSupport,
  toWebP,
  generateSrcSet,
  optimizeImage,
  getOptimizedImageProps
};
