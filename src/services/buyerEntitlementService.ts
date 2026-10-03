import { detectDeviceSlot, getOrCreateDeviceId, getStableDeviceModel, DeviceSlot } from '../utils/deviceAuthService';
import { auth } from '../firebase';

export interface BuyerRecord {
  buyerName: string;
  buyerEmail: string;
  purchaseDate: string; // YYYY-MM-DD
  accessExpiresAt: string; // YYYY-MM-DD
  expirationDate?: string | null; // Column P (YYYY-MM-DD)
  statusAccount?: 'Active' | 'Expired' | 'Inactive'; // Column Q
  daysRemaining: number;
  deviceHandphone?: string | null; // Column R
  deviceLaptop?: string | null; // Column S
  mobileDeviceId?: string | null; // Column V
  laptopDeviceId?: string | null; // Column W
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
}

export interface EntitlementCheckResult {
  isRegisteredBuyer: boolean;
  isValid: boolean;
  status:
    | 'ACTIVE'
    | 'EXPIRED'
    | 'INACTIVE'
    | 'NOT_REGISTERED'
    | 'DEVICE_MISMATCH'
    | 'ORDER_NOT_SUCCESS'
    | 'INVALID_PURCHASE_DATA'
    | 'BACKEND_ERROR'
    | 'INVALID_API_RESPONSE'
    | 'AUTH_REQUIRED'
    | 'INVALID_FIREBASE_TOKEN'
    | 'APPS_SCRIPT_UNAVAILABLE'
    | 'CORS_ORIGIN_BLOCKED'
    | 'EMAIL_ACCOUNT_MISMATCH';
  email?: string;
  buyerName?: string;
  orderStatus?: string;
  purchaseDate?: string;
  accessExpiresAt?: string;
  expirationDate?: string | null; // Column P
  statusAccount?: 'Active' | 'Expired' | 'Inactive'; // Column Q
  daysRemaining?: number | null;
  registeredDevice?: string | null;
  deviceHandphone?: string | null; // Column R
  deviceLaptop?: string | null; // Column S
  mobileDeviceId?: string | null; // Column V
  laptopDeviceId?: string | null; // Column W
  deviceModel?: string;
  deviceSlot?: DeviceSlot;
  message?: string;
  customToken?: string | null;
  canonicalUid?: string;
}

const STORAGE_KEY_ENTITLEMENT_CACHE = 'au_buyer_entitlement_cache_';

/**
 * Retrieves cached entitlement from localStorage if available.
 */
