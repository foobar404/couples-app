/**
 * Image compression utilities for Firebase optimization
 * Compresses images to the smallest possible size while maintaining quality
 */

// Compression settings optimized for different use cases
const COMPRESSION_SETTINGS = {
  doodle: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.85,
    format: 'webp' // Best compression for drawings
  },
  message: {
    maxWidth: 1200,
    maxHeight: 900,
    quality: 0.8,
    format: 'webp' // Good balance for photos
  },
  photo: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'webp' // Better for photos with many colors
  }
};

/**
 * Compress a canvas to a data URL with optimal settings
 * @param {HTMLCanvasElement} canvas - The canvas to compress
 * @param {string} type - Compression type: 'doodle', 'message', or 'photo'
 * @returns {Promise<string>} Compressed image data URL
 */
export const compressCanvas = async (canvas, type = 'doodle') => {
  const settings = COMPRESSION_SETTINGS[type];
  
  // Create a new canvas for compression
  const compressedCanvas = document.createElement('canvas');
  const ctx = compressedCanvas.getContext('2d');
  
  // Calculate optimal dimensions
  const { width, height } = calculateOptimalDimensions(
    canvas.width,
    canvas.height,
    settings.maxWidth,
    settings.maxHeight
  );
  
  compressedCanvas.width = width;
  compressedCanvas.height = height;
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the original canvas onto the compressed canvas
  ctx.drawImage(canvas, 0, 0, width, height);
  
  // Convert to compressed format
  const mimeType = settings.format === 'webp' ? 'image/webp' : 'image/jpeg';
  
  // Check if WebP is supported, fallback to JPEG if not
  const supportedFormat = await checkWebPSupport() && settings.format === 'webp' 
    ? 'image/webp' 
    : 'image/jpeg';
  
  return compressedCanvas.toDataURL(supportedFormat, settings.quality);
};

/**
 * Compress a file or blob image
 * @param {File|Blob} file - The image file to compress
 * @param {string} type - Compression type: 'doodle', 'message', or 'photo'
 * @returns {Promise<string>} Compressed image data URL
 */
export const compressImageFile = async (file, type = 'message') => {
  return new Promise((resolve, reject) => {
    const settings = COMPRESSION_SETTINGS[type];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Calculate optimal dimensions
        const { width, height } = calculateOptimalDimensions(
          img.width,
          img.height,
          settings.maxWidth,
          settings.maxHeight
        );
        
        canvas.width = width;
        canvas.height = height;
        
        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = settings.format === 'webp' ? 'image/webp' : 'image/jpeg';
        const supportedFormat = await checkWebPSupport() && settings.format === 'webp' 
          ? 'image/webp' 
          : 'image/jpeg';
        
        const compressedDataUrl = canvas.toDataURL(supportedFormat, settings.quality);
        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 * @param {number} originalWidth 
 * @param {number} originalHeight 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @returns {object} Optimal width and height
 */
const calculateOptimalDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Scale down if larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    
    if (width > height) {
      width = maxWidth;
      height = width / aspectRatio;
    } else {
      height = maxHeight;
      width = height * aspectRatio;
    }
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  };
};

/**
 * Check if browser supports WebP format
 * @returns {Promise<boolean>}
 */
const checkWebPSupport = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Get the size of a data URL in bytes
 * @param {string} dataUrl 
 * @returns {number} Size in bytes
 */
export const getDataUrlSize = (dataUrl) => {
  const base64String = dataUrl.split(',')[1];
  return Math.round((base64String.length * 3) / 4);
};

/**
 * Format file size for display
 * @param {number} bytes 
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Compress and validate image size
 * @param {HTMLCanvasElement|File|Blob} source 
 * @param {string} type 
 * @returns {Promise<{dataUrl: string, originalSize: number, compressedSize: number, compressionRatio: number}>}
 */
export const compressWithStats = async (source, type = 'doodle') => {
  let originalSize, compressedDataUrl;
  
  if (source instanceof HTMLCanvasElement) {
    // For canvas (doodles)
    const originalDataUrl = source.toDataURL('image/png');
    originalSize = getDataUrlSize(originalDataUrl);
    compressedDataUrl = await compressCanvas(source, type);
  } else {
    // For files (message images)
    originalSize = source.size;
    compressedDataUrl = await compressImageFile(source, type);
  }
  
  const compressedSize = getDataUrlSize(compressedDataUrl);
  const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  
  console.log(`🗜️ Image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${compressionRatio}% reduction)`);
  
  return {
    dataUrl: compressedDataUrl,
    originalSize,
    compressedSize,
    compressionRatio: parseFloat(compressionRatio)
  };
};
