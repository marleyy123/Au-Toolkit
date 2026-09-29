import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, firebaseConfig } from '../firebase';

export const storage = getStorage(app, firebaseConfig.storageBucket);

export interface UploadedMediaResult {
  storagePath: string;
  downloadURL: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
}

/**
 * Extracts width and height from an image file or blob
 */
export function getImageDimensions(fileOrBlob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Uploads an image asset to Firebase Storage under the user's isolated storage directory:
 * `users/{firebaseUid}/media/{timestamp}_{fileName}`
 * Returns metadata with a stable Firebase download URL. Upload failures are
 * deliberately surfaced so callers never persist a temporary data/blob URL.
 */
export async function uploadMediaAsset(
  fileOrBlob: File | Blob,
  userIdOrEmail: string,
  category: string = 'media'
): Promise<UploadedMediaResult> {
  // Firebase UIDs are case-sensitive. Keep the UID intact so the path agrees
  // with Storage rules that compare this segment to request.auth.uid.
  const userKey = userIdOrEmail.trim();
  if (!userKey || !/^[A-Za-z0-9_-]+$/.test(userKey)) {
    throw new Error('A valid Firebase user ID is required to upload media.');
  }
  const rawFileName = (fileOrBlob instanceof File && fileOrBlob.name) ? fileOrBlob.name : 'upload.jpg';
  const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const mimeType = fileOrBlob.type || 'image/jpeg';
  const size = fileOrBlob.size || 0;
  const timestamp = Date.now();
  const filePath = `users/${userKey}/${category}/${timestamp}_${cleanFileName}`;

  const { width, height } = await getImageDimensions(fileOrBlob);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are offline. Reconnect before uploading the image.');
  }

  try {
    const fileRef = storageRef(storage, filePath);
    const uploadResult = await uploadBytes(fileRef, fileOrBlob, {
      contentType: mimeType,
      customMetadata: {
        userId: userKey,
        uploadedAt: new Date().toISOString(),
      },
    });

    const downloadURL = await getDownloadURL(uploadResult.ref);

    return {
      storagePath: filePath,
      downloadURL,
      fileName: cleanFileName,
      mimeType,
      size,
      width,
      height,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Firebase Storage upload failed:', error);
    const detail = error instanceof Error ? error.message : 'Unknown upload error';
    throw new Error(`Image upload failed: ${detail}`, { cause: error });
  }
}