export function getCachedEntitlement(email: string): EntitlementCheckResult | null {
  try {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) return null;
    const raw = localStorage.getItem(`${STORAGE_KEY_ENTITLEMENT_CACHE}${cleanEmail}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as EntitlementCheckResult;
      }
    }
  } catch {}
  return null;
}

/**
 * Normalizes email address strictly: trim and lowercase.
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Safely parses any date format (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY) into canonical YYYY-MM-DD string.
 */
export function normalizeExpirationDate(raw: any): string | null {
  if (!raw) return null;
  if (Object.prototype.toString.call(raw) === '[object Date]') {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(raw).trim();
  if (!str) return null;

  // YYYY-MM-DD
  const matchYMD = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (matchYMD) {
    return `${matchYMD[1]}-${matchYMD[2].padStart(2, '0')}-${matchYMD[3].padStart(2, '0')}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const matchDMY = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (matchDMY) {
    return `${matchDMY[3]}-${matchDMY[2].padStart(2, '0')}-${matchDMY[1].padStart(2, '0')}`;
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch {}

  return null;
}

/**
 * Normalizes Status Account column:
 * Days Remaining > 0 -> "Active"
 * Days Remaining <= 0 -> "Expired"
 * "Inactive" is strictly reserved for manual administrator deactivation.
 */
export function normalizeStatusAccount(raw: any, daysRemaining?: number | null): 'Active' | 'Expired' | 'Inactive' {
  const str = String(raw || '').trim().toLowerCase();
  if (str === 'inactive') return 'Inactive';
  if (str === 'expired') return 'Expired';
  if (str === 'active') {
    if (daysRemaining !== undefined && daysRemaining !== null && daysRemaining <= 0) {
      return 'Expired';
    }
    return 'Active';
  }
  if (daysRemaining !== undefined && daysRemaining !== null) {
    return daysRemaining > 0 ? 'Active' : 'Expired';
  }
  return 'Active';
}

/**
 * Calculates calendar day difference between expirationDate and today.
 */
export function normalizeDaysRemaining(raw: any, expirationDate: string | null): number | null {
  if (expirationDate) {
    try {
      const expParts = expirationDate.split('-');
      if (expParts.length === 3) {
        const expYear = parseInt(expParts[0], 10);
        const expMonth = parseInt(expParts[1], 10) - 1;
        const expDay = parseInt(expParts[2], 10);
        const expUtc = Date.UTC(expYear, expMonth, expDay);

        const now = new Date();
        const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

        const diffDays = Math.round((expUtc - nowUtc) / (1000 * 60 * 60 * 24));
        return diffDays;
      }
    } catch {}
  }

  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const num = Number(raw);
    if (!isNaN(num)) return Math.round(num);
  }

  return null;
}

/**
 * Calculates canonical 30-day access expiration date from Purchase Date and days remaining.
 * Expiration Date = Purchase Date + 30 calendar days.
 */
export function calculateExpiration(purchaseDateStr: string, durationDays: number = 30): {
  accessExpiresAt: string;
  expirationDate: string;
  daysRemaining: number;
  isExpired: boolean;
} {
  const normPurchase = normalizeExpirationDate(purchaseDateStr) || new Date().toISOString().split('T')[0];
  const parts = normPurchase.split('-');
  const pYear = parseInt(parts[0], 10);
  const pMonth = parseInt(parts[1], 10) - 1;
  const pDay = parseInt(parts[2], 10);

  // Add exactly durationDays calendar days to purchase date
  const expiryObj = new Date(Date.UTC(pYear, pMonth, pDay + durationDays));
  const expYear = expiryObj.getUTCFullYear();
  const expMonth = String(expiryObj.getUTCMonth() + 1).padStart(2, '0');
  const expDay = String(expiryObj.getUTCDate()).padStart(2, '0');
  const expirationDate = `${expYear}-${expMonth}-${expDay}`;

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const expiryUtc = Date.UTC(expYear, expiryObj.getUTCMonth(), expiryObj.getUTCDate());

  const daysRemaining = Math.round((expiryUtc - todayUtc) / (24 * 60 * 60 * 1000));
  const isExpired = daysRemaining <= 0;

  return {
    accessExpiresAt: expirationDate,
    expirationDate,
    daysRemaining,
    isExpired,
  };
}

export interface ValidateAccessResponse {
  allowed: boolean;
  status:
    | 'ACCESS_GRANTED'
    | 'ACCOUNT_EXPIRED'
    | 'ACCOUNT_INACTIVE'
    | 'DEVICE_MISMATCH'
    | 'ORDER_NOT_SUCCESS'
    | 'BUYER_NOT_FOUND'
    | 'INVALID_PURCHASE_DATA'
    | 'BACKEND_ERROR'
    | 'INVALID_API_RESPONSE'
    | 'AUTH_REQUIRED'
    | 'INVALID_FIREBASE_TOKEN'
    | 'APPS_SCRIPT_UNAVAILABLE'
    | 'CORS_ORIGIN_BLOCKED';
  message: string;
  data?: any;
}

export async function checkBuyerEmailBeforeGoogle(rawEmail: string): Promise<EntitlementCheckResult> {
  const cleanEmail = normalizeEmail(rawEmail);
  if (!cleanEmail) {
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'NOT_REGISTERED',
      email: '',
      message: 'Silakan masukkan alamat email pembelian Anda yang terdaftar.',
    };
  }

  try {
    const res = await fetch('/api/verify-buyer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkBuyerEmail', email: cleanEmail }),
    });
    const data = await res.json().catch(() => null);
    const reason = String(data?.reason || data?.status || '').trim();

    if (res.status === 403 || reason === 'CORS_ORIGIN_BLOCKED') {
      return { isRegisteredBuyer: false, isValid: false, status: 'CORS_ORIGIN_BLOCKED', email: cleanEmail, message: data?.message || 'Preview ini tidak diizinkan mengakses server verifikasi buyer.' };
    }
    if (res.status === 503 || reason === 'APPS_SCRIPT_UNAVAILABLE') {
      return { isRegisteredBuyer: false, isValid: false, status: 'APPS_SCRIPT_UNAVAILABLE', email: cleanEmail, message: data?.message || 'Server verifikasi spreadsheet sedang tidak dapat dijangkau. Silakan coba lagi.' };
    }
    if (res.status === 502 || reason === 'INVALID_API_RESPONSE') {
      return { isRegisteredBuyer: false, isValid: false, status: 'INVALID_API_RESPONSE', email: cleanEmail, message: data?.message || 'Format respon dari server akses tidak valid.' };
    }
    if (res.status >= 500 || reason === 'BACKEND_ERROR' || reason === 'APPS_SCRIPT_CONFIG_ERROR') {
      return { isRegisteredBuyer: false, isValid: false, status: 'BACKEND_ERROR', email: cleanEmail, message: data?.message || 'Koneksi ke server sedang bermasalah. Silakan coba lagi.' };
    }
    if (reason === 'BUYER_NOT_FOUND' || data?.isRegisteredBuyer === false) {
      return { isRegisteredBuyer: false, isValid: false, status: 'NOT_REGISTERED', email: cleanEmail, message: 'Email ini tidak ditemukan dalam data pembelian.' };
    }
    if (reason === 'ORDER_NOT_SUCCESS') {
      return { isRegisteredBuyer: true, isValid: false, status: 'ORDER_NOT_SUCCESS', email: cleanEmail, message: data?.message || 'Status pesanan Lynk.id belum berstatus SUCCESS.' };
    }
    if (reason === 'INVALID_PURCHASE_DATA') {
      return { isRegisteredBuyer: true, isValid: false, status: 'INVALID_PURCHASE_DATA', email: cleanEmail, message: data?.message || 'Data tanggal pembelian tidak valid atau kosong di spreadsheet pembelian.' };
    }
    if (reason === 'ACCOUNT_EXPIRED' || String(data?.statusAccount || '').trim().toLowerCase() === 'expired') {
      return { isRegisteredBuyer: true, isValid: false, status: 'EXPIRED', statusAccount: 'Expired', email: cleanEmail, message: 'Masa berlangganan Anda telah habis.' };
    }
    if (reason === 'BUYER_EMAIL_OK' && data?.accessGranted === true) {
      return {
        isRegisteredBuyer: true,
        isValid: true,
        status: 'ACTIVE',
        statusAccount: 'Active',
        email: cleanEmail,
        buyerName: data?.buyerName || cleanEmail.split('@')[0],
        purchaseDate: normalizeExpirationDate(data?.purchaseDate) || undefined,
        accessExpiresAt: normalizeExpirationDate(data?.expirationDate) || undefined,
        expirationDate: normalizeExpirationDate(data?.expirationDate),
        daysRemaining: normalizeDaysRemaining(data?.daysRemaining, data?.expirationDate),
        message: 'Email pembelian valid.',
      };
    }
  } catch {
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'BACKEND_ERROR',
      email: cleanEmail,
      message: 'Koneksi ke server sedang bermasalah. Silakan coba lagi.',
    };
  }

  return {
    isRegisteredBuyer: false,
    isValid: false,
    status: 'BACKEND_ERROR',
    email: cleanEmail,
    message: 'Koneksi ke server sedang bermasalah. Silakan coba lagi.',
  };
}

