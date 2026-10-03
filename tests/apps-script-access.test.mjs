import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile('apps-script/au-toolkit-access.gs', 'utf8');
const headers = ['Buyer Email', 'Ref', 'Buyer Name', 'Purchase Date',
  'AU Expiration Date', 'AU Status Account', 'AU Device Handphone',
  'AU Device Laptop', 'Mobile Device ID', 'Laptop Device ID'];

function transaction(ref = 'ref-001', email = 'buyer@example.com') {
  const row = Array(32).fill('');
  row[14] = new Date('2026-10-01T00:00:00Z');
  row[15] = 'SUCCESS';
  row[16] = email;
  row[17] = 'Buyer';
  row[25] = ref;
  return row;
}

function fixture(transactions = [transaction()], saved = [], sourceTimezone = 'UTC', accessTimezone = 'UTC', fastTransactions = []) {
  let locked = false;
  const writes = [];
  function sheet(name, rows, readOnly) {
    return {
      rows,
      getName: () => name,
      getSheetId: () => name === 'Fast Track' ? 437086551 : 0,
      getParent: () => ({getSpreadsheetTimeZone: () => readOnly ? sourceTimezone : accessTimezone}),
      getLastRow: () => rows.length,
      getLastColumn: () => Math.max(0, ...rows.map(row => row.length)),
      getRange(r, c, height = 1, width = 1) {
        const values = () => Array.from({length: height}, (_, y) =>
          Array.from({length: width}, (_, x) => rows[r - 1 + y]?.[c - 1 + x] ?? ''));
        function write(data) {
          assert.equal(readOnly, false, 'Lynk sheet must never be written');
          assert.equal(locked, true, 'All writes must hold script lock');
          writes.push({r, c, data});
          data.forEach((row, y) => {
            rows[r - 1 + y] ??= [];
            row.forEach((value, x) => {
              rows[r - 1 + y][c - 1 + x] = typeof value === 'string' && value.startsWith("'=")
                ? value.slice(1) : value;
            });
          });
        }
        return {
          getValues: values,
          getDisplayValues: () => values().map(row => row.map(String)),
          getDisplayValue: () => String(values()[0][0]),
          getValue: () => values()[0][0],
          setValue(value) { write([[value]]); return this; },
          setValues(data) { write(data); return this; },
          setNumberFormat() {
            assert.equal(readOnly, false);
            assert.equal(locked, true);
            return this;
          },
        };
      },
    };
  }
  const transactionHeaders = Array(26).fill('');
  transactionHeaders[14] = 'Tanggal';
  transactionHeaders[15] = 'Status';
  transactionHeaders[16] = 'Buyer Email';
  transactionHeaders[25] = 'Ref';
  const lynk = sheet('AU Toolkit PRO', [transactionHeaders.slice(), ...transactions], true);
  const fast = sheet('Fast Track', [transactionHeaders.slice(), ...fastTransactions], true);
  const access = sheet('AU Access', saved.length ? [headers.slice(), ...saved] : [], false);
  const context = vm.createContext({
    Date, console,
    Utilities: {formatDate(date, timezone, pattern) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(date).map(part => [part.type, part.value]));
      if (pattern === 'yyyy-MM-dd') return `${parts.year}-${parts.month}-${parts.day}`;
      const day = `${parts.day}-${parts.month}-${parts.year}`;
      return pattern.includes('HH:mm') ? `${day} ${parts.hour}:${parts.minute}` : day;
    }},
    SpreadsheetApp: {
      openById(id) {
        const selected = {
          '1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88': lynk,
          '1B0lN8Cfn7-Tev81vSRsGS7OWeAtaWpoGrcmG7A6-FoQ': access,
          '1OinUvkN6ih9vKoues14q3Akt1Gdqnc45J_-cPXn2DEQ': fast,
        }[id];
        if (!selected) throw new Error('Unknown mock spreadsheet ID');
        return {
          getSheetByName: name => name === selected.getName() ? selected : null,
          getSheets: () => [selected],
        };
      },
      flush() { assert.equal(locked, true); },
    },
    LockService: {getScriptLock: () => ({
      waitLock() { assert.equal(locked, false, 'No nested lock acquisition'); locked = true; },
      releaseLock() { locked = false; },
    })},
    ContentService: {
      MimeType: {JSON: 'json'},
      createTextOutput: text => ({setMimeType: () => JSON.parse(text)}),
    },
  });
  vm.runInContext(source, context);
  vm.runInContext(`
    getTodayInTimezone = () => new Date('2026-10-04T00:00:00Z');
    formatDate = date => date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    formatDateTime = formatDate;
  `, context);
  return {context, lynk, fast, access, writes, isLocked: () => locked};
}

