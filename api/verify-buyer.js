import { createRemoteJWKSet, jwtVerify } from 'jose';
import { handler as verifyBuyer } from '../netlify/functions/verify-buyer.mjs';
import { accessView, createAccessStore, getStagingDb, normalizeEmail } from '../lib/staging-access-store.js';

const PROJECT_ID = 'au-toolkit-staging-20261005';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4xs8YHS0r0jSXpqD8z0eg6jN25gTtziNOg18ILcy0bdBGR_NNIS_Vub4obYop__vd/exec';
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
export const tokenOptions = {
  issuer: `https://securetoken.google.com/${PROJECT_ID}`,
  audience: PROJECT_ID,
  algorithms: ['RS256'],
};

function fail(res, status, reason) {
  res.statusCode = status;
  res.end(JSON.stringify({ success: false, accessGranted: false, reason, status: reason }));
}

// This adapter is staging-only; the production Netlify handler stays unchanged.
export function createHandler({ verifyToken = (token) => jwtVerify(token, keys, tokenOptions), delegate = verifyBuyer, fetchImpl = fetch,
  getStore = () => createAccessStore(getStagingDb()), now = () => Date.now() } = {}) {
  return async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const origin = String(req.headers.origin || '').replace(/\/$/, '');
    const allowed = String(process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim().replace(/\/$/, '')).filter(Boolean);
    if (origin && !allowed.includes(origin)) return fail(res, 403, 'CORS_ORIGIN_BLOCKED');
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.statusCode = 204;
      return res.end();
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      return fail(res, 405, 'METHOD_NOT_ALLOWED');
    }
    let body;
    try {
      body = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? JSON.parse(String(req.body)) : req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
    } catch {
      return fail(res, 400, 'INVALID_REQUEST');
    }
    const action = String(body.action || 'validateAccess').trim();
    if (!['validateAccess', 'checkBuyerEmail', 'healthCheck'].includes(action)) return fail(res, 400, 'INVALID_ACTION');
    const backend = process.env.ACCESS_BACKEND || 'sheets';
    if (!['sheets', 'firestore'].includes(backend)) return fail(res, 500, 'INVALID_ACCESS_BACKEND');
    if (process.env.VITE_FIREBASE_PROJECT_ID !== PROJECT_ID || (backend === 'sheets' && process.env.GOOGLE_SHEETS_SCRIPT_URL?.trim() !== SCRIPT_URL)) {
      return fail(res, 500, 'STAGING_CONFIG_ERROR');
    }
    if (backend === 'sheets' && String(process.env.APPS_SCRIPT_SHARED_SECRET || '').trim().length < 32) return fail(res, 500, 'APPS_SCRIPT_CONFIG_ERROR');
    let identity;
    if (action === 'validateAccess') {
      const authorization = String(req.headers.authorization || '');
      if (!authorization.startsWith('Bearer ')) return fail(res, 401, 'AUTH_REQUIRED');
      let payload;
      try {
        ({ payload } = await verifyToken(authorization.slice(7).trim()));
        if (!payload.sub || !payload.email || (backend === 'firestore' && payload.email_verified !== true)) throw new Error('Missing identity');
        identity = { uid: payload.sub };
      } catch {
        return fail(res, 401, 'INVALID_AUTH_TOKEN');
      }
      const email = String(payload.email).trim().toLowerCase();
      const requestedEmail = String(body.email || body.buyer_email || body.user_email || email).trim().toLowerCase();
      if (email !== requestedEmail) return fail(res, 403, 'EMAIL_MISMATCH');
      body = { ...body, email };
    }
    try {
      if (backend === 'firestore' && action === 'healthCheck') {
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, environment: 'staging', backend, status: 'HEALTH_CHECK', databaseChecked: false }));
      }
      if (backend === 'firestore') {
        const store = getStore();
        let result;
        if (action === 'healthCheck') {
          result = { success: true, environment: 'staging', backend, status: 'HEALTH_CHECK' };
        } else {
          const email = normalizeEmail(body.email);
          if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'EMAIL_REQUIRED');
          if (action === 'checkBuyerEmail') {
            const view = accessView(await store.getAccount(email), now());
            result = { success: true, reason: view.reason, status: view.status, isRegisteredBuyer: view.isRegisteredBuyer,
              isValid: view.isValid, statusAccount: view.statusAccount || null };
          } else {
            result = await store.validate(email, identity);
          }
        }
        res.statusCode = 200;
        return res.end(JSON.stringify({ ...result, backend }));
      }
      if (action === 'healthCheck') {
        const response = await fetchImpl(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, serverSecret: process.env.APPS_SCRIPT_SHARED_SECRET.trim() }),
          signal: AbortSignal.timeout(25000),
          redirect: 'follow',
        });
        const upstream = await response.json();
        if (!response.ok || upstream.success !== true) return fail(res, 502, 'APPS_SCRIPT_HEALTH_FAILED');
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, environment: 'staging', status: 'HEALTH_CHECK', upstreamVersion: upstream.version || null }));
      }
      const result = await delegate({ httpMethod: req.method, headers: req.headers, body: JSON.stringify({ ...body, action }) });
      res.statusCode = result.statusCode;
      for (const [key, value] of Object.entries(result.headers || {})) res.setHeader(key, value);
      return res.end(result.body);
    } catch {
      return fail(res, 503, backend === 'firestore' ? 'FIRESTORE_UNAVAILABLE' : 'APPS_SCRIPT_UNAVAILABLE');
    }
  };
}

export default createHandler();
