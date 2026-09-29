import imageCompression from 'browser-image-compression';

export const COMPRESSION_OPTIONS = {
  maxSizeMB: 1.0, // High-quality image retention without aggressive lossy compression
  maxWidthOrHeight: 2048, // 2048px retains ultra-sharp detail for 2x HD and 3x 4K exports
  useWebWorker: true, // Prevent UI freezing during compression
};

/**
 * Compresses an image file according to optimized configuration:
 * - maxSizeMB: 0.3
 * - maxWidthOrHeight: 1280
 * - useWebWorker: true
 */
export async function compressImageFile(file: File, customOptions?: Partial<typeof COMPRESSION_OPTIONS>): Promise<File> {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  const options = { ...COMPRESSION_OPTIONS, ...customOptions };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.warn('Image compression with web worker failed, trying without web worker:', error);
    try {
      const fallbackFile = await imageCompression(file, {
        ...options,
        useWebWorker: false,
      });
      return fallbackFile;
    } catch (fallbackError) {
      console.warn('Image compression failed, using original file:', fallbackError);
      return file;
    }
  }
}

/**
 * Intercepts an image file, compresses it, and returns the compressed Data URL string.
 */
export async function compressAndReadAsDataURL(file: File, customOptions?: Partial<typeof COMPRESSION_OPTIONS>): Promise<string> {
  const compressedFile = await compressImageFile(file, customOptions);
  try {
    return await imageCompression.getDataUrlFromFile(compressedFile);
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(compressedFile);
    });
  }
}

/**
 * Helper to compress a Data URL (e.g. output from cropping canvas)
 */
export async function compressDataUrl(dataUrl: string, fileName = 'image.jpg'): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  try {
    const file = await imageCompression.getFilefromDataUrl(dataUrl, fileName);
    return await compressAndReadAsDataURL(file);
  } catch (e) {
    console.warn('Failed to compress dataUrl, returning original:', e);
    return dataUrl;
  }
}

/**
 * Ensures any base64 data URL string does not exceed maxBytes (e.g. 150KB).
 * If it is oversized, downscales it to max 640px via canvas.
 */
export async function ensureDataUrlUnderSize(dataUrl: string, maxBytes = 150_000): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length <= maxBytes) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxDim = maxBytes <= 25_000 ? 280 : maxBytes <= 50_000 ? 400 : maxBytes <= 80_000 ? 540 : 640;
          const quality = maxBytes <= 25_000 ? 0.55 : maxBytes <= 50_000 ? 0.65 : 0.75;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width || 320;
          canvas.height = height || 320;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(dataUrl);
          }
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}
