import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const row = Array(13).fill('');
row[3] = new Date('2026-09-12T00:00:00Z');
row[12] = 'SUCCESS';
row[0] = 'buyer@example.com';
row[4] = new Date('2099-01-01T00:00:00Z');
row[5] = 'Inactive';
const writes = [];
const sheet = {
  getLastRow: () => 2,
  getRange: (_row, column) => ({
    setValue(value) { writes.push({column, value}); return this; },
    setNumberFormat() { return this; },
  }),
};
const context = vm.createContext({ Date, console, row, sheet });
vm.runInContext(await readFile('apps-script/au-toolkit-access.gs', 'utf8'), context);
vm.runInContext(`
  getMainSheet = () => sheet;
  findLatestSuccessfulBuyer = () => ({emailFound: true, buyer: {rowNumber: 2, row}});
  getTodayInTimezone = () => new Date('2026-10-03T00:00:00Z');
  formatDate = date => date.toISOString().slice(0, 10);
  formatDateTime = formatDate;
  validateAndRegisterDevice = () => { throw new Error('Denied users must not register a device'); };
`, context);
for (const status of ['Inactive', ' INACTIVE ']) {
  row[5] = status;
  writes.length = 0;
  for (const [method, payload] of [
    ['checkBuyerEmail', {email: 'buyer@example.com'}],
    ['validateAccess', {email: 'buyer@example.com', deviceType: 'desktop', deviceId: 'dev_desktop_test_12345678'}],
    ['refreshSingleSubscription', {email: 'buyer@example.com'}],
  ]) {
    const result = context[method](payload);
    assert.equal(result.reason, 'ACCOUNT_INACTIVE', method);
    assert.equal(result.accessGranted, false);
    assert.equal(result.statusAccount, 'Inactive');
  }
  assert.equal(writes.length, 0, 'Manual deactivation must not be overwritten');
}
row[5] = 'Active';
assert.equal(context.checkBuyerEmail({email: 'buyer@example.com'}).accessGranted, true);
row[5] = 'Expired';
assert.equal(context.validateAccess({email: 'buyer@example.com', deviceType: 'desktop', deviceId: 'dev_desktop_test_12345678'}).reason, 'ACCOUNT_EXPIRED');
console.log('PASS Apps Script preserves Inactive and denies access before device registration');
console.log('PASS active email and expired access');
