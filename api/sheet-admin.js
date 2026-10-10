import { timingSafeEqual } from 'node:crypto';
import { createAccessStore, getStagingDb, normalizeEmail, PROJECT_ID, validDate } from '../lib/staging-access-store.js';

export function createHandler({ env = process.env, getStore = () => createAccessStore(getStagingDb(env)) } = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const reply = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') return reply(405, { success: false, reason: 'METHOD_NOT_ALLOWED' });
    if (env.VITE_FIREBASE_PROJECT_ID !== PROJECT_ID || env.ACCESS_BACKEND !== 'firestore') return reply(503, { success: false, reason: 'FIRESTORE_MODE_REQUIRED' });
    const expected = String(env.APPS_SCRIPT_SHARED_SECRET || '').trim();
    const supplied = String(req.headers.authorization || '').replace(/^Bearer /, '');
    const expectedBytes = Buffer.from(expected);
    const suppliedBytes = Buffer.from(supplied);
    if (expected.length < 32 || suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(expectedBytes, suppliedBytes)) return reply(401, { success: false, reason: 'UNAUTHORIZED' });
    let body;
    try {
      const raw = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? String(req.body) : JSON.stringify(req.body);
      if (!raw || Buffer.byteLength(raw) > 65536) throw new Error();
      body = JSON.parse(raw);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    } catch { return reply(400, { success: false, reason: 'INVALID_REQUEST' }); }
    try {
      const store = getStore();
      if (body.action === 'importHistory' && env.FIRESTORE_IMPORT_ENABLED === 'true') {
        const purchase = body.purchase;
        if (!purchase || purchase.productId !== env.LYNK_TEST_PRODUCT_UUID || purchase.source !== 'staging-import') return reply(400, { success: false, reason: 'INVALID_IMPORT' });
        const existing = await store.getAccount(normalizeEmail(purchase.email));
        if (!existing || !purchase.purchasedAt || purchase.purchasedAt > existing.purchasedAt) return reply(409, { success: false, reason: 'IMPORT_ACCOUNT_REQUIRED' });
        const result = await store.ingest({ ref: purchase.ref, email: purchase.email, name: String(purchase.name || '').slice(0, 200),
          purchasedAt: purchase.purchasedAt, productId: purchase.productId, amount: null, currency: 'IDR', quantity: 1,
          productTitle: 'Imported staging purchase', source: 'staging-import' });
        return reply(200, { success: true, ...result });
      }
      if (body.action === 'import' && env.FIRESTORE_IMPORT_ENABLED === 'true') {
        const account = body.account;
        const purchase = body.purchase;
        if (!account || !purchase || account.email !== normalizeEmail(purchase.email) || account.ref !== purchase.ref ||
            purchase.productId !== env.LYNK_TEST_PRODUCT_UUID || purchase.source !== 'staging-import' ||
            !['Active', 'Inactive'].includes(account.statusAccount) || !validDate(account.expirationDate) ||
            !validDate(account.purchaseDate) || !Number.isSafeInteger(account.revision) || account.revision !== 1 ||
            account.uid !== null || Object.keys(account).some(key => !['email', 'ref', 'buyerName', 'purchaseDate', 'expirationDate', 'statusAccount', 'devices', 'revision', 'uid'].includes(key))) {
          return reply(400, { success: false, reason: 'INVALID_IMPORT' });
        }
        const devices = account.devices;
        if (!devices || Object.keys(devices).some(key => !['mobile', 'desktop'].includes(key)) ||
            ['mobile', 'desktop'].some(slot => devices[slot] !== null &&
              (typeof devices[slot]?.id !== 'string' || devices[slot].id.length > 512 || typeof devices[slot]?.label !== 'string' || devices[slot].label.length > 100))) {
          return reply(400, { success: false, reason: 'INVALID_IMPORT' });
        }
        const result = await store.ingest({ ref: purchase.ref, email: purchase.email, name: account.buyerName,
          purchasedAt: purchase.purchasedAt, productId: purchase.productId, amount: null, currency: 'IDR', quantity: 1,
          productTitle: 'Imported staging purchase', source: 'staging-import' }, account);
        return reply(200, { success: true, ...result });
      }
      if (body.action === 'changes' && ['billingAccounts', 'billingPurchases'].includes(body.collection)) {
        const iso = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
        const since = body.since || '1970-01-01T00:00:00.000Z';
        const until = body.until || new Date().toISOString();
        if (!iso(since) || !iso(until) || since > until || (body.cursor &&
            (!iso(body.cursor.at) || body.cursor.at < since || body.cursor.at > until || !/^[a-zA-Z0-9_-]{1,200}$/.test(body.cursor.id)))) {
          return reply(400, { success: false, reason: 'INVALID_CURSOR' });
        }
        return reply(200, { success: true, ...await store.listChanges(body.collection, since, until, body.cursor) });
      }
      if (body.action === 'list' && ['billingAccounts', 'billingPurchases'].includes(body.collection)) {
        if (body.cursor && !/^[a-zA-Z0-9_-]{1,200}$/.test(body.cursor)) return reply(400, { success: false, reason: 'INVALID_CURSOR' });
        return reply(200, { success: true, ...await store.list(body.collection, body.cursor) });
      }
      if (body.action === 'apply') {
        const email = normalizeEmail(body.email);
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { success: false, reason: 'INVALID_EMAIL' });
        const account = await store.administer({ ...body, email, actor: 'staging-spreadsheet-admin' });
        return reply(200, { success: true, account });
      }
      return reply(400, { success: false, reason: 'INVALID_ACTION' });
    } catch (error) {
      const conflicts = ['STALE_ADMIN_REVISION', 'ADMIN_COMMAND_CONFLICT', 'ACCOUNT_ALREADY_EXISTS'];
      const known = ['INVALID_ADMIN_COMMAND', 'INVALID_PURCHASE', 'TRANSACTION_CONFLICT', 'BUYER_NOT_FOUND', ...conflicts];
      return reply(conflicts.includes(error.reason) ? 409 : known.includes(error.reason) ? 400 : 503,
        { success: false, reason: known.includes(error.reason) ? error.reason : 'FIRESTORE_UNAVAILABLE' });
    }
  };
}
export default createHandler();
