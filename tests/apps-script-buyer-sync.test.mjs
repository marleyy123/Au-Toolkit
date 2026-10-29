import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const regularId = '1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88';
const fastId = '1OinUvkN6ih9vKoues14q3Akt1Gdqnc45J_-cPXn2DEQ';
const accessId = '1B0lN8Cfn7-Tev81vSRsGS7OWeAtaWpoGrcmG7A6-FoQ';
const header = ['Buyer Email', 'Ref', 'Buyer Name', 'Purchase Date',
  'AU Expiration Date', 'AU Status Account', 'AU Device Handphone',
  'AU Device Laptop', 'Mobile Device ID', 'Laptop Device ID', 'Transaction Source', 'Jalur Pembelian'];
const preserved = ['corrected@gmail.com', 'existing', '', new Date('2026-10-01'),
  new Date('2099-01-01'), 'Inactive', 'iPhone', '', 'device-locked', '', regularId, 'Reguler'];
const access = [header, [...preserved]];
const orderHeaders = ['Ref', 'Buyer Email', 'Status', 'Tanggal', 'Buyer Name (opsional)'];
const orders = {
  [regularId]: [orderHeaders,
    ['existing', 'original@icloud.com', 'SUCCESS', new Date('2026-10-01'), ''],
    ['new', 'new@gmail.com', 'SUCCESS', new Date('2026-10-08'), 'Buyer'],
    ['pending', 'pending@gmail.com', 'PENDING', new Date('2026-10-08'), ''],
    ['invalid', 'invalid', 'SUCCESS', new Date('2026-10-08'), ''],
    ['old', 'old@gmail.com', 'SUCCESS', new Date('2026-01-01'), '']],
  [fastId]: [orderHeaders,
    ['new', 'fast@gmail.com', 'SUCCESS', new Date('2026-10-08'), '']],
};
let capacity = 2;
let releases = 0;
const triggers = [];
const sheet = {
  getLastRow: () => access.length,
  getMaxRows: () => capacity,
  insertRowsAfter: (_after, count) => { capacity += count; },
  getRange(row, col, count = 1, width = 1) {
    return {
      getValues: () => access.slice(row - 1, row - 1 + count).map(r => r.slice(col - 1, col - 1 + width)),
      setValues(values) { values.forEach((r, i) => { access[row - 1 + i] = [...r]; }); return this; },
      setNumberFormat() { return this; },
    };
  },
};
const context = vm.createContext({ Date, console,
  SpreadsheetApp: {
    openById(id) {
      if (id === accessId) return { getSheetByName: () => sheet };
      assert.ok(orders[id]);
      return { getSheetByName: () => ({ getDataRange: () => ({ getValues: () => orders[id] }) }) };
    },
    flush() {},
  },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() { releases++; } }) },
  ScriptApp: {
    getProjectTriggers: () => triggers.map(name => ({ getHandlerFunction: () => name })),
    newTrigger(name) {
      return { timeBased() { return this; }, everyMinutes(n) { assert.equal(n, 5); return this; }, create() { triggers.push(name); } };
    },
  },
});
vm.runInContext(await readFile('apps-script/au-toolkit-access.gs', 'utf8'), context);
vm.runInContext("getTodayInTimezone = () => new Date('2026-10-08');", context);
assert.equal(context.previewBuyerAccessSync().added, 3);
assert.equal(access.length, 2, 'Preview never writes');
const result = context.syncBuyerAccess();
assert.equal(result.added, 3);
assert.equal(result.skipped, 2);
assert.deepEqual(access[1], preserved, 'Existing corrected email, dates, status and device IDs stay unchanged');
assert.equal(access[2][5], 'Active');
assert.equal(access[2][4].toISOString().slice(0, 10), '2026-11-07');
assert.equal(access[3][5], 'Expired', 'Historical transactions keep their original subscription window');
assert.equal(access[4][11], 'Fast Track');
assert.equal(context.syncBuyerAccess().added, 0, 'Repeated sync cannot duplicate transactions');
assert.equal(capacity, 5);
context.createBuyerAccessSyncTrigger();
context.createBuyerAccessSyncTrigger();
assert.deepEqual(triggers, ['syncBuyerAccess']);
assert.equal(releases, 5);
console.log('PASS append-only sync backfills both sources, preserves overrides, skips unpaid/invalid buyers, and installs one trigger');
