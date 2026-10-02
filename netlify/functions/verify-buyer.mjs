const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...headers },
    body: JSON.stringify(body),
  };
}

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function corsHeaders(origin) {
  if (!origin) return { 'Access-Control-Allow-Origin': '*' };
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function decodeFirebaseUser(authorization) {
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    const token = authorization.slice('Bearer '.length).trim();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload?.user_id && !payload?.sub) return null;
    return {
      uid: payload.user_id || payload.sub,
      email: String(payload.email || '').trim().toLowerCase(),
    };
  } catch {
    return null;
  }
}

function resolveAppsScriptUrl() {
  let value = String(process.env.GOOGLE_SHEETS_SCRIPT_URL || '').trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1).trim();
  }
  if (!value.startsWith('https://script.google.com/macros/s/') || !value.endsWith('/exec')) {
    return null;
  }
  return value;
}

function resolveAppsScriptSecret() {
  let value = String(process.env.APPS_SCRIPT_SHARED_SECRET || '').trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1).trim();
  }
  return value.length >= 32 ? value : null;
}

function extractStableDeviceSignature(rawId) {
  if (!rawId) return '';
  let id = String(rawId).trim().toLowerCase();
  if (id.includes('||')) id = id.split('||')[0].trim();
  const match = id.match(/hw_([a-f0-9]{6,16})/);
  if (!match) return id;
  return `dev_${id.includes('mobile') || id.includes('handphone') ? 'mobile' : 'desktop'}_hw_${match[1]}`;
}

function extractHardwareHash(rawId) {
  const match = String(rawId || '').toLowerCase().match(/hw_([a-f0-9]{6,16})/);
  return match ? match[1] : '';
}

function isSameDeviceId(currentDeviceId, registeredId) {
  if (!registeredId || !currentDeviceId) return false;
  const current = String(currentDeviceId).trim().toLowerCase();
  let registered = String(registeredId).trim().toLowerCase();
  if (registered.includes('||')) {
    const [first, second = ''] = registered.split('||').map((part) => part.trim());
    registered = first.startsWith('dev_') || first.includes('hw_') ? first : second;
  }
  if (current === registered) return true;
  const stableCurrent = extractStableDeviceSignature(current);
  const stableRegistered = extractStableDeviceSignature(registered);
  if (stableCurrent && stableRegistered && stableCurrent === stableRegistered) return true;
  const currentHash = extractHardwareHash(current);
  const registeredHash = extractHardwareHash(registered);
  if (currentHash && registeredHash && currentHash === registeredHash) return true;
  return registered.length >= 12 && current.length >= 12 && (current.includes(registered) || registered.includes(current));
}

function normalizeExpirationDate(raw) {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const ymd = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  const dmy = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

function normalizeDaysRemaining(raw, expirationDate) {
  if (expirationDate) {
    const [year, month, day] = expirationDate.split('-').map(Number);
    if (year && month && day) {
      const now = new Date();
      return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    }
  }
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const value = Number(raw);
    if (!Number.isNaN(value)) return Math.round(value);
  }
  return null;
}

function commonAccessData(upstream, email, deviceType, deviceLabel, expirationDate) {
  return {
    email,
    buyerName: upstream.buyerName || email.split('@')[0],
    purchaseDate: normalizeExpirationDate(upstream.purchaseDate),
    expirationDate,
    daysRemaining: normalizeDaysRemaining(upstream.daysRemaining, expirationDate),
    registeredDevice: upstream.registeredDevice || null,
    deviceHandphone: upstream.deviceHandphone || null,
    deviceLaptop: upstream.deviceLaptop || null,
    mobileDeviceId: upstream.mobileDeviceId || null,
    laptopDeviceId: upstream.laptopDeviceId || null,
    deviceType: upstream.deviceType || deviceType,
    deviceModel: deviceLabel,
  };
}

