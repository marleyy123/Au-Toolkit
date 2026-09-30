import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface AuthenticatedRequest extends express.Request {
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
}

// Optional auth middleware (attaches user claims if a valid token is provided)
function optionalFirebaseToken(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1].trim();
    if (idToken) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && (payload.user_id || payload.sub)) {
            req.user = {
              uid: payload.user_id || payload.sub,
              email: (payload.email || '').trim().toLowerCase(),
              emailVerified: Boolean(payload.email_verified),
            };
          }
        }
      } catch (tokenErr: any) {
        console.warn('[OptionalAuth] Token parse notice:', tokenErr?.message || tokenErr);
      }
    }
  }
  next();
}

// Resolve production Apps Script deployment URL strictly from environment variable GOOGLE_SHEETS_SCRIPT_URL
function resolveAppsScriptUrl(): string | null {
  let envUrl = (process.env.GOOGLE_SHEETS_SCRIPT_URL || '').trim();
  if ((envUrl.startsWith('"') && envUrl.endsWith('"')) || (envUrl.startsWith("'") && envUrl.endsWith("'"))) {
    envUrl = envUrl.slice(1, -1).trim();
  }
  if (!envUrl) {
    console.error('[AppsScript] GOOGLE_SHEETS_SCRIPT_URL is missing from environment.');
    return null;
  }
  if (!envUrl.startsWith('https://script.google.com/macros/s/') || !envUrl.endsWith('/exec')) {
    console.error('[AppsScript] Invalid GOOGLE_SHEETS_SCRIPT_URL. Must be a valid production Apps Script Web App URL ending with /exec.');
    return null;
  }

  return envUrl;
}

/**
 * Extracts the stable hardware signature from any device ID string.
 * Strips out browser-specific random installation suffixes.
 */
function extractStableDeviceSignature(rawId: string | null | undefined): string {
  if (!rawId) return '';
  let id = String(rawId).trim().toLowerCase();
  if (id.includes('||')) {
    id = id.split('||')[0].trim();
  }

  const hwMatch = id.match(/hw_([a-f0-9]{6,16})/);
  if (hwMatch) {
    const isMobile = id.includes('mobile') || id.includes('handphone');
    const slot = isMobile ? 'mobile' : 'desktop';
    return `dev_${slot}_hw_${hwMatch[1]}`;
  }

  return id;
}

/**
 * Extracts raw hardware hash from device ID string.
 */
function extractHardwareHash(rawId: string | null | undefined): string {
  if (!rawId) return '';
  const match = String(rawId).toLowerCase().match(/hw_([a-f0-9]{6,16})/);
  return match ? match[1] : '';
}

/**
 * Stable device comparison using technical device ID stored in Column V / W.
 */
function isSameDeviceId(currentDeviceId: string, registeredId: string | null | undefined): boolean {
  if (!registeredId || !currentDeviceId) return false;

  let cId = String(currentDeviceId).trim().toLowerCase();
  let regId = String(registeredId).trim().toLowerCase();

  if (regId.includes('||')) {
    const parts = regId.split('||');
    const p0 = parts[0].trim();
    const p1 = parts.length > 1 ? parts[1].trim() : '';
    regId = (p0.startsWith('dev_') || p0.includes('hw_')) ? p0 : p1;
  }

  // 1. Exact match
  if (cId === regId) return true;

  // 2. Stable hardware signature match (e.g. dev_desktop_hw_a5d42bc6)
  const stableCurrent = extractStableDeviceSignature(cId);
  const stableRegistered = extractStableDeviceSignature(regId);
  if (stableCurrent && stableRegistered && stableCurrent === stableRegistered) {
    return true;
  }

  // 3. Hardware hash match
  const currentHash = extractHardwareHash(cId);
  const regHash = extractHardwareHash(regId);
  if (currentHash && regHash && currentHash === regHash) {
    return true;
  }

  // 4. Substring match
  if (regId.length >= 12 && cId.length >= 12) {
    if (cId.includes(regId) || regId.includes(cId)) return true;
  }

  return false;
}