const payload = {email: 'buyer@example.com', deviceType: 'desktop', deviceId: 'dev_desktop_test', deviceLabel: 'Windows Laptop'};
const login = f => f.context.validateAccess(payload);

// Bootstrap surviving custom cells, and then survive Lynk rewrites/reordering.
{
  const raw = transaction();
  raw[26] = new Date('2099-01-01T00:00:00Z');
  raw[27] = 'Active';
  raw[29] = 'Windows Laptop';
  raw[31] = payload.deviceId;
  const f = fixture([raw]);
  assert.equal(f.context.checkBuyerEmail(payload).accessGranted, true);
  assert.equal(f.writes.length, 0, 'Email check is read-only even on empty access sheet');
  assert.equal(login(f).deviceStatus, 'MATCHED');
  assert.equal(f.access.rows.length, 2);
  f.lynk.rows.splice(1, 1, transaction('other-ref', 'other@example.com'), raw.slice(0, 26));
  assert.equal(login(f).expirationDate, '2099-01-01');
  assert.equal(f.access.rows.length, 2, 'Repeated Ref cannot create another access record');
  assert.equal(f.context.validateAccess({...payload, deviceId: 'dev_other'}).reason, 'DEVICE_MISMATCH');
  f.access.rows[1][4] = new Date('2099-02-01T00:00:00Z');
  assert.equal(login(f).expirationDate, '2099-02-01', 'Manual expiry remains authoritative');
  for (const status of ['Inactive', ' INACTIVE ', 'Expired']) {
    f.access.rows[1][5] = status;
    const count = f.writes.length;
    for (const method of ['checkBuyerEmail', 'validateAccess', 'refreshSingleSubscription']) {
      assert.equal(f.context[method](payload).reason, status.trim().toLowerCase() === 'inactive' ? 'ACCOUNT_INACTIVE' : 'ACCOUNT_EXPIRED');
    }
    assert.equal(f.writes.length, count, 'Denial must not overwrite status or register a device');
  }
  assert.equal(f.isLocked(), false);
}

// Fresh purchase initializes once, desktop/mobile slots stay separate.
{
  const f = fixture([transaction().slice(0, 26)]);
  assert.equal(login(f).expirationDate, '2026-10-31');
  assert.equal(login(f).deviceStatus, 'MATCHED');
  assert.equal(f.context.validateAccess({...payload, deviceType: 'mobile', deviceId: 'dev_mobile'}).deviceStatus, 'REGISTERED');
  f.context.updateAllSubscriptions();
  assert.equal(f.access.rows.length, 2);
  assert.equal(f.access.rows[1][9], payload.deviceId);
  f.access.rows[1][4] = new Date('2026-10-02T00:00:00Z');
  assert.equal(login(f).reason, 'ACCOUNT_EXPIRED');
  assert.equal(f.access.rows[1][5], 'Expired');
}