export async function handler(event) {
  const origin = String(event.headers?.origin || event.headers?.Origin || '').replace(/\/$/, '');
  const allowedOrigins = getAllowedOrigins();
  const cors = corsHeaders(origin);

  if (origin && !allowedOrigins.includes(origin)) {
    return json(403, {
      success: false,
      accessGranted: false,
      reason: 'CORS_ORIGIN_BLOCKED',
      status: 'CORS_ORIGIN_BLOCKED',
      message: 'Origin tidak diizinkan.',
    });
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        ...cors,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, {
      success: false,
      accessGranted: false,
      reason: 'METHOD_NOT_ALLOWED',
      status: 'METHOD_NOT_ALLOWED',
      message: 'Method tidak diizinkan.',
    }, { ...cors, Allow: 'POST, OPTIONS' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, {
      success: false,
      accessGranted: false,
      reason: 'INVALID_REQUEST',
      status: 'INVALID_REQUEST',
      message: 'Request JSON tidak valid.',
    }, cors);
  }

  const firebaseUser = decodeFirebaseUser(event.headers?.authorization || event.headers?.Authorization);
  const email = String(body.email || body.buyer_email || body.user_email || firebaseUser?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, {
      success: false,
      accessGranted: false,
      reason: 'EMAIL_REQUIRED',
      status: 'EMAIL_REQUIRED',
      message: 'Format email pembelian tidak valid.',
    }, cors);
  }

  const deviceId = String(body.device_id || body.deviceId || '').trim();
  if (!deviceId || ['mobile_device', 'desktop_device', 'temp_device_node'].includes(deviceId)) {
    return json(400, {
      success: false,
      accessGranted: false,
      reason: 'DEVICE_ID_REQUIRED',
      status: 'DEVICE_ID_REQUIRED',
      message: 'Identitas perangkat (device ID) valid diperlukan.',
    }, cors);
  }

  const scriptUrl = resolveAppsScriptUrl();
  if (!scriptUrl) {
    return json(500, {
      success: false,
      accessGranted: false,
      reason: 'APPS_SCRIPT_CONFIG_ERROR',
      status: 'APPS_SCRIPT_CONFIG_ERROR',
      message: 'Konfigurasi server spreadsheet akses belum disetel dengan benar.',
    }, cors);
  }

  const sharedSecret = resolveAppsScriptSecret();
  if (!sharedSecret) {
    return json(500, {
      success: false,
      accessGranted: false,
      reason: 'APPS_SCRIPT_CONFIG_ERROR',
      status: 'APPS_SCRIPT_CONFIG_ERROR',
      message: 'Credential server verifikasi belum disetel dengan benar.',
    }, cors);
  }

  const deviceType = String(body.deviceType || body.device_type || body.deviceSlot || '').toLowerCase() === 'mobile' ? 'mobile' : 'desktop';
  const deviceLabel = String(body.deviceLabel || body.device_label || body.deviceModel || '').trim() || (deviceType === 'mobile' ? 'Mobile Device' : 'Desktop Device');
  const stableDeviceId = extractStableDeviceSignature(deviceId) || deviceId;
  const payload = {
    action: String(body.action || '') === 'registerDevice' ? 'registerDevice' : 'validateAccess',
    email,
    deviceType,
    deviceId: stableDeviceId,
    deviceLabel,
    serverSecret: sharedSecret,
  };

  let upstreamResponse;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      upstreamResponse = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return json(503, {
      success: false,
      accessGranted: false,
      reason: 'APPS_SCRIPT_UNAVAILABLE',
      status: 'APPS_SCRIPT_UNAVAILABLE',
      message: 'Server verifikasi spreadsheet sedang tidak dapat dijangkau. Silakan coba lagi.',
    }, cors);
  }

  const raw = await upstreamResponse.text();
  let upstream;
  try {
    if (raw.trim().startsWith('<')) throw new Error('HTML response');
    upstream = JSON.parse(raw);
    if (!upstream || typeof upstream !== 'object') throw new Error('Invalid JSON object');
  } catch {
    return json(502, {
      success: false,
      accessGranted: false,
      reason: 'INVALID_API_RESPONSE',
      status: 'INVALID_API_RESPONSE',
      message: 'Format respon dari server akses tidak valid.',
    }, cors);
  }

  const reason = String(upstream.reason || upstream.status || '').trim();
  if (reason === 'UNAUTHORIZED') {
    return json(401, {
      success: false,
      accessGranted: false,
      reason: 'UNAUTHORIZED',
      status: 'UNAUTHORIZED',
      message: 'Credential server verifikasi ditolak.',
    }, cors);
  }

  if (reason === 'APPS_SCRIPT_CONFIG_ERROR') {
    return json(502, {
      success: false,
      accessGranted: false,
      reason: 'APPS_SCRIPT_CONFIG_ERROR',
      status: 'APPS_SCRIPT_CONFIG_ERROR',
      isRegisteredBuyer: false,
      isValid: false,
      email,
      message: upstream.message || 'Konfigurasi Apps Script belum lengkap.',
    }, cors);
  }

  if (reason === 'BACKEND_ERROR') {
    return json(502, {
      success: false,
      accessGranted: false,
      reason: 'BACKEND_ERROR',
      status: 'BACKEND_ERROR',
      isRegisteredBuyer: false,
      isValid: false,
      email,
      upstreamMessage: upstream.message || null,
      message: upstream.message || 'Server spreadsheet mengembalikan error internal.',
    }, cors);
  }

  if (reason === 'INVALID_REQUEST' || reason === 'INVALID_JSON_REQUEST' || reason === 'INVALID_DEVICE_TYPE' || reason === 'DEVICE_ID_REQUIRED' || reason === 'EMAIL_REQUIRED') {
    return json(400, {
      success: false,
      accessGranted: false,
      reason,
      status: reason,
      isRegisteredBuyer: false,
      isValid: false,
      email,
      message: upstream.message || 'Request verifikasi tidak valid.',
    }, cors);
  }

  if (reason === 'BUYER_NOT_FOUND' || upstream.isRegisteredBuyer === false) {
    return json(200, { success: true, accessGranted: false, reason: 'BUYER_NOT_FOUND', status: 'BUYER_NOT_FOUND', isRegisteredBuyer: false, isValid: false, email, buyerName: upstream.buyerName || email.split('@')[0], message: 'Email ini tidak ditemukan dalam data pembelian.' }, cors);
  }
  if (reason === 'ORDER_NOT_SUCCESS') {
    return json(200, { success: true, accessGranted: false, reason, status: reason, isRegisteredBuyer: true, isValid: false, email, orderStatus: upstream.orderStatus || 'NOT_SUCCESS', buyerName: upstream.buyerName || email.split('@')[0], message: upstream.message || 'Status pesanan Lynk.id belum berstatus SUCCESS.' }, cors);
  }
  if (reason === 'INVALID_PURCHASE_DATA') {
    return json(200, { success: true, accessGranted: false, reason, status: reason, isRegisteredBuyer: true, isValid: false, email, buyerName: upstream.buyerName || email.split('@')[0], message: upstream.message || 'Data tanggal pembelian tidak valid atau kosong di sheet order.' }, cors);
  }

  const expirationDate = normalizeExpirationDate(upstream.expirationDate);
  if (reason === 'ACCOUNT_EXPIRED' || String(upstream.statusAccount || '').trim().toLowerCase() === 'expired') {
    return json(200, { success: true, accessGranted: false, reason: 'ACCOUNT_EXPIRED', status: 'ACCOUNT_EXPIRED', statusAccount: 'Expired', isRegisteredBuyer: true, isValid: false, ...commonAccessData(upstream, email, deviceType, deviceLabel, expirationDate), daysRemaining: 0, message: 'Masa berlangganan Anda telah habis.' }, cors);
  }

  if (reason === 'DEVICE_MISMATCH' || (upstream.accessGranted === false && upstream.reason === 'DEVICE_MISMATCH')) {
    const registeredId = deviceType === 'mobile' ? (upstream.mobileDeviceId || upstream.registeredDevice) : (upstream.laptopDeviceId || upstream.registeredDevice);
    if (registeredId && isSameDeviceId(deviceId, registeredId)) {
      return json(200, { success: true, accessGranted: true, reason: 'ACCESS_GRANTED', status: 'ACCESS_GRANTED', statusAccount: 'Active', isRegisteredBuyer: true, isValid: true, ...commonAccessData(upstream, email, deviceType, deviceLabel, expirationDate), registeredDevice: upstream.registeredDevice || deviceLabel, message: 'Akses aktif.' }, cors);
    }
    return json(200, { success: true, accessGranted: false, reason: 'DEVICE_MISMATCH', status: 'DEVICE_MISMATCH', statusAccount: upstream.statusAccount || 'Active', isRegisteredBuyer: true, isValid: false, ...commonAccessData(upstream, email, deviceType, deviceLabel, expirationDate), message: 'Perangkat ini tidak terdaftar.' }, cors);
  }

  if (reason === 'ACCESS_GRANTED' || upstream.accessGranted === true) {
    return json(200, { success: true, accessGranted: true, reason: 'ACCESS_GRANTED', status: 'ACCESS_GRANTED', statusAccount: 'Active', isRegisteredBuyer: true, isValid: true, ...commonAccessData(upstream, email, deviceType, deviceLabel, expirationDate), registeredDevice: upstream.registeredDevice || deviceId, message: upstream.message || 'Akses aktif.' }, cors);
  }

  return json(500, {
    success: false,
    accessGranted: false,
    reason: 'BACKEND_ERROR',
    status: 'BACKEND_ERROR',
    isRegisteredBuyer: false,
    isValid: false,
    email,
    message: 'Koneksi ke server sedang bermasalah. Silakan coba lagi.',
  }, cors);
}