async function startServer() {
  const app = express();
  const HOST = process.env.HOST || 'localhost';
  const PORT = Number(process.env.PORT || 3000);

  const jsonParser = express.json();

  // CORS configuration
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  function isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return true; // Same-origin or non-browser / server-to-server

    // 1. Explicit production ALLOWED_ORIGINS
    if (allowedOrigins.includes(origin)) return true;

    // 2. Specific APP_URL from container environment
    if (process.env.APP_URL && origin === process.env.APP_URL) return true;

    const isDev = process.env.NODE_ENV !== 'production';

    // 3. AI Studio development and preview domains
    const isAiStudioOrigin =
      origin === 'https://ai.studio' ||
      origin.endsWith('.ai.studio') ||
      origin === 'https://aistudio.google.com' ||
      origin.endsWith('.aistudio.google.com') ||
      origin.endsWith('.google.com') ||
      origin.endsWith('.run.app') ||
      origin.endsWith('.usercontent.goog');

    if (isAiStudioOrigin) {
      return true;
    }

    // 4. Local development origins
    if (
      isDev &&
      (origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://0.0.0.0:'))
    ) {
      return true;
    }

    return false;
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // API endpoint for health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Helper functions for P:T Google Sheets schema normalization
  function normalizeExpirationDate(raw: any): string | null {
    if (!raw) return null;
    const str = String(raw).trim();
    if (!str) return null;
    const matchYMD = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (matchYMD) {
      return `${matchYMD[1]}-${matchYMD[2].padStart(2, '0')}-${matchYMD[3].padStart(2, '0')}`;
    }
    const matchDMY = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (matchDMY) {
      return `${matchDMY[3]}-${matchDMY[2].padStart(2, '0')}-${matchDMY[1].padStart(2, '0')}`;
    }
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch {}
    return null;
  }

  function normalizeDaysRemaining(raw: any, expDate: string | null): number | null {
    if (expDate) {
      try {
        const expParts = expDate.split('-');
        if (expParts.length === 3) {
          const expUtc = Date.UTC(parseInt(expParts[0], 10), parseInt(expParts[1], 10) - 1, parseInt(expParts[2], 10));
          const now = new Date();
          const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
          return Math.round((expUtc - nowUtc) / (1000 * 60 * 60 * 24));
        }
      } catch {}
    }
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      const num = Number(raw);
      if (!isNaN(num)) return Math.round(num);
    }
    return null;
  }

  // Authoritative buyer verification proxying Google Apps Script
  // Supports primary buyer-email login (direct purchase email) and Firebase sessions.
  const handleBuyerVerification = async (req: AuthenticatedRequest, res: express.Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    try {
      const queryOrBody = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
      const requestedEmail = String(
        queryOrBody.email ||
        queryOrBody.buyer_email ||
        queryOrBody.user_email ||
        req.user?.email ||
        ''
      ).trim().toLowerCase();

      if (!requestedEmail) {
        return res.status(400).json({
          success: false,
          accessGranted: false,
          reason: 'EMAIL_REQUIRED',
          status: 'EMAIL_REQUIRED',
          message: 'Silakan masukkan alamat email pembelian Anda yang terdaftar.',
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
        return res.status(400).json({
          success: false,
          accessGranted: false,
          reason: 'EMAIL_REQUIRED',
          status: 'EMAIL_REQUIRED',
          message: 'Format email pembelian tidak valid.',
        });
      }

      const verifiedEmail = requestedEmail;

      const rawDeviceId = String(queryOrBody.device_id || queryOrBody.deviceId || '').trim();
      const rawDeviceLabel = String(
        queryOrBody.deviceLabel ||
        queryOrBody.device_label ||
        queryOrBody.device_model ||
        queryOrBody.deviceModel ||
        ''
      ).trim();
      const rawDeviceType = String(
        queryOrBody.deviceType ||
        queryOrBody.device_type ||
        queryOrBody.device_slot ||
        queryOrBody.deviceSlot ||
        'desktop'
      ).trim().toLowerCase();

      // Reject missing or generic device IDs
      if (!rawDeviceId || rawDeviceId === 'mobile_device' || rawDeviceId === 'desktop_device' || rawDeviceId === 'temp_device_node') {
        return res.status(400).json({
          success: false,
          accessGranted: false,
          reason: 'DEVICE_ID_REQUIRED',
          status: 'DEVICE_ID_REQUIRED',
          message: 'Identitas perangkat (device ID) valid diperlukan.',
        });
      }

      const normalizedDeviceType = rawDeviceType === 'mobile' ? 'mobile' : 'desktop';
      const effectiveDeviceLabel = rawDeviceLabel || (normalizedDeviceType === 'mobile' ? 'Mobile Device' : 'Desktop Device');

      // Retrieve target Google Apps Script URL using environment-aware resolver
      const scriptUrl = resolveAppsScriptUrl();
      if (!scriptUrl) {
        console.error('[VerifyBuyer] APPS_SCRIPT_CONFIG_ERROR: GOOGLE_SHEETS_SCRIPT_URL is missing or invalid.');
        return res.status(500).json({
          success: false,
          accessGranted: false,
          reason: 'APPS_SCRIPT_CONFIG_ERROR',
          status: 'APPS_SCRIPT_CONFIG_ERROR',
          message: 'Konfigurasi server spreadsheet akses (GOOGLE_SHEETS_SCRIPT_URL) belum disetel dengan benar.',
        });
      }

      console.log('[Entitlement] Lookup attempt:', {
        email: verifiedEmail,
        deviceId: rawDeviceId,
        deviceType: normalizedDeviceType,
      });

      const stableDeviceId = extractStableDeviceSignature(rawDeviceId) || rawDeviceId;
      const action = String(queryOrBody.action || 'validateAccess').trim();
      const payload = {
        action: action === 'registerDevice' ? 'registerDevice' : 'validateAccess',
        email: verifiedEmail,
        deviceType: normalizedDeviceType,
        deviceId: stableDeviceId,
        deviceLabel: effectiveDeviceLabel,
      };

      let gasResponse: Response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        gasResponse = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchErr: any) {
        console.error('[VerifyBuyer] APPS_SCRIPT_UNAVAILABLE:', fetchErr?.message || fetchErr);
        return res.status(503).json({
          success: false,
          accessGranted: false,
          reason: 'APPS_SCRIPT_UNAVAILABLE',
          status: 'APPS_SCRIPT_UNAVAILABLE',
          message: 'Server verifikasi spreadsheet sedang tidak dapat dijangkau. Silakan coba lagi.',
        });
      }

      const upstreamStatus = gasResponse.status;
      const upstreamContentType = gasResponse.headers.get('content-type') || '';
      const raw = await gasResponse.text();
      const trimmed = raw.trim();

      let isValidJson = false;
      let parsedGasResult: any = null;

      if (!trimmed.startsWith('<') && !trimmed.includes('<!DOCTYPE') && !trimmed.includes("window['ppConfig']")) {
        try {
          parsedGasResult = JSON.parse(trimmed);
          isValidJson = Boolean(parsedGasResult && typeof parsedGasResult === 'object');
        } catch {
          isValidJson = false;
        }
      }

      // Server-side logging of raw Apps Script response (safe, no secrets or private user data)
      console.log('[AppsScriptUpstream]', {
        status: upstreamStatus,
        contentType: upstreamContentType,
        isValidJson,
        reason: parsedGasResult ? (parsedGasResult.reason || parsedGasResult.status) : undefined,
        accessGranted: parsedGasResult ? parsedGasResult.accessGranted : undefined,
      });

      if (!isValidJson) {
        console.error('[AppsScriptUpstream] Non-JSON response preview:', trimmed.slice(0, 160));
        return res.status(502).json({
          success: false,
          accessGranted: false,
          reason: 'INVALID_API_RESPONSE',
          status: 'INVALID_API_RESPONSE',
          message: 'Format respon dari server akses tidak valid.',
        });
      }

      const reasonCode = String(parsedGasResult.reason || parsedGasResult.status || '').trim();

      console.log('[Entitlement] Lookup result:', {
        email: verifiedEmail,
        status: reasonCode,
        accessGranted: parsedGasResult.accessGranted === true || reasonCode === 'ACCESS_GRANTED',
      });

      // 1. BUYER_NOT_FOUND
      if (reasonCode === 'BUYER_NOT_FOUND' || parsedGasResult.isRegisteredBuyer === false) {
        return res.json({
          success: true,
          accessGranted: false,
          reason: 'BUYER_NOT_FOUND',
          status: 'BUYER_NOT_FOUND',
          isRegisteredBuyer: false,
          isValid: false,
          email: verifiedEmail,
          buyerName: parsedGasResult.buyerName || verifiedEmail.split('@')[0],
          message: 'Email ini tidak ditemukan dalam data pembelian.',
        });
      }

      // 2. ORDER_NOT_SUCCESS: Lynk.id order status in Column T is not SUCCESS (e.g. PENDING, FAILED, CANCELLED, REFUNDED)
      if (reasonCode === 'ORDER_NOT_SUCCESS') {
        return res.json({
          success: true,
          accessGranted: false,
          reason: 'ORDER_NOT_SUCCESS',
          status: 'ORDER_NOT_SUCCESS',
          isRegisteredBuyer: true,
          isValid: false,
          email: verifiedEmail,
          orderStatus: parsedGasResult.orderStatus || 'NOT_SUCCESS',
          buyerName: parsedGasResult.buyerName || verifiedEmail.split('@')[0],
          message: parsedGasResult.message || 'Status pesanan Lynk.id belum berstatus SUCCESS.',
        });
      }

      // 3. INVALID_PURCHASE_DATA
      if (reasonCode === 'INVALID_PURCHASE_DATA') {
        return res.json({
          success: true,
          accessGranted: false,
          reason: 'INVALID_PURCHASE_DATA',
          status: 'INVALID_PURCHASE_DATA',
          isRegisteredBuyer: true,
          isValid: false,
          email: verifiedEmail,
          buyerName: parsedGasResult.buyerName || verifiedEmail.split('@')[0],
          message: parsedGasResult.message || 'Data tanggal pembelian tidak valid atau kosong di sheet order.',
        });
      }

      // 4. ACCOUNT_EXPIRED
      const isStatusExpired = String(parsedGasResult.statusAccount || '').trim().toLowerCase() === 'expired';
      if (reasonCode === 'ACCOUNT_EXPIRED' || isStatusExpired) {
        const expirationDate = normalizeExpirationDate(parsedGasResult.expirationDate);
        return res.json({
          success: true,
          accessGranted: false,
          reason: 'ACCOUNT_EXPIRED',
          status: 'ACCOUNT_EXPIRED',
          statusAccount: 'Expired',
          isRegisteredBuyer: true,
          isValid: false,
          email: verifiedEmail,
          buyerName: parsedGasResult.buyerName || verifiedEmail.split('@')[0],
          purchaseDate: normalizeExpirationDate(parsedGasResult.purchaseDate),
          expirationDate,
          daysRemaining: 0,
          registeredDevice: parsedGasResult.registeredDevice || null,
          message: 'Masa berlangganan Anda telah habis.',
        });
      }

      // 4. DEVICE_MISMATCH
      if (
        reasonCode === 'DEVICE_MISMATCH' ||
        (parsedGasResult.accessGranted === false && parsedGasResult.reason === 'DEVICE_MISMATCH')
      ) {
        // Evaluate if physical hardware signature actually matches
        // (Resolves false rejections where stored Column W/V in the sheet contains a legacy browser/installation suffix)
        const registeredTechId = normalizedDeviceType === 'mobile'
          ? (parsedGasResult.mobileDeviceId || parsedGasResult.registeredDevice)
          : (parsedGasResult.laptopDeviceId || parsedGasResult.registeredDevice);

        if (registeredTechId && isSameDeviceId(rawDeviceId, registeredTechId)) {
          console.log('[VerifyBuyer] Resolved DEVICE_MISMATCH via stable hardware signature:', {
            rawDeviceId,
            registeredTechId,
            stableSignature: stableDeviceId,
          });
          const expirationDate = normalizeExpirationDate(parsedGasResult.expirationDate);
          const daysRemaining = normalizeDaysRemaining(parsedGasResult.daysRemaining, expirationDate);

          return res.json({
            success: true,
            accessGranted: true,
            reason: 'ACCESS_GRANTED',
            status: 'ACCESS_GRANTED',
            statusAccount: 'Active',
            isRegisteredBuyer: true,
            isValid: true,
            email: verifiedEmail,
            buyerName: parsedGasResult.buyerName || verifiedEmail.split('@')[0],
            purchaseDate: normalizeExpirationDate(parsedGasResult.purchaseDate),
            expirationDate,
            daysRemaining,
            registeredDevice: parsedGasResult.registeredDevice || effectiveDeviceLabel,
            deviceHandphone: parsedGasResult.deviceHandphone || null,
            deviceLaptop: parsedGasResult.deviceLaptop || null,
            mobileDeviceId: parsedGasResult.mobileDeviceId || null,
            laptopDeviceId: parsedGasResult.laptopDeviceId || null,
            deviceType: parsedGasResult.deviceType || normalizedDeviceType,
            deviceModel: effectiveDeviceLabel,
            message: 'Akses aktif.',
          });
        }

        const expirationDate = normalizeExpirationDate(parsedGasResult.expirationDate);
        return res.json({
          success: true,
          accessGranted: false,
          reason: 'DEVICE_MISMATCH',
          status: 'DEVICE_MISMATCH',
          isRegisteredBuyer: true,
          isValid: false,
          statusAccount: parsedGasResult.statusAccount || 'Active',
          email: verifiedEmail,
          buyerName: parsedGasResult.buyerName || verifiedEmail.split('@')[0],
          purchaseDate: normalizeExpirationDate(parsedGasResult.purchaseDate),
          expirationDate,
          daysRemaining: normalizeDaysRemaining(parsedGasResult.daysRemaining, expirationDate),
          registeredDevice: parsedGasResult.registeredDevice || null,
          deviceHandphone: parsedGasResult.deviceHandphone || null,
          deviceLaptop: parsedGasResult.deviceLaptop || null,
          mobileDeviceId: parsedGasResult.mobileDeviceId || null,
          laptopDeviceId: parsedGasResult.laptopDeviceId || null,
          deviceType: parsedGasResult.deviceType || normalizedDeviceType,
          deviceModel: effectiveDeviceLabel,
          message: 'Perangkat ini tidak terdaftar.',
        });
      }

      // 5. ACCESS_GRANTED
      if (reasonCode === 'ACCESS_GRANTED' || parsedGasResult.accessGranted === true) {
        const expirationDate = normalizeExpirationDate(parsedGasResult.expirationDate);
        const daysRemaining = normalizeDaysRemaining(parsedGasResult.daysRemaining, expirationDate);

        return res.json({
          success: true,
          accessGranted: true,
          reason: 'ACCESS_GRANTED',
          status: 'ACCESS_GRANTED',
          statusAccount: 'Active',
          isRegisteredBuyer: true,
          isValid: true,
          email: verifiedEmail,
          buyerName: parsedGasResult.buyerName || verifiedEmail.split('@')[0],
          purchaseDate: normalizeExpirationDate(parsedGasResult.purchaseDate),
          expirationDate,
          daysRemaining,
          registeredDevice: parsedGasResult.registeredDevice || rawDeviceId,
          deviceHandphone: parsedGasResult.deviceHandphone || null,
          deviceLaptop: parsedGasResult.deviceLaptop || null,
          mobileDeviceId: parsedGasResult.mobileDeviceId || null,
          laptopDeviceId: parsedGasResult.laptopDeviceId || null,
          deviceType: parsedGasResult.deviceType || normalizedDeviceType,
          deviceModel: effectiveDeviceLabel,
          message: parsedGasResult.message || 'Akses aktif.',
        });
      }

      // 6. Unhandled / unexpected response
      console.warn('[VerifyBuyer] BACKEND_ERROR: Unrecognized response from Apps Script:', parsedGasResult);
      return res.status(500).json({
        success: false,
        accessGranted: false,
        reason: 'BACKEND_ERROR',
        status: 'BACKEND_ERROR',
        isRegisteredBuyer: false,
        isValid: false,
        email: verifiedEmail,
        message: 'Koneksi ke server sedang bermasalah. Silakan coba lagi.',
      });
    } catch (unexpectedErr: any) {
      console.error('[VerifyBuyer] UNHANDLED_BACKEND_ERROR:', unexpectedErr?.message || unexpectedErr);
      return res.status(500).json({
        success: false,
        accessGranted: false,
        reason: 'BACKEND_ERROR',
        status: 'BACKEND_ERROR',
        message: 'Terjadi kesalahan pada server akses. Silakan coba lagi.',
      });
    }
  };

  const hasLocalBuyerVerificationConfig = Boolean(
    String(process.env.GOOGLE_SHEETS_SCRIPT_URL || '').trim()
  );

  // In local development without the server-only Apps Script configuration,
  // leave this route to Vite's development proxy. The proxy targets the
  // deployed Netlify Function, so verification remains enforced and no
  // server secret is exposed to the client bundle.
  if (process.env.NODE_ENV === 'production' || hasLocalBuyerVerificationConfig) {
    app.post('/api/verify-buyer', jsonParser, optionalFirebaseToken, handleBuyerVerification);
  }
  app.post('/api/verify-code', jsonParser, optionalFirebaseToken, handleBuyerVerification);

  // API endpoint to fetch and parse Google Drive public folder contents
  app.get('/api/gdrive-folder', optionalFirebaseToken, async (req, res) => {
    try {
      const folderParam = (req.query.folderId || req.query.url || '') as string;
      if (!folderParam) {
        return res.status(400).json({ error: 'Missing folderId or url parameter' });
      }

      let folderId = folderParam.trim();
      const folderMatch = folderParam.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderMatch && folderMatch[1]) {
        folderId = folderMatch[1];
      } else {
        const idMatch = folderParam.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
          folderId = idMatch[1];
        }
      }

      // Validate folder ID format to prevent SSRF
      if (!/^[a-zA-Z0-9_-]{10,64}$/.test(folderId)) {
        return res.status(400).json({ error: 'Invalid Google Drive folder ID format' });
      }

      const targetUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
      const gdriveRes = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!gdriveRes.ok) {
        return res.status(502).json({ error: 'Failed to access Google Drive folder' });
      }

      const html = await gdriveRes.text();
      const stickers: Array<{ id: string; name: string; url: string; dateAdded: number }> = [];
      const seenIds = new Set<string>();

      const regexDriveItem =
        /<div[^>]*class="[^"]*drive-item[^"]*"[^>]*data-id="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="[^"]*drive-item-title[^"]*"[^>]*>([^<]+)<\/div>/g;
      let itemMatch: RegExpExecArray | null;

      while ((itemMatch = regexDriveItem.exec(html)) !== null) {
        const fileId = itemMatch[1].trim();
        let fileName = itemMatch[2].trim();
        fileName = fileName.replace(/\.[^/.]+$/, '');

        if (fileId && !seenIds.has(fileId)) {
          seenIds.add(fileId);
          stickers.push({
            id: `stk-${fileId}`,
            name: fileName || `Stiker ${stickers.length + 1}`,
            url: `https://lh3.googleusercontent.com/d/${fileId}`,
            dateAdded: Date.now(),
          });
        }
      }

      if (stickers.length === 0) {
        const fallbackRegex = /data-id="([a-zA-Z0-9_-]{25,})"/g;
        let fbMatch: RegExpExecArray | null;
        let count = 1;
        while ((fbMatch = fallbackRegex.exec(html)) !== null) {
          const fileId = fbMatch[1];
          if (!seenIds.has(fileId) && fileId !== folderId) {
            seenIds.add(fileId);
            stickers.push({
              id: `stk-${fileId}`,
              name: `Stiker ${count++}`,
              url: `https://lh3.googleusercontent.com/d/${fileId}`,
              dateAdded: Date.now(),
            });
          }
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.json({
        success: true,
        folderId,
        count: stickers.length,
        stickers,
      });
    } catch {
      return res.status(500).json({ error: 'Failed to process Google Drive folder request' });
    }
  });

  // Spotify OEmbed Proxy API
  app.get('/api/spotify-track', optionalFirebaseToken, async (req, res) => {
    try {
      const urlParam = (req.query.url || '') as string;
      if (!urlParam) {
        return res.status(400).json({ error: 'Missing url parameter' });
      }

      let cleanUrl = urlParam.trim();
      let trackId = '';

      if (/^[a-zA-Z0-9]{22}$/.test(cleanUrl)) {
        trackId = cleanUrl;
        cleanUrl = `https://open.spotify.com/track/${trackId}`;
      } else {
        const trackMatch = cleanUrl.match(/track\/([a-zA-Z0-9]{22})/);
        if (trackMatch && trackMatch[1]) {
          trackId = trackMatch[1];
        }
      }

      if (!trackId) {
        return res.status(400).json({ error: 'Invalid Spotify track URL or ID' });
      }

      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
      const oembedRes = await fetch(oembedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept: 'application/json',
        },
      });

      let songTitle = 'Hati-Hati di Jalan';
      let artistName = 'Tulus';
      let coverUrl = '';

      if (oembedRes.ok) {
        const oembedData = (await oembedRes.json()) as any;
        if (oembedData.title) {
          const parts = oembedData.title.split(' - ');
          if (parts.length >= 2) {
            songTitle = parts[0].trim();
            artistName = parts.slice(1).join(' - ').trim();
          } else {
            songTitle = oembedData.title.trim();
          }
        }
        if (oembedData.thumbnail_url) {
          coverUrl = oembedData.thumbnail_url;
        }
      }

      try {
        const pageRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (pageRes.ok) {
          const html = await pageRes.text();
          if (!coverUrl) {
            const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (ogImageMatch && ogImageMatch[1]) {
              coverUrl = ogImageMatch[1];
            }
          }
          if (songTitle === 'Hati-Hati di Jalan') {
            const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (ogTitleMatch && ogTitleMatch[1]) {
              songTitle = ogTitleMatch[1].replace(/&amp;/g, '&');
            }
          }
        }
      } catch {}

      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.json({
        success: true,
        trackId,
        songTitle,
        artistName,
        albumName: songTitle,
        coverUrl,
        duration: '3:45',
      });
    } catch {
      return res.status(500).json({ error: 'Failed to fetch Spotify track metadata' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        host: HOST,
        port: PORT,
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
