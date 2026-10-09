import { createHash, timingSafeEqual } from 'node:crypto';
import { createAccessStore, getStagingDb } from '../lib/staging-access-store.js';

const PROJECT_ID = 'au-toolkit-staging-20261005';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4xs8YHS0r0jSXpqD8z0eg6jN25gTtziNOg18ILcy0bdBGR_NNIS_Vub4obYop__vd/exec';
const MAX_BYTES = 65536;
const text = (value, max = 200) => typeof value === 'string' && value.length <= max ? value.trim() : '';

function reply(res, status, reason, extra = {}) {
  res.statusCode = status;
  res.end(JSON.stringify({ success: status === 200, reason, ...extra }));
}

// Lynk signs grandTotal + refId + message_id + merchantKey (SHA-256, not HMAC).
export function signatureDiagnostic(payload, signature, key) {
  const data = payload?.data;
  const transaction = data?.message_data;
  const amount = transaction?.totals?.grandTotal;
  const ref = text(transaction?.refId);
  const messageId = text(data?.message_id);
  if (!signature) return 'MISSING_SIGNATURE';
  if (!/^[a-f0-9]{64}$/i.test(signature)) return 'INVALID_SIGNATURE_FORMAT';
  if (!ref || !messageId) return 'MISSING_SIGNED_FIELDS';
  if (!Number.isSafeInteger(amount) || amount < 0) return 'INVALID_SIGNED_AMOUNT';
  const expected = createHash('sha256').update(String(amount) + ref + messageId + key).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex')) ? 'VALID' : 'SIGNATURE_MISMATCH';
}

export function validSignature(payload, signature, key) {
  return signatureDiagnostic(payload, signature, key) === 'VALID';
}

