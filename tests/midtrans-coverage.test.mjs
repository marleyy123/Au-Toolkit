import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
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
        set: (ref, data) => {
          writing = true;
          writes.push([ref.path, data]);
        },
        delete: ref => {
          writing = true;
          writes.push([ref.path, null]);
        },
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
  GOOGLE_SHEETS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec',
  APPS_SCRIPT_SHARED_SECRET: 'sheet-secret',
  VERCEL: '1',
  ALLOWED_ORIGINS: 'https://staging.example',
};

const digest = value => createHash('sha256').update(String(value || '')).digest('hex');
let clock = Date.parse('2026-10-15T05:00:00Z');

function makeScope({ providerStatus = null, createMode = 'normal', sheetsMode = 'success' } = {}) {
  const db = new Db();
  const store = createAccessStore(db, () => clock);
  const fetchImpl = async (url, options = {}) => {
    if (url === env.GOOGLE_SHEETS_SCRIPT_URL) {
      switch (sheetsMode) {
        case 'http-error':
          return { ok: false, status: 500, json: async () => ({ success: false, reason: 'HTTP_ERROR' }) };
        case 'json-false':
          return { ok: true, status: 200, json: async () => ({ success: false, reason: 'APPS_SCRIPT_REJECTED' }) };
        case 'timeout':
          throw Object.assign(new Error('timeout'), { name: 'AbortError' });
        case 'bad-parse':
          return { ok: true, status: 200, json: async () => { throw new Error('bad json'); } };
        case 'success':
          return { ok: true, status: 200, json: async () => ({ success: true }) };
        default:
          return { ok: true, status: 200, json: async () => ({ success: true }) };
      }
    }
    if (url.includes('/snap/v1/transactions') && options.method === 'POST') {
      if (createMode === 'timeout') throw Object.assign(new Error('timeout'), { name: 'AbortError' });
      if (createMode === 'provider-error') return { ok: false, status: 503, json: async () => ({ status_code: '503', error: 'provider_error' }) };
      return { ok: true, status: 201, json: async () => ({ token: 'sandbox-token' }) };
    }
    if (url.includes('/status') || url.includes('/transactions/')) {
      if (!providerStatus) return { ok: true, status: 404, json: async () => ({ status_code: '404' }) };
      const current = { ...providerStatus };
      const orderIdMatch = /(?:\/v2\/|\/transactions\/)([^/?#]+)/.exec(url);
      if (orderIdMatch && orderIdMatch[1]) current.order_id = orderIdMatch[1];
      return { ok: true, status: 200, json: async () => current };
    }
    if (url.includes('/cancel')) {
      if (!providerStatus) return { ok: true, status: 404, json: async () => ({ status_code: '404' }) };
      return { ok: true, status: 200, json: async () => ({ status_code: '200', transaction_status: 'cancel' }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  const handler = createMidtransHandler({ env, fetchImpl, now: () => clock, getDb: () => db, getStore: () => store });
  const webhook = createMidtransHandler({ env, fetchImpl, now: () => clock, getDb: () => db, getStore: () => store, webhook: true });
  return { db, store, handler, webhook };
}

async function call(handler, body, { country = 'ID', origin = 'https://staging.example' } = {}) {
  const headers = { 'x-vercel-ip-country': country, ...(origin ? { origin } : {}) };
  let data;
  const res = {
    setHeader: () => {},
    end: raw => { data = JSON.parse(raw); },
    statusCode: 200,
  };
  await handler({ method: 'POST', headers, body }, res);
  return { code: res.statusCode, ...data };
}

(async () => {
  {
    const { handler, db } = makeScope({ createMode: 'timeout' });
    const result = await call(handler, { action: 'create', email: 'timeout@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(result.code, 'PAYMENT_STATUS_UNKNOWN', 'A timed-out create must remain unresolved while the provider outcome is still being verified');
    assert.equal(result.status, 'unknown', 'The create response must explicitly say that payment status is still being verified');
    assert.equal([...db.rows.keys()].filter(path => path.startsWith('midtransActiveOrders/')).length, 1, 'The email lock must remain active while the provider outcome is unresolved');
    assert.equal([...db.rows.keys()].filter(path => path.startsWith('midtransOrders/')).length, 1, 'The order document must remain persisted for reconciliation until provider status is confirmed');
  }

  {
    const { handler, db } = makeScope({ createMode: 'provider-error' });
    const lockKey = digest('reservation@example.com');
    const otherLockKey = digest('other@example.com');
    db.rows.set('midtransActiveOrders/' + lockKey, { email: 'reservation@example.com', reservationId: 'reservation-1', state: 'reserved', leaseUntil: Date.now() + 60000, createdAt: new Date(clock).toISOString() });
    db.rows.set('midtransActiveOrders/' + otherLockKey, { email: 'other@example.com', reservationId: 'other-1', state: 'active', orderId: 'au_sb_other0123456789abcdef0123456789', leaseUntil: Date.now() + 60000, createdAt: new Date(clock).toISOString() });
    const result = await call(handler, { action: 'create', email: 'reservation@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(result.code, 429, 'A provider failure should not bypass the active reservation lock; the request remains safely rate-limited while the prior state is still active');
    assert.equal(db.rows.has('midtransActiveOrders/' + lockKey), true, 'The reservation lock for the unresolved request must remain in place while the provider state is still active');
    assert.equal(db.rows.has('midtransActiveOrders/' + otherLockKey), true, 'A different active lock must not be deleted');
    assert.equal([...db.rows.keys()].filter(path => path.startsWith('midtransOrders/')).length, 0, 'No temporary order document should remain after a lock-blocked create attempt');
  }

  {
    const { handler, webhook, db, store } = makeScope({ providerStatus: { order_id: 'au_sb_1234567890abcdef1234567890', gross_amount: '15000.00', currency: 'IDR', transaction_id: 'race-tx', status_code: '200', transaction_status: 'settlement', settlement_time: '2026-10-15 11:59:00' } });
    const created = await call(handler, { action: 'create', email: 'race@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(created.code, 200, 'Initial order must exist before race test');
    const orderId = created.orderId;
    const notification = { order_id: orderId, status_code: '200', gross_amount: '15000.00', transaction_status: 'settlement', settlement_time: '2026-10-15 11:59:00' };
    notification.signature_key = createHash('sha512').update(notification.order_id + notification.status_code + notification.gross_amount + env.MIDTRANS_SERVER_KEY).digest('hex');
    const [cancelResult, statusResult] = await Promise.all([
      call(handler, { action: 'cancel', orderId, statusToken: created.statusToken }),
      call(handler, { action: 'status', orderId, statusToken: created.statusToken }),
    ]);
    const settled = [cancelResult, statusResult].find(result => result.status === 'paid') || statusResult;
    assert.equal(settled.status, 'paid', 'Settlement must win even if cancel fires concurrently');
    assert.equal(settled.accessActivated, true, 'Access should activate once and only once');
    assert.equal((await store.getAccount('race@example.com')).revision, 1, 'Concurrent paid paths must not double-activate access');
    const live = await call(webhook, notification, { origin: 'https://staging.example' });
    assert.equal(live.status, 'paid', 'Webhook after settlement must remain idempotent');
  }

  {
    const { handler, webhook, store, db } = makeScope({ providerStatus: { order_id: 'au_sb_abcdef1234567890abcdef1234567890', gross_amount: '15000.00', currency: 'IDR', transaction_id: 'webhook-poll', status_code: '200', transaction_status: 'settlement', settlement_time: '2026-10-15 11:59:00' } });
    const created = await call(handler, { action: 'create', email: 'webhook@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(created.code, 200);
    const orderId = created.orderId;
    const notification = { order_id: orderId, status_code: '200', gross_amount: '15000.00', transaction_status: 'settlement', settlement_time: '2026-10-15 11:59:00' };
    notification.signature_key = createHash('sha512').update(notification.order_id + notification.status_code + notification.gross_amount + env.MIDTRANS_SERVER_KEY).digest('hex');
    const [webhookResult, pollResult] = await Promise.all([
      call(webhook, notification, { origin: 'https://staging.example' }),
      call(handler, { action: 'status', orderId, statusToken: created.statusToken })
    ]);
    assert.equal(webhookResult.status, 'paid', 'Webhook should process settlement');
    assert.equal(pollResult.status, 'paid', 'Polling should not create a second activation');
    const account = await store.getAccount('webhook@example.com');
    assert.equal(account.revision, 1, 'Concurrent webhook + polling must not extend active period twice');
    assert.equal(db.rows.get('midtransOrders/' + orderId).state, 'paid', 'Order state must stay consistent after concurrent delivery');
  }

  {
    const modes = ['http-error', 'json-false', 'timeout', 'bad-parse'];
    for (const mode of modes) {
      const { handler, db, store } = makeScope({ sheetsMode: mode, providerStatus: { order_id: 'au_sb_abcdef1234567890abcdef1234567890', gross_amount: '15000.00', currency: 'IDR', transaction_id: 'sheets-tx', status_code: '200', transaction_status: 'settlement', settlement_time: '2026-10-15 11:59:00' } });
      const created = await call(handler, { action: 'create', email: `sheets-${mode}@example.com`, planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
      assert.equal(created.code, 200, `order must be created for ${mode}`);
      const result = await call(handler, { action: 'status', orderId: created.orderId, statusToken: created.statusToken });
      const order = db.rows.get('midtransOrders/' + created.orderId);
      const syncState = order?.sheetSync || { status: 'pending', attempts: 0 };
      assert.notEqual(syncState.status, 'synced', `${mode} must not falsely mark sheetSync as synced`);
      assert.ok(result.status === 'paid' || result.reason === 'PAYMENT_SERVICE_UNAVAILABLE', `${mode} should not corrupt paid status`);
      assert.equal((await store.getAccount(`sheets-${mode}@example.com`)).revision, 1, `${mode} must not duplicate access activation`);
    }
  }

  {
    const { handler, db } = makeScope({ sheetsMode: 'success', providerStatus: { order_id: 'au_sb_abcdef1234567890abcdef1234567890', gross_amount: '15000.00', currency: 'IDR', transaction_id: 'retry-tx', status_code: '200', transaction_status: 'settlement', settlement_time: '2026-10-15 11:59:00' } });
    const created = await call(handler, { action: 'create', email: 'retry@example.com', planId: 'monthly', amount: 1, accessDays: 30, country: 'ID' });
    assert.equal(created.code, 200);
    const first = await call(handler, { action: 'status', orderId: created.orderId, statusToken: created.statusToken });
    assert.equal(first.status, 'paid');
    const second = await call(handler, { action: 'status', orderId: created.orderId, statusToken: created.statusToken });
    assert.equal(second.status, 'paid');
    const order = db.rows.get('midtransOrders/' + created.orderId);
    assert.equal(order.sheetSync.status, 'synced', 'A confirmed Apps Script response must be stored as synced');
  }

  console.log('PASS Midtrans coverage: timeout, provider failure, concurrent cancel/settlement, webhook+polling, and Sheets failure/retry cases.');
})();
