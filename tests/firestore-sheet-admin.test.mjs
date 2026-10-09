import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const accessId = '1ez3-ilO4rAXXWaXRBn2Dsl6IN6zXW5wb8JACIQbByTs';
const regularId = '16NKN_XpFDeSR396xMHMC77rLlWZ7ZJ1SfPzp5TncK6k';
class Sheet {
  constructor(name, id, rows) { this.name = name; this.id = id; this.rows = rows; }
  getName() { return this.name; }
  getParent() { return { getId: () => this.id }; }
  getLastRow() { return this.rows.length; }
  getActiveRange() { return { getRow: () => 2 }; }
  getRange(row, column, height = 1, width = 1) {
    const getValues = () => Array.from({ length: height }, (_, r) => Array.from({ length: width }, (_, c) => this.rows[row + r - 1]?.[column + c - 1] ?? ''));
    return { getValues, getDisplayValues: () => getValues().map(row => row.map(String)), setValues: values => {
      values.forEach((values, r) => {
        while (this.rows.length < row + r) this.rows.push([]);
        values.forEach((value, c) => { this.rows[row + r - 1][column + c - 1] = value; });
      });
    } };
  }
}
const headers = ['Buyer Email', 'Ref', 'Buyer Name', 'Purchase Date', 'AU Expiration Date', 'AU Status Account',
  'AU Device Handphone', 'AU Device Laptop', 'Mobile Device ID', 'Laptop Device ID', 'Transaction Source', 'Jalur Pembelian'];
const access = new Sheet('AU Access', accessId, [headers]);
const regularHeaders = Array(26).fill('Reserved');
for (const [index, label] of [[14, 'Tanggal'], [15, 'Status'], [16, 'Buyer Email'], [17, 'Buyer Name'], [25, 'Ref']]) regularHeaders[index] = label;
const regular = new Sheet('AU Toolkit PRO', regularId, [regularHeaders]);
let boundId = accessId;
const secret = 'test-only-secret-'.repeat(4);
const calls = [];
let commandSequence = 0;
let serverAccount;
const account = { email: 'tester@example.com', ref: 'ref-1', buyerName: '=FORMULA()',
  purchaseDate: '2026-10-10', expirationDate: '2026-11-09', statusAccount: 'Active',
  devices: { mobile: null, desktop: { id: 'dev_desktop_hw_12345678', label: 'Windows Laptop' } }, revision: 3 };
const purchase = { email: account.email, name: account.buyerName, ref: account.ref, purchasedAt: '2026-10-10T01:00:00.000Z' };
const properties = { API_SHARED_SECRET: secret, LYNK_TEST_PRODUCT_UUID: 'product-test' };
const context = vm.createContext({ Date,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getId: () => boundId, toast() {} }), getActiveSheet: () => access,
    openById: id => { assert([accessId, regularId].includes(id), 'No production or Fast Track dependency');
      return { getSheetByName: name => [access, regular].find(sheet => sheet.id === id && sheet.name === name) }; }, flush() {} },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] }) },
  Utilities: { getUuid: () => `command-${++commandSequence}`, formatDate: (date, _, pattern) => {
    const shifted = new Date(date.getTime() + 7 * 3600000).toISOString();
    return pattern === 'yyyy-MM-dd' ? shifted.slice(0, 10) : shifted.slice(0, 19) + '+07:00';
  } },
  UrlFetchApp: { fetch: (url, options) => {
    assert.equal(url, 'https://au-toolkit-testing.vercel.app/api/sheet-admin');
    assert.equal(options.headers.Authorization, 'Bearer ' + secret);
    const body = JSON.parse(options.payload); calls.push(body);
    let result;
    if (body.action === 'list') result = { success: true, rows: [body.collection === 'billingPurchases' ? purchase : serverAccount], cursor: null };
    else if (body.action === 'import') result = { success: true, account: { ...body.account, revision: 1 } };
    else if (body.action === 'importHistory') result = { success: true, duplicate: true };
    else {
      if (body.expectedRevision !== serverAccount.revision) return { getResponseCode: () => 409, getContentText: () => JSON.stringify({ success: false, reason: 'STALE_ADMIN_REVISION' }) };
      serverAccount = { ...serverAccount, statusAccount: body.statusAccount, expirationDate: body.expirationDate, revision: serverAccount.revision + 1,
        devices: { ...serverAccount.devices, ...(body.resetDevice === 'desktop' ? { desktop: null } : {}) } };
      result = { success: true, account: serverAccount };
    }
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify(result) };
  } },
  ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: value => ({ setMimeType() { return this; }, getContent: () => value }) },
});
vm.runInContext(await readFile('apps-script/au-toolkit-firestore-admin-staging.gs', 'utf8'), context);
const post = body => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(body) } }).getContent());
const body = { action: 'mirrorFirestorePurchase', serverSecret: secret, account, purchase };
assert.equal(post({ ...body, serverSecret: 'wrong' }).reason, 'UNAUTHORIZED');
assert.equal(post({ ...body, action: 'validateAccess' }).reason, 'FIRESTORE_REPORT_ONLY');
assert.equal(post(body).status, 'REPORT_SYNCED');
assert.equal(regular.rows.length, 2);
assert.equal(regular.rows[1][16], account.email);
assert.equal(regular.rows[1][17], "'=FORMULA()");
assert.equal(access.rows[0][12], 'Firestore Revision');
assert.equal(access.rows[1][12], 3);
assert.equal(access.rows[1][2], "'=FORMULA()");
assert.equal(post(body).success, true);
assert.equal(regular.rows.length, 2, 'Replay never adds another order row');
assert.equal(post({ ...body, account: { ...account, revision: 2, expirationDate: '2026-11-01' } }).success, true);
assert.equal(access.rows[1][4], '2026-11-09', 'Out of order report never rolls back revision');
serverAccount = structuredClone(account);
access.rows[1][5] = 'Inactive';
access.rows[1][4] = '2026-12-01';
context.applySelectedFirestoreAccount();
assert.equal(serverAccount.statusAccount, 'Inactive');
assert.equal(serverAccount.expirationDate, '2026-12-01');
assert.equal(access.rows[1][12], 4);
context.resetSelectedFirestoreLaptop();
assert.equal(serverAccount.devices.desktop, null);
assert.equal(access.rows[1][9], '');
access.rows[1][12] = 3;
assert.throws(() => context.applySelectedFirestoreAccount(), /STALE_ADMIN_REVISION/);
context.refreshFirestoreReports();
assert.equal(access.rows[1][12], 5);
assert(calls.some(body => body.action === 'list' && body.collection === 'billingAccounts'));
context.importExistingStagingBuyers();
const imported = calls.find(body => body.action === 'import');
assert.equal(imported.purchase.purchasedAt, '2026-10-10T01:00:00.000Z');
assert.equal(imported.account.expirationDate, '2026-12-01');
boundId = 'production';
assert.throws(() => context.refreshFirestoreReports(), /STAGING_BOUND_SHEET_REQUIRED/);
console.log('PASS spreadsheet admin: two-sheet isolation, report deduplication, formula protection, revision ordering, status/expiry/reset, stale edits, refresh and migration.');
