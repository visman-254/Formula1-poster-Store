import React, { useState, useEffect, useRef } from 'react';
import { compressImage, getOptimalMimeType } from '../utils/imageCompression';

// Cache for compressed images
const imageCache = new Map();

/**
 * CompressedImage - A React component that compresses images on the client side
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for the image
 * @param {string} className - CSS class name
 * @param {number} maxWidth - Maximum width (default: 600)
 * @param {number} maxHeight - Maximum height (default: 600)
 * @param {number} quality - Compression quality 0-1 (default: 0.7)
 * @param {boolean} lazy - Enable lazy loading (default: true)
 * @param {function} onLoad - Callback when image loads
 * @param {function} onError - Callback when image fails to load
 * @param {object} rest - Other img element props
 */
const CompressedImage = ({
  src,
  alt = '',
  className = '',
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.7,
  lazy = true,
  onLoad,
  onError,
  ...rest
}) => {
  const [compressedSrc, setCompressedSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const mimeType = getOptimalMimeType();
  const cacheKey = `${src}-${maxWidth}-${maxHeight}-${quality}-${mimeType}`;

  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    const loadAndCompress = async () => {
      try {
        // Check cache first
        if (imageCache.has(cacheKey)) {
          setCompressedSrc(imageCache.get(cacheKey));
          setLoading(false);
          return;
        }

        // For data URLs, use directly
        if (src.startsWith('data:')) {
          imageCache.set(cacheKey, src);
          setCompressedSrc(src);
          setLoading(false);
          return;
        }

        // Compress the image
        const compressed = await compressImage(src, {
          maxWidth,
          maxHeight,
          quality,
          mimeType
        });

        // Cache the result
        imageCache.set(cacheKey, compressed);
        setCompressedSrc(compressed);
        setLoading(false);
        
        if (onLoad) onLoad(compressed);
      } catch (err) {
        console.warn('Image compression failed, using original:', err);
        // Fallback to original image
        setCompressedSrc(src);
        setLoading(false);
      }
    };

    loadAndCompress();
  }, [src, maxWidth, maxHeight, quality, mimeType, cacheKey, onLoad]);

  // Handle native error
  const handleError = (e) => {
    setError(true);
    if (onError) onError(e);
  };

  // Don't render if no source
  if (!src) {
    return null;
  }

  return (
    <img
      ref={imgRef}
      src={compressedSrc || src}
      alt={alt}
      className={`${className} ${loading ? 'compressed-image-loading' : ''}`.trim()}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      onError={handleError}
      {...rest}
    />
  );
};

export default CompressedImage;
