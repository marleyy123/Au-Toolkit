import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createMidtransHandler } from '../lib/midtrans.js';
import { createAccessStore } from '../lib/staging-access-store.js';

class Db {
  rows = new Map();
  queue = Promise.resolve();
  snapshot(path) { return { exists: this.rows.has(path), data: () => this.rows.get(path) }; }
  collection(name) {
    return {
      doc: id => {
        const path = name + '/' + id;
        return {
          path,
          get: async () => this.snapshot(path),
          set: async data => this.rows.set(path, data),
          update: async data => this.rows.set(path, { ...(this.rows.get(path) || {}), ...data }),
          delete: async () => this.rows.delete(path),
        };
      },
    };
  }
  runTransaction(fn) {
    const operation = this.queue.then(async () => {
      const writes = [];
      let writing = false;
      const tx = {
        get: async ref => {
          assert(!writing, 'Reads must precede writes');
          return this.snapshot(ref.path);
        },
        set: (ref, data) => { writing = true; writes.push([ref.path, data]); },
        delete: (ref) => { writing = true; writes.push([ref.path, null]); },
      };
      const result = await fn(tx);
      for (const [path, data] of writes) {
        if (data === null) this.rows.delete(path); else this.rows.set(path, data);
      }
      return result;
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
}

const env = {
  VITE_FIREBASE_PROJECT_ID: 'au-toolkit-staging-20261005',
  ACCESS_BACKEND: 'firestore',
  FIREBASE_ADMIN_SERVICE_ACCOUNT: 'test-only',
  MIDTRANS_IS_PRODUCTION: 'false',
  MIDTRANS_SERVER_KEY: 'SB-Mid-server-test',
  MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test',
  VERCEL: '1',
  ALLOWED_ORIGINS: 'https://staging.example',
};
const digest = value => createHash('sha256').update(String(value || '')).digest('hex');
let clock = Date.parse('2026-10-15T05:00:00Z');

function makeScope({ providerMode = 'timeout_after_received', providerStatus = null } = {}) {
  const db = new Db();
  const store = createAccessStore(db, () => clock);
  const fetchImpl = async (url, options = {}) => {
    if (url.includes('/snap/v1/transactions') && options.method === 'POST') {
      if (providerMode === 'timeout_before_received') {
        throw Object.assign(new Error('timeout'), { name: 'AbortError' });
      }
      if (providerMode === 'timeout_after_received') {
        throw Object.assign(new Error('timeout'), { name: 'AbortError' });
      }
      if (providerMode === 'provider_failure') {
        return { ok: false, status: 503, json: async () => ({ status_code: '503' }) };
      }
      return { ok: true, status: 201, json: async () => ({ token: 'snap-token-' + randomBytes(4).toString('hex') }) };
    }
    if (url.includes('/status') || url.includes('/transactions/')) {
      if (!providerStatus) return { ok: true, status: 404, json: async () => ({ status_code: '404' }) };
      return { ok: true, status: 200, json: async () => providerStatus };
    }
    if (url.includes('/cancel')) {
      return { ok: true, status: 200, json: async () => ({ status_code: '200', transaction_status: 'cancel' }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  const handler = createMidtransHandler({ env, fetchImpl, now: () => clock, getDb: () => db, getStore: () => store });
  const webhook = createMidtransHandler({ env, fetchImpl, now: () => clock, getDb: () => db, getStore: () => store, webhook: true });
  return { db, store, handler, webhook };
}

async function call(handler, body, { country = 'ID' } = {}) {
  const headers = { 'x-vercel-ip-country': country, origin: 'https://staging.example' };
  let data;
  const res = { setHeader: () => {}, end: raw => { data = JSON.parse(raw); }, statusCode: 200 };
  await handler({ method: 'POST', headers, body }, res);
  return { code: res.statusCode, ...data };
}

(async () => {
  {
    const scope = makeScope({ providerMode: 'timeout_after_received' });
    const result = await call(scope.handler, { action: 'create', email: 'timeout-after@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(result.code, 'PAYMENT_STATUS_UNKNOWN', 'Timeout after provider receives request must be treated as an unresolved payment status for reconciliation');
    assert.equal(result.status, 'unknown', 'The create response must explicitly say the payment status is still being verified');
    assert.equal(result.success, true, 'The unresolved path must remain non-fatal and safe for the frontend to surface');
    const lockKey = 'midtransActiveOrders/' + digest('timeout-after@example.com');
    assert.ok(scope.db.rows.has(lockKey), 'Lock must remain until provider status is confirmed');
  }

  {
    const scope = makeScope({ providerMode: 'timeout_before_received' });
    const result = await call(scope.handler, { action: 'create', email: 'timeout-before@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.notEqual(result.code, 503, 'Timeout before provider receives request must not be treated as confirmed failure without reconciliation');
    const lockKey = 'midtransActiveOrders/' + digest('timeout-before@example.com');
    assert.ok(scope.db.rows.has(lockKey), 'Reservation lock must remain active while status is unresolved');
  }

  {
    const scope = makeScope({ providerMode: 'timeout_after_received' });
    const first = await call(scope.handler, { action: 'create', email: 'retry-unresolved@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    const second = await call(scope.handler, { action: 'create', email: 'retry-unresolved@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(first.code, 'PAYMENT_STATUS_UNKNOWN', 'Initial create must stay unresolved instead of creating a duplicate order');
    assert.equal(first.status, 'unknown', 'The create response must explicitly report that provider status is still being verified');
    assert.equal(second.code, 'PAYMENT_STATUS_UNKNOWN', 'A retry while the original create is unresolved must return the unresolved contract instead of creating a second transaction');
    assert.equal(second.status, 'unknown', 'The retry must report the same unresolved status while the original order remains under reconciliation');
    assert.ok(scope.db.rows.has('midtransActiveOrders/' + digest('retry-unresolved@example.com')), 'The unresolved lock must remain active even when the retry is blocked');
  }

  {
    const scope = makeScope({ providerMode: 'timeout_after_received', providerStatus: { order_id: 'au_sb_abcdef0123456789abcdef0123456789', gross_amount: '15000.00', currency: 'IDR', transaction_id: 'reconcile-tx', status_code: '200', transaction_status: 'settlement', settlement_time: '2026-10-15 11:59:00' } });
    const created = await call(scope.handler, { action: 'create', email: 'reconcile-found@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(created.code, 'PAYMENT_STATUS_UNKNOWN', 'A timed-out create must remain unresolved before reconciliation is confirmed');
    assert.equal(created.status, 'unknown', 'The order must remain in an unknown state while the provider outcome is still being verified');
    const orderId = created.orderId;
    assert.ok(scope.db.rows.has('midtransOrders/' + orderId), 'The unresolved order must remain persisted for reconciliation');
    const webhookResult = await call(scope.webhook, { order_id: orderId, status_code: '200', gross_amount: '15000.00', transaction_status: 'settlement', settlement_time: '2026-10-15 11:59:00', signature_key: createHash('sha512').update(orderId + '200' + '15000.00' + env.MIDTRANS_SERVER_KEY).digest('hex') }, { country: 'ID' });
    assert.equal(webhookResult.status, 'paid', 'Settlement after multipart timeout must reconcile and activate access once');
  }

  {
    const scope = makeScope({ providerMode: 'timeout_after_received', providerStatus: null });
    const created = await call(scope.handler, { action: 'create', email: 'reconcile-missing@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(created.code, 'PAYMENT_STATUS_UNKNOWN', 'A timed-out create must remain unresolved while the provider outcome is still unknown');
    assert.equal(created.status, 'unknown', 'The status field must explicitly say the transaction is still being verified');
    const orderId = created.orderId;
    const lockKey = 'midtransActiveOrders/' + digest('reconcile-missing@example.com');
    assert.ok(scope.db.rows.has(lockKey), 'Unknown order should keep the email locked during reconciliation');
    assert.ok(scope.db.rows.has('midtransOrders/' + orderId), 'Order document should remain until provider status is confirmed');
  }

  console.log('FAIL expected: timeout recovery tests are intentionally red before implementation because the current code deletes lock and order during timeout.');
})();