export function purchaseDate(value) {
  // Lynk's sample has no offset. Interpret only that form as Asia/Jakarta,
  // never in the Vercel machine's local timezone.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return null;
  const datePart = value.slice(0, 10);
  const calendar = new Date(datePart + 'T00:00:00Z');
  if (Number.isNaN(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== datePart) return null;
  if (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) return null;
  const date = new Date(value + (/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? '' : '+07:00'));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function createHandler({ env = process.env, fetchImpl = fetch, log = console.info, now = () => Date.now(), getStore = () => createAccessStore(getStagingDb(env), now) } = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return reply(res, 405, 'METHOD_NOT_ALLOWED');
    }
    if (env.VITE_FIREBASE_PROJECT_ID !== PROJECT_ID) return reply(res, 503, 'STAGING_CONFIG_REQUIRED');
    const mode = env.LYNK_WEBHOOK_MODE || 'inspect';
    if (!['inspect', 'activate'].includes(mode)) return reply(res, 503, 'INVALID_WEBHOOK_MODE');
    const backend = env.ACCESS_BACKEND || 'sheets';
    if (!['sheets', 'firestore'].includes(backend)) return reply(res, 503, 'INVALID_ACCESS_BACKEND');
    const key = text(env.LYNK_MERCHANT_KEY, 1024);
    if (req.method === 'GET') return reply(res, 200, 'WEBHOOK_HEALTH', { environment: 'staging', mode, backend, signatureConfigured: Boolean(key) });
    if (!key) return reply(res, 503, 'MERCHANT_KEY_REQUIRED');
    let payload;
    try {
      const raw = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? String(req.body) : JSON.stringify(req.body);
      if (!raw || Buffer.byteLength(raw) > MAX_BYTES) return reply(res, 413, 'PAYLOAD_TOO_LARGE');
      payload = JSON.parse(raw);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error();
    } catch { return reply(res, 400, 'INVALID_JSON'); }
    const signature = text(req.headers['x-lynk-signature'], 64);
    const diagnostic = signatureDiagnostic(payload, signature, key);
    if (diagnostic !== 'VALID') {
      // Record only a classification, never signature, secret, or payload values.
      log('lynk-staging-rejected', { diagnostic });
      return reply(res, 401, 'INVALID_SIGNATURE', mode === 'inspect' ? { diagnostic } : {});
    }
    const data = payload.data;
    if (payload.event !== 'payment.received' || data.message_action !== 'SUCCESS' || String(data.message_code) !== '0') return reply(res, 200, 'IGNORED_EVENT');
    const transaction = data.message_data;
    if (!Array.isArray(transaction.items) || !transaction.items.length || transaction.items.length > 50 ||
        transaction.items.some(item => !item || typeof item !== 'object' || Array.isArray(item))) return reply(res, 400, 'INVALID_ITEMS');
    if (mode === 'inspect') {
      // Do not log payloads, customer email/phone, signature or merchant key.
      log('lynk-staging-inspect', { event: payload.event, products: transaction.items.map(item => ({ uuid: text(item.uuid), title: text(item.title) })) });
      return reply(res, 200, 'INSPECTED_NO_ACCESS_GRANTED');
    }
    const productId = text(env.LYNK_TEST_PRODUCT_UUID);
    const secret = text(env.APPS_SCRIPT_SHARED_SECRET, 1024);
    if (!productId || secret.length < 32 || env.GOOGLE_SHEETS_SCRIPT_URL?.trim() !== SCRIPT_URL) return reply(res, 503, 'ACTIVATION_CONFIG_REQUIRED');
    const items = transaction.items.filter(item => item.uuid === productId);
    if (!items.length) return reply(res, 200, 'IGNORED_PRODUCT');
    if (items.length !== 1 || items[0].qty !== 1) return reply(res, 422, 'UNSUPPORTED_QUANTITY');
    const email = text(transaction.customer?.email, 254).toLowerCase();
    const purchasedAt = purchaseDate(transaction.createdAt);
    if (!/^[a-zA-Z0-9_-]{1,200}$/.test(transaction.refId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !purchasedAt || new Date(purchasedAt).getTime() > now() + 300000) return reply(res, 422, 'INVALID_PURCHASE');
    let accessStored = false;
    try {
      if (backend === 'firestore') {
        const store = getStore();
        const result = await store.ingest({ ref: transaction.refId, email, name: text(transaction.customer?.name),
          purchasedAt, productId, productTitle: text(items[0].title), quantity: 1,
          amount: transaction.totals.grandTotal, currency: 'IDR', source: 'lynk' });
        accessStored = true;
        // A failed report does not undo paid access. Lynk retries are deduplicated
        // in Firestore and repair the spreadsheet mirror on the next delivery.
        const response = await fetchImpl(SCRIPT_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, redirect: 'follow', signal: AbortSignal.timeout(25000),
          body: JSON.stringify({ action: 'mirrorFirestorePurchase', serverSecret: secret, purchase: result.purchase, account: result.account }),
        });
        const report = await response.json();
        if (!response.ok || report.success !== true) {
          log('lynk-staging-report-pending', { reason: 'SHEET_REPORT_FAILED' });
          return reply(res, 503, 'SHEET_REPORT_PENDING', { accessStored: true });
        }
        await store.markReported(transaction.refId);
        return reply(res, 200, 'PURCHASE_SYNCED', { backend, duplicate: result.duplicate });
      }
      const response = await fetchImpl(SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, redirect: 'follow', signal: AbortSignal.timeout(25000),
        body: JSON.stringify({ action: 'ingestLynkPurchase', serverSecret: secret, transaction: {
          ref: transaction.refId, email, name: text(transaction.customer?.name), purchasedAt, productId,
        } }),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true || result.status !== 'PURCHASE_SYNCED') return reply(res, 502, 'PURCHASE_SYNC_FAILED');
      return reply(res, 200, 'PURCHASE_SYNCED', { duplicate: result.duplicate === true });
    } catch {
      if (accessStored) {
        log('lynk-staging-report-pending', { reason: 'SHEET_REPORT_UNAVAILABLE' });
        return reply(res, 503, 'SHEET_REPORT_PENDING', { accessStored: true });
      }
      return reply(res, 503, 'PURCHASE_SYNC_UNAVAILABLE');
    }
  };
}

export default createHandler();