/**
 * Validates buyer access via the server proxy (/api/verify-buyer).
 * Google Sheets is the single source of truth.
 * Authenticated via verified Firebase ID token.
 */
export async function validateLoginAccess(email?: string): Promise<ValidateAccessResponse> {
  // Ensure Firebase client auth state has loaded
  if (auth.authStateReady) {
    try {
      await auth.authStateReady();
    } catch {}
  }

  const currentUser = auth.currentUser;
  let idToken: string | null = null;
  if (currentUser) {
    try {
      idToken = await currentUser.getIdToken();
    } catch {}
  }

  const cleanEmail = normalizeEmail(email || currentUser?.email || '');
  if (!cleanEmail) {
    return {
      allowed: false,
      status: 'BUYER_NOT_FOUND',
      message: 'Email pembelian tidak ditemukan.',
    };
  }

  const slot = detectDeviceSlot();
  const persistentDeviceId = getOrCreateDeviceId();
  const detectedDeviceLabel = getStableDeviceModel(slot);

  const payload = {
    action: 'validateAccess',
    email: cleanEmail,
    deviceType: slot,
    deviceId: persistentDeviceId,
    deviceLabel: detectedDeviceLabel,
  };

  let resData: any = null;
  let httpStatus = 200;
  let networkError: any = null;

  const isLocalPreview =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const maxAttempts = isLocalPreview ? 1 : 2;
  const requestTimeoutMs = isLocalPreview ? 45_000 : 35_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/verify-buyer', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      httpStatus = res.status;
      const raw = await res.text();
      try {
        resData = JSON.parse(raw);
      } catch {
        resData = {
          success: false,
          accessGranted: false,
          reason: 'INVALID_API_RESPONSE',
          rawPreview: raw.slice(0, 120),
          message: 'Format respon dari server akses tidak valid.',
        };
      }
      networkError = null;
      break;
    } catch (err: any) {
      networkError = err;
      if (attempt < maxAttempts) {
        // Wait 1.2s before retry in case of transient dev server reload or network hiccup
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  }

  if (networkError) {
    console.warn('[buyerEntitlementService] Request could not be completed:', networkError?.message || networkError);
    return {
      allowed: false,
      status: 'BACKEND_ERROR',
      message:
        networkError?.name === 'AbortError'
          ? 'Verifikasi buyer tidak merespons dalam batas waktu. Silakan coba lagi.'
          : 'Koneksi ke server sedang sibuk. Silakan coba lagi.',
      data: { error: String(networkError?.message || networkError) },
    };
  }

  const reasonCode = String(resData?.reason || resData?.status || '').trim();

  // 1. AUTH_REQUIRED
  if (httpStatus === 401 && (reasonCode === 'AUTH_REQUIRED' || !reasonCode)) {
    return {
      allowed: false,
      status: 'AUTH_REQUIRED',
      message: 'Silakan masuk terlebih dahulu.',
      data: resData,
    };
  }

  // 2. INVALID_FIREBASE_TOKEN
  if (httpStatus === 401 && reasonCode === 'INVALID_FIREBASE_TOKEN') {
    return {
      allowed: false,
      status: 'INVALID_FIREBASE_TOKEN',
      message: 'Sesi login tidak valid atau telah kedaluwarsa. Silakan masuk kembali.',
      data: resData,
    };
  }

  // 3. CORS_ORIGIN_BLOCKED
  if (httpStatus === 403 || reasonCode === 'CORS_ORIGIN_BLOCKED') {
    return {
      allowed: false,
      status: 'CORS_ORIGIN_BLOCKED',
      message: 'Akses ditolak oleh kebijakan CORS.',
      data: resData,
    };
  }

  // 4. APPS_SCRIPT_UNAVAILABLE
  if (httpStatus === 503 || reasonCode === 'APPS_SCRIPT_UNAVAILABLE') {
    return {
      allowed: false,
      status: 'APPS_SCRIPT_UNAVAILABLE',
      message: 'Server verifikasi spreadsheet sedang tidak dapat dijangkau. Silakan coba lagi.',
      data: resData,
    };
  }

  // 5. INVALID_API_RESPONSE
  if (httpStatus === 502 || reasonCode === 'INVALID_API_RESPONSE') {
    return {
      allowed: false,
      status: 'INVALID_API_RESPONSE',
      message: 'Format respon dari server akses tidak valid.',
      data: resData,
    };
  }

  // 6. BACKEND_ERROR or other 500s
  if (httpStatus >= 500 || reasonCode === 'BACKEND_ERROR' || reasonCode === 'FIREBASE_ADMIN_CONFIG_ERROR' || reasonCode === 'APPS_SCRIPT_CONFIG_ERROR') {
    return {
      allowed: false,
      status: 'BACKEND_ERROR',
      message: resData?.message || 'Koneksi ke server sedang bermasalah. Silakan coba lagi.',
      data: resData,
    };
  }

  // 7. BUYER_NOT_FOUND
  if (reasonCode === 'BUYER_NOT_FOUND' || resData.isRegisteredBuyer === false) {
    return {
      allowed: false,
      status: 'BUYER_NOT_FOUND',
      message: 'Email ini tidak ditemukan dalam data pembelian.',
      data: resData,
    };
  }

  // 8. ORDER_NOT_SUCCESS: Lynk.id order status is not SUCCESS
  if (reasonCode === 'ORDER_NOT_SUCCESS') {
    return {
      allowed: false,
      status: 'ORDER_NOT_SUCCESS',
      message: resData.message || 'Status pesanan Lynk.id belum berstatus SUCCESS.',
      data: resData,
    };
  }

  // 9. INVALID_PURCHASE_DATA
  if (reasonCode === 'INVALID_PURCHASE_DATA') {
    return {
      allowed: false,
      status: 'INVALID_PURCHASE_DATA',
      message: resData.message || 'Data tanggal pembelian tidak valid atau kosong di spreadsheet pembelian.',
      data: resData,
    };
  }

  // 9. ACCOUNT_EXPIRED
  const isStatusExpired = String(resData.statusAccount || '').trim().toLowerCase() === 'expired';
  if (reasonCode === 'ACCOUNT_EXPIRED' || isStatusExpired) {
    return {
      allowed: false,
      status: 'ACCOUNT_EXPIRED',
      message: 'Masa berlangganan Anda telah habis.',
      data: resData,
    };
  }

  if (reasonCode === 'ACCOUNT_INACTIVE' || String(resData.statusAccount || '').trim().toLowerCase() === 'inactive') {
    return {
      allowed: false,
      status: 'ACCOUNT_INACTIVE',
      message: 'Status akun tidak aktif. Silakan hubungi administrator.',
      data: resData,
    };
  }

  // 10. DEVICE_MISMATCH
  if (reasonCode === 'DEVICE_MISMATCH') {
    return {
      allowed: false,
      status: 'DEVICE_MISMATCH',
      message: 'Perangkat ini tidak terdaftar.',
      data: resData,
    };
  }

  // 11. ACCESS_GRANTED
  if (reasonCode === 'ACCESS_GRANTED' && resData.accessGranted === true) {
    return {
      allowed: true,
      status: 'ACCESS_GRANTED',
      message: resData.message || 'Akses aktif.',
      data: resData,
    };
  }

  // 12. Fallback
  return {
    allowed: false,
    status: 'BACKEND_ERROR',
    message: resData?.message || 'Koneksi ke server sedang bermasalah. Silakan coba lagi.',
    data: resData,
  };
}

