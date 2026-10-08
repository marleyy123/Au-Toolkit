import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sourceId = '1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88';
const accessId = '1B0lN8Cfn7-Tev81vSRsGS7OWeAtaWpoGrcmG7A6-FoQ';
const fastSourceId = '1OinUvkN6ih9vKoues14q3Akt1Gdqnc45J_-cPXn2DEQ';
const headers = ['Buyer Email', 'Ref', 'Buyer Name', 'Purchase Date',
  'AU Expiration Date', 'AU Status Account', 'AU Device Handphone',
  'AU Device Laptop', 'Mobile Device ID', 'Laptop Device ID',
  'Transaction Source', 'Jalur Pembelian'];
const access = [headers, [' Login@Gmail.com ', 'order-icha', '', '',
  new Date('2099-01-01'), 'Active', 'iPhone (iOS)', '',
  'dev_mobile_test_12345678', '', sourceId, 'Reguler']];
const orders = [['Ref', 'Buyer Email', 'Status', 'Tanggal'],
  ['order-icha', 'purchase@icloud.com', 'SUCCESS', new Date('2026-10-06')]];
const fastOrders = [['Ref', 'Buyer Email', 'Status', 'Tanggal'],
  ['order-icha', 'fast@example.com', 'REFUNDED', new Date('2026-10-04')]];
const writes = [];
const sheet = {
  getName: () => 'AU Access',
  getLastRow: () => access.length,
  getRange(row, column, rowCount = 1, columnCount = 1) {
    return {
      getValues: () => access.slice(row - 1, row - 1 + rowCount)
        .map(values => values.slice(column - 1, column - 1 + columnCount)),
      getDisplayValue: () => String(access[row - 1][column - 1] || ''),
      setValue(value) {
        writes.push({ row, column, value });
        access[row - 1][column - 1] = value;
        return this;
      },
      setNumberFormat() { return this; },
    };
  },
};
const context = vm.createContext({ Date, console,
  SpreadsheetApp: { openById(id) {
    if (id === accessId) return { getSheetByName: name => name === 'AU Access' ? sheet : null };
    if (id === fastSourceId) return {
      getSheetByName: () => null,
      getSheets: () => [{ getName: () => 'Fast Track ', getDataRange: () => ({ getValues: () => fastOrders }) }],
    };
    assert.equal(id, sourceId);
    return { getSheetByName: () => ({ getDataRange: () => ({ getValues: () => orders }) }) };
  } },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
});
vm.runInContext(await readFile('apps-script/au-toolkit-access.gs', 'utf8'), context);
vm.runInContext(`
  getTodayInTimezone = () => new Date('2026-10-07');
  formatDate = date => date.toISOString().slice(0, 10);
  formatDateTime = formatDate;
`, context);
const payload = { email: 'login@gmail.com', deviceType: 'mobile', deviceId: 'dev_mobile_test_12345678' };
assert.equal(context.checkBuyerEmail(payload).accessGranted, true);
assert.equal(context.validateAccess(payload).deviceStatus, 'MATCHED');
assert.equal(context.checkBuyerEmail({ email: 'purchase@icloud.com' }).reason, 'BUYER_NOT_FOUND');
assert.equal(writes.length, 0);

// A source refresh and unrelated new purchase must not undo the login correction.
orders.splice(1, 0, ['other-order', 'other@example.com', 'SUCCESS', new Date('2026-10-07')]);
assert.equal(context.validateAccess(payload).accessGranted, true);
assert.equal(context.refreshSingleSubscription(payload).accessGranted, true);
assert.equal(access[1][0], ' Login@Gmail.com ');
access[1][5] = 'Inactive';
assert.equal(context.validateAccess(payload).reason, 'ACCOUNT_INACTIVE');
assert.equal(context.checkBuyerEmail(payload).reason, 'ACCOUNT_INACTIVE');
access[1][5] = 'Active';
assert.equal(context.validateAccess({ ...payload, deviceId: 'dev_mobile_other_12345678' }).reason, 'DEVICE_MISMATCH');

orders[2][2] = 'REFUNDED';
assert.equal(context.checkBuyerEmail(payload).reason, 'ORDER_NOT_SUCCESS');
assert.equal(context.validateAccess(payload).reason, 'ORDER_NOT_SUCCESS');
orders[2][2] = 'SUCCESS';
access[1][10] = 'another-source';
assert.equal(context.checkBuyerEmail(payload).reason, 'ORDER_NOT_SUCCESS');
access[1][10] = sourceId;
access[1][1] = 'missing-ref';
assert.equal(context.validateAccess(payload).reason, 'ORDER_NOT_SUCCESS');
access[1][1] = 'order-icha';
access[1][4] = new Date('2026-10-07');
assert.equal(context.validateAccess(payload).reason, 'ACCOUNT_EXPIRED');
writes.length = 0;
access[1][4] = '';
access[1][5] = '';
assert.equal(context.validateAccess(payload).accessGranted, true);
assert.deepEqual(writes.map(write => write.column), [5, 6]);
assert.equal(orders[2][1], 'purchase@icloud.com');
context.updateAllSubscriptions();
assert.equal(access[1][0], ' Login@Gmail.com ');
access[1][10] = fastSourceId;
assert.equal(context.validateAccess(payload).reason, 'ORDER_NOT_SUCCESS', 'Ref must resolve within its own source');
fastOrders[1][2] = 'SUCCESS';
assert.equal(context.checkBuyerEmail(payload).accessGranted, true, 'Fast Track buyer precheck');
assert.equal(context.validateAccess(payload).accessGranted, true, 'Fast Track device validation');
assert.equal(context.refreshSingleSubscription(payload).accessGranted, true, 'Fast Track refresh');
context.updateAllSubscriptions();
assert.equal(access[1][5], 'Active');
access[1][8] = 'dev_mobile_hw_1234abcd_legacy123';
assert.equal(context.validateAccess({ ...payload, deviceId: 'dev_mobile_hw_1234abcd' }).accessGranted, true);
assert.equal(context.validateAccess({ ...payload, deviceId: 'dev_mobile_hw_4321abcd' }).reason, 'DEVICE_MISMATCH');
assert.equal(context.validateAccess({ ...payload, deviceId: 'dev_desktop_hw_1234abcd' }).reason, 'DEVICE_MISMATCH');
console.log('PASS Ref-linked login survives source refresh; payment, expiry, manual status and device locks enforced');
console.log('PASS Fast Track source, trailing sheet space and cross-source Ref isolation');
console.log('PASS legacy hardware suffix accepted only for the same slot and hash');