// No permission fallback to Lynk writes, wrong schemas, or mismatched transaction identity.
{
  const f = fixture();
  const open = f.context.SpreadsheetApp.openById;
  f.context.SpreadsheetApp.openById = id => {
    if (id.includes('1B0l')) throw new Error('Access permission denied');
    return open(id);
  };
  assert.throws(() => login(f), /Access permission denied/);
  assert.equal(f.isLocked(), false);
  assert.equal(f.writes.length, 0);
  assert.equal(f.context.doGet().success, false);
}
{
  const saved = ['different@example.com', 'ref-001', 'Buyer', new Date('2026-10-01'), '', '', '', '', '', ''];
  const f = fixture([transaction()], [saved]);
  assert.throws(() => login(f), /email transaksi tidak sesuai/);
  assert.equal(f.writes.length, 0);
  f.access.rows[0][4] = 'Wrong header';
  assert.throws(() => login(f), /Header AU Access/);
}
{
  const f = fixture([transaction('')]);
  assert.throws(() => login(f), /tidak memiliki Buyer Email atau Ref/);
  assert.equal(f.writes.length, 0);
}
{
  const raw = transaction();
  raw[15] = 'PENDING';
  const f = fixture([raw]);
  assert.equal(login(f).reason, 'ORDER_NOT_SUCCESS');
  assert.equal(f.writes.length, 0);
  assert.equal(f.context.validateAccess({...payload, email: 'unknown@example.com'}).reason, 'BUYER_NOT_FOUND');
}
{
  const raw = transaction();
  raw[26] = 'invalid date';
  const f = fixture([raw]);
  assert.equal(login(f).reason, 'INVALID_PURCHASE_DATA');
  assert.equal(f.context.checkBuyerEmail(payload).reason, 'INVALID_PURCHASE_DATA');
}
{
  const raw = transaction();
  raw[14] = 'invalid purchase date';
  const f = fixture([raw]);
  assert.equal(login(f).reason, 'INVALID_PURCHASE_DATA');
  assert.equal(f.writes.length, 0);
}
{
  const raw = transaction();
  raw[26] = new Date('2099-01-01');
  raw[27] = ' INACTIVE ';
  raw[31] = 'dev_original';
  const f = fixture([raw]);
  assert.equal(login(f).reason, 'ACCOUNT_INACTIVE');
  assert.equal(f.access.rows[1][9], 'dev_original');
  f.lynk.rows[1] = raw.slice(0, 26);
  assert.equal(login(f).reason, 'ACCOUNT_INACTIVE');
}
{
  const raw = transaction();
  raw[17] = '=IMPORTXML("https://example.com", "//body")';
  const f = fixture([raw]);
  assert.equal(login(f).accessGranted, true);
  const inserted = f.writes.find(write => write.r === 2 && write.c === 1);
  assert.equal(inserted.data[0][2], "'" + raw[17], 'Buyer text must not become a formula');
  assert.equal(f.context.doGet().accessSheetName, 'AU Access');
}
{
  const saved = ['buyer@example.com', 'ref-001', 'Buyer', new Date('2026-10-01'), '', '', '', '', '', ''];
  const f = fixture([transaction()], [saved.slice(), saved.slice()]);
  assert.throws(() => login(f), /Ref duplikat/);
  assert.equal(f.writes.length, 0);
}

// Latest SUCCESS semantics remain unchanged (not automatic stacked renewal).
{
  const older = transaction('old');
  const newer = transaction('new');
  newer[14] = new Date('2026-10-03T00:00:00Z');
  const f = fixture([newer, older]);
  assert.equal(login(f).expirationDate, '2026-11-02');
  assert.equal(f.access.rows[1][1], 'new');
  f.context.migrateLegacyAccessData();
  assert.equal(f.access.rows.length, 3);
  const snapshot = JSON.stringify(f.access.rows);
  f.context.migrateLegacyAccessData();
  assert.equal(JSON.stringify(f.access.rows), snapshot);
  assert.equal(login(f).deviceStatus, 'MATCHED');
}