/**
 * Checks buyer entitlement using the Google Sheets O:T schema:
 * - Column O = Purchase Date
 * - Column P = Expiration Date (Purchase Date + 30 calendar days)
 * - Column Q = Status Account ("Active" if Days Remaining > 0, "Expired" if <= 0)
 * - Column R = Device Handphone (Mobile slot)
 * - Column S = Device Laptop (Desktop slot)
 * - Column T = Lynk.id Order Status (Read only)
 * - Column U = Buyer Email
 * - Column V = Buyer Name
 */
export async function checkBuyerEntitlement(
  rawEmail: string,
  { allowCachedFallback = true }: { allowCachedFallback?: boolean } = {}
): Promise<EntitlementCheckResult> {
  const cleanEmail = normalizeEmail(rawEmail);
  if (!cleanEmail) {
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'NOT_REGISTERED',
      email: '',
      message: 'Silakan masukkan alamat email Anda.',
    };
  }

  const slot = detectDeviceSlot();
  const detectedDeviceLabel = getStableDeviceModel(slot);

  console.log('[EntitlementService] Checking entitlement for:', cleanEmail);

  // Validate access with backend endpoint
  const access = await validateLoginAccess(cleanEmail);
  const remoteData = access.data;

  // Handle explicit failure reasons with distinct messages
  if (access.status === 'AUTH_REQUIRED') {
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'AUTH_REQUIRED',
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: 'Silakan masuk terlebih dahulu.',
    };
  }

  if (access.status === 'INVALID_FIREBASE_TOKEN') {
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'INVALID_FIREBASE_TOKEN',
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: 'Sesi login tidak valid atau telah kedaluwarsa. Silakan masuk kembali.',
    };
  }

  if (access.status === 'APPS_SCRIPT_UNAVAILABLE') {
    const cached = allowCachedFallback ? getCachedEntitlement(cleanEmail) : null;
    if (cached && cached.isValid && cached.expirationDate) {
      const remaining = normalizeDaysRemaining(null, cached.expirationDate);
      if (remaining !== null && remaining > 0) {
        return {
          ...cached,
          daysRemaining: remaining,
          message: 'Sesi aktif (menggunakan data verifikasi tersimpan).',
        };
      }
    }
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'APPS_SCRIPT_UNAVAILABLE',
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: 'Server verifikasi spreadsheet sedang tidak dapat dijangkau. Silakan coba lagi.',
    };
  }

  if (access.status === 'INVALID_API_RESPONSE') {
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'INVALID_API_RESPONSE',
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: 'Format respon dari server akses tidak valid.',
    };
  }

  if (access.status === 'CORS_ORIGIN_BLOCKED') {
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'CORS_ORIGIN_BLOCKED',
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: 'Origin preview tidak diizinkan oleh server verifikasi buyer.',
    };
  }

  if (access.status === 'BACKEND_ERROR') {
    const cached = allowCachedFallback ? getCachedEntitlement(cleanEmail) : null;
    if (cached && cached.isValid && cached.expirationDate) {
      const remaining = normalizeDaysRemaining(null, cached.expirationDate);
      if (remaining !== null && remaining > 0) {
        return {
          ...cached,
          daysRemaining: remaining,
          message: 'Sesi aktif (menggunakan data verifikasi tersimpan).',
        };
      }
    }
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'BACKEND_ERROR',
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: 'Koneksi ke server sedang bermasalah. Silakan coba lagi.',
    };
  }

  if (access.status === 'INVALID_PURCHASE_DATA') {
    return {
      isRegisteredBuyer: true,
      isValid: false,
      status: 'INVALID_PURCHASE_DATA',
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: access.message || 'Data tanggal pembelian tidak valid atau kosong di spreadsheet pembelian.',
    };
  }

  if (access.status === 'BUYER_NOT_FOUND') {
    return {
      isRegisteredBuyer: false,
      isValid: false,
      status: 'NOT_REGISTERED',
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: 'Email ini tidak ditemukan dalam data pembelian.',
    };
  }

  if (access.status === 'ORDER_NOT_SUCCESS') {
    return {
      isRegisteredBuyer: true,
      isValid: false,
      status: 'ORDER_NOT_SUCCESS',
      orderStatus: remoteData?.orderStatus,
      email: cleanEmail,
      deviceSlot: slot,
      deviceModel: detectedDeviceLabel,
      message: access.message || 'Status pesanan Lynk.id belum berstatus SUCCESS.',
    };
  }

  if (access.status === 'ACCOUNT_INACTIVE') {
    return {
      isRegisteredBuyer: true,
      isValid: false,
      status: 'INACTIVE',
      statusAccount: 'Inactive',
      email: cleanEmail,
      message: access.message,
    };
  }

  if (access.status === 'ACCOUNT_EXPIRED') {
    return {
      isRegisteredBuyer: true,
      isValid: false,
      status: 'EXPIRED',
      statusAccount: 'Expired',
      email: cleanEmail,
      buyerName: remoteData?.buyerName || cleanEmail.split('@')[0],
      purchaseDate: normalizeExpirationDate(remoteData?.purchaseDate) || undefined,
      accessExpiresAt: normalizeExpirationDate(remoteData?.expirationDate) || undefined,
      expirationDate: normalizeExpirationDate(remoteData?.expirationDate),
      daysRemaining: 0,
      registeredDevice: remoteData?.registeredDevice || null,
      deviceModel: detectedDeviceLabel,
      deviceSlot: slot,
      message: 'Masa berlangganan Anda telah habis.',
    };
  }

  if (access.status === 'DEVICE_MISMATCH') {
    return {
      isRegisteredBuyer: true,
      isValid: false,
      status: 'DEVICE_MISMATCH',
      statusAccount: remoteData?.statusAccount || 'Active',
      email: cleanEmail,
      buyerName: remoteData?.buyerName || cleanEmail.split('@')[0],
      purchaseDate: normalizeExpirationDate(remoteData?.purchaseDate) || undefined,
      accessExpiresAt: normalizeExpirationDate(remoteData?.expirationDate) || undefined,
      expirationDate: normalizeExpirationDate(remoteData?.expirationDate),
      daysRemaining: normalizeDaysRemaining(remoteData?.daysRemaining, remoteData?.expirationDate),
      registeredDevice: remoteData?.registeredDevice || null,
      deviceHandphone: remoteData?.deviceHandphone || null,
      deviceLaptop: remoteData?.deviceLaptop || null,
      mobileDeviceId: remoteData?.mobileDeviceId || null,
      laptopDeviceId: remoteData?.laptopDeviceId || null,
      deviceModel: detectedDeviceLabel,
      deviceSlot: slot,
      message: 'Perangkat ini tidak terdaftar.',
    };
  }

  // Purchase Date is base of 30-day calculation (Column O)
  const purchaseDate = normalizeExpirationDate(remoteData?.purchaseDate);
  const expirationDate = normalizeExpirationDate(remoteData?.expirationDate);
  const daysRemaining = normalizeDaysRemaining(remoteData?.daysRemaining, expirationDate);
  const statusAccount = normalizeStatusAccount(remoteData?.statusAccount, daysRemaining);

  // Device slots from sheets (Column R & Column S) and technical IDs (Column V & Column W)
  const deviceHandphone = remoteData?.deviceHandphone !== undefined ? remoteData.deviceHandphone : null;
  const deviceLaptop = remoteData?.deviceLaptop !== undefined ? remoteData.deviceLaptop : null;
  const mobileDeviceId = remoteData?.mobileDeviceId !== undefined ? remoteData.mobileDeviceId : null;
  const laptopDeviceId = remoteData?.laptopDeviceId !== undefined ? remoteData.laptopDeviceId : null;

  // ACCESS_GRANTED
  const result: EntitlementCheckResult = {
    isRegisteredBuyer: true,
    isValid: true,
    status: 'ACTIVE',
    email: cleanEmail,
    buyerName: remoteData?.buyerName || cleanEmail.split('@')[0],
    purchaseDate: purchaseDate || undefined,
    accessExpiresAt: expirationDate || undefined,
    expirationDate,
    statusAccount,
    daysRemaining,
    registeredDevice: remoteData?.registeredDevice || null,
    deviceHandphone: deviceHandphone || (slot === 'mobile' ? remoteData?.registeredDevice : null),
    deviceLaptop: deviceLaptop || (slot === 'desktop' ? remoteData?.registeredDevice : null),
    mobileDeviceId: mobileDeviceId || (slot === 'mobile' ? remoteData?.mobileDeviceId : null),
    laptopDeviceId: laptopDeviceId || (slot === 'desktop' ? remoteData?.laptopDeviceId : null),
    deviceModel: detectedDeviceLabel,
    deviceSlot: slot,
    message: remoteData?.message || 'Akses aktif.',
  };

  console.log('[EntitlementService] Result: ACCESS_GRANTED', {
    email: cleanEmail,
    status: result.status,
    daysRemaining: result.daysRemaining,
    expirationDate: result.expirationDate,
  });

  // Cache latest valid check result in localStorage for fast offline boot
  try {
    localStorage.setItem(`${STORAGE_KEY_ENTITLEMENT_CACHE}${cleanEmail}`, JSON.stringify(result));
  } catch {}

  return result;
}