// Pacific wall dates are authoritative, despite a Bangkok destination timezone.
{
  const raw = transaction();
  raw[14] = new Date('2026-10-03T06:30:00Z'); // Oct 2, 23:30 Pacific.
  raw[26] = new Date('2026-11-03T06:30:00Z'); // Nov 2 Pacific; Nov 3 Bangkok.
  raw[27] = 'Active';
  const saved = ['buyer@example.com', 'ref-001', 'Buyer', raw[14], raw[26], 'Active', '', '', '', payload.deviceId];
  const f = fixture([raw], [saved], 'America/Los_Angeles', 'Asia/Bangkok');
  const before = f.writes.length;
  const plan = f.context.previewLegacyDateAlignment();
  assert.equal(f.writes.length, before, 'Preview must not write');
  const expiry = plan.changes.find(change => change.column === 5);
  assert.equal(expiry.from, '03-11-2026');
  assert.equal(expiry.to, '02-11-2026');
  f.context.alignLegacyDatesToSource();
  assert.equal(f.access.rows[1][4], '02-11-2026');
  assert.equal(f.access.rows[1][3], '02-10-2026 23:30');
  assert.equal(f.access.rows[1][9], payload.deviceId);
  assert.equal(f.context.previewLegacyDateAlignment().changes.length, 0, 'Date repair is idempotent');
  const fresh = fixture([raw], [], 'America/Los_Angeles', 'Asia/Bangkok');
  login(fresh);
  assert.equal(fresh.access.rows[1][4], '02-11-2026', 'New imports preserve source wall date');
}
{
  const raw = transaction();
  raw[26] = new Date('2026-11-03T06:30:00Z');
  const saved = ['buyer@example.com', 'ref-001', 'Buyer', raw[14], new Date('2099-01-01'), 'Inactive', '', '', '', 'dev_existing'];
  const f = fixture([raw], [saved], 'America/Los_Angeles', 'Asia/Bangkok');
  const plan = f.context.previewLegacyDateAlignment();
  assert.ok(plan.skipped.some(change => change.column === 5));
  f.context.alignLegacyDatesToSource();
  assert.equal(f.access.rows[1][4].getTime(), saved[4].getTime(), 'Do not overwrite a manual extension');
  assert.equal(f.access.rows[1][5], 'Inactive');
}
console.log('PASS separate access storage: Lynk read-only, Ref deduplication, rewrite/reorder survival');
console.log('PASS manual expiry/status, expired denial, independent device locks, read-only email check');
console.log('PASS missing permissions/schema/Ref, failed orders, invalid dates, migration idempotency');
console.log('PASS Pacific-to-Bangkok date preservation, read-only repair preview, manual-edit protection');

// Fast Track shares the login and storage contract; it is not a privileged bypass.
{
  const fast = transaction('fce8040b1d82fa551ced8e1adc526ff1', 'marliarindaaa@gmail.com');
  fast[14] = '04-10-2026 1:58';
  const f = fixture([], [], 'UTC', 'UTC', [fast]);
  const request = {...payload, email: 'marliarindaaa@gmail.com'};
  assert.equal(f.context.checkBuyerEmail(request).accessGranted, true);
  assert.equal(f.writes.length, 0);
  assert.equal(f.context.validateAccess(request).expirationDate, '2026-11-03');
  assert.equal(f.access.rows[1][10], '1OinUvkN6ih9vKoues14q3Akt1Gdqnc45J_-cPXn2DEQ');
  assert.equal(f.access.rows[1][11], 'Fast Track');
  assert.equal(f.context.validateAccess(request).deviceStatus, 'MATCHED');
  assert.equal(f.context.validateAccess({...request, deviceId: 'different_device'}).reason, 'DEVICE_MISMATCH');
  assert.equal(f.context.doGet().fastTrackSheetName, 'Fast Track');
}
{
  const regular = transaction('same-ref');
  regular[26] = new Date('2099-01-01');
  const fast = transaction('same-ref');
  fast[14] = new Date('2026-10-03');
  const f = fixture([regular], [], 'UTC', 'UTC', [fast]);
  f.context.migrateLegacyAccessData();
  assert.equal(f.access.rows.length, 3, 'Same Ref in two sources is two transactions');
  assert.notEqual(f.access.rows[1][10], f.access.rows[2][10]);
  assert.equal(login(f).expirationDate, '2026-11-02', 'Latest SUCCESS across sources determines purchase');
  assert.equal(f.context.previewLegacyDateAlignment().skipped.length, 0, 'Repair matches source + Ref');
  const snapshot = JSON.stringify(f.access.rows);
  f.context.migrateLegacyAccessData();
  assert.equal(JSON.stringify(f.access.rows), snapshot);
}
{
  const regular = transaction('regular-ref');
  const fast = transaction('fast-ref');
  fast[14] = new Date('2026-10-03');
  const saved = ['buyer@example.com', 'regular-ref', 'Buyer', regular[14], '01-11-2026', 'Active', '', 'Windows Laptop', '', payload.deviceId];
  const f = fixture([regular], [saved], 'UTC', 'UTC', [fast]);
  assert.equal(f.context.validateAccess({...payload, deviceId: 'new_computer'}).reason, 'DEVICE_MISMATCH');
  assert.equal(login(f).deviceStatus, 'MATCHED');
  assert.equal(f.access.rows[2][9], payload.deviceId, 'Fast Track must preserve existing device registration');
  f.access.rows[1][5] = 'Inactive';
  assert.equal(login(f).reason, 'ACCOUNT_INACTIVE', 'Other source cannot bypass account block');
}
{
  const fast = transaction('pending-fast');
  fast[14] = new Date('2026-10-03');
  fast[15] = 'PENDING';
  const f = fixture([transaction()], [], 'UTC', 'UTC', [fast]);
  assert.equal(login(f).expirationDate, '2026-10-31', 'Pending Fast Track cannot override successful regular purchase');
  const open = f.context.SpreadsheetApp.openById;
  f.context.SpreadsheetApp.openById = id => {
    if (id.startsWith('1Oin')) throw new Error('Fast Track permission denied');
    return open(id);
  };
  assert.throws(() => login(f), /Fast Track permission denied/);
  assert.equal(f.context.doGet().success, false);
  assert.equal(f.isLocked(), false);
}
{
  const f = fixture([transaction()], [['buyer@example.com', 'ref-001', 'Buyer', new Date('2026-10-01'), '01-11-2026', 'Active', '', 'Windows Laptop', '', payload.deviceId]]);
  const saved = f.access.rows[1].slice();
  assert.equal(login(f).deviceStatus, 'MATCHED');
  assert.deepEqual(f.access.rows[1].slice(0, 10), saved, 'Legacy A:J values must be preserved on source backfill');
  assert.equal(f.access.rows[0][10], 'Transaction Source');
  assert.equal(f.access.rows[1][10], '1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88');
  assert.equal(f.access.rows[1][11], 'Reguler');
}
{
  const row = ['buyer@example.com', 'regular-ref', 'Buyer', '01-10-2026', '01-11-2026', 'Inactive', 'Android', 'Windows', 'dev_phone', 'dev_pc'];
  const fast = [...row, '1OinUvkN6ih9vKoues14q3Akt1Gdqnc45J_-cPXn2DEQ'];
  const unknown = [...row, 'unrecognized-source'];
  const f = fixture([], [row.slice(), fast.slice(), unknown.slice()]);
  const original = f.access.rows.slice(1).map(item => item.slice(0, 11));
  const result = f.context.updateTransactionSourceLabels();
  assert.equal(result.updated, 2);
  assert.equal(result.skipped, 1);
  assert.equal(f.access.rows[0][11], 'Jalur Pembelian');
  assert.equal(f.access.rows[1][11], 'Reguler');
  assert.equal(f.access.rows[2][11], 'Fast Track');
  assert.deepEqual(f.access.rows.slice(1).map((item, i) => item.slice(0, original[i].length)), original, 'Label backfill must not change A:K');
  const writes = f.writes.length;
  const again = f.context.updateTransactionSourceLabels();
  assert.equal(again.updated, 0);
  assert.equal(again.unchanged, 2);
  assert.equal(f.writes.length, writes, 'Repeated label backfill is idempotent');
  f.access.rows[0][11] = 'Unexpected Header';
  assert.throws(() => f.context.updateTransactionSourceLabels(), /Header AU Access/);
}
console.log('PASS Fast Track buyer, source-scoped Ref collisions, latest SUCCESS, legacy compatibility');
console.log('PASS cross-source block/device preservation, pending orders, unavailable source denial');
console.log('PASS readable source labels: new/legacy rows, metadata-only backfill, unknown sources, idempotency');
{
  const f = fixture([], [], 'UTC', 'UTC', [transaction('fast-ref')]);
  f.fast.getName = () => 'Fast Track PRO - Akses web 1 Bulan';
  assert.equal(login(f).accessGranted, true, 'Renamed Fast Track tab resolves through gid');
  assert.equal(f.context.doGet().fastTrackSheetName, f.fast.getName());
  f.fast.getSheetId = () => 987;
  f.fast.getName = () => ' FAST TRACK ';
  assert.equal(login(f).accessGranted, true, 'Trimmed/case-insensitive name fallback');
  f.fast.getName = () => 'Unrelated tab';
  assert.throws(() => login(f), /Tab Fast Track tidak ditemukan.*Unrelated tab/);
  f.fast.getSheetId = () => 437086551;
  f.fast.rows[0][16] = 'Not Buyer Email';
  assert.throws(() => login(f), /Header tab Fast Track tidak sesuai/);
  assert.equal(f.isLocked(), false);
}
console.log('PASS renamed Fast Track gid lookup, name fallback, missing tab diagnostics, schema validation');
