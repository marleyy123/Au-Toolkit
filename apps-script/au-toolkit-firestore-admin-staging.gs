// Replace the old staging script with this complete file when enabling Firestore.
// No Fast Track dependency; only the two established testing spreadsheets are used.
const FIRESTORE_STAGING = {
  accessId: '1ez3-ilO4rAXXWaXRBn2Dsl6IN6zXW5wb8JACIQbByTs',
  regularId: '16NKN_XpFDeSR396xMHMC77rLlWZ7ZJ1SfPzp5TncK6k',
  accessTab: 'AU Access', regularTab: 'AU Toolkit PRO',
  api: 'https://au-toolkit-testing.vercel.app/api/sheet-admin',
  timezone: 'Asia/Jakarta'
};
const FIRESTORE_ACCESS_HEADERS = [
  'Buyer Email', 'Ref', 'Buyer Name', 'Purchase Date', 'AU Expiration Date',
  'AU Status Account', 'AU Device Handphone', 'AU Device Laptop', 'Mobile Device ID',
  'Laptop Device ID', 'Transaction Source', 'Jalur Pembelian', 'Firestore Revision', 'Synced At'
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('AU Admin')
    .addItem('Refresh from Firebase', 'refreshFirestoreReports')
    .addItem('Apply status and expiry (selected row)', 'applySelectedFirestoreAccount')
    .addItem('Reset phone (selected row)', 'resetSelectedFirestorePhone')
    .addItem('Reset laptop (selected row)', 'resetSelectedFirestoreLaptop')
    .addItem('Reset both devices (selected row)', 'resetSelectedFirestoreDevices')
    .addSeparator()
    .addItem('Import existing staging buyers', 'importExistingStagingBuyers')
    .addItem('Install report refresh trigger', 'installFirestoreReportTrigger')
    .addToUi();
}
function firestoreSheets_() {
  const bound = SpreadsheetApp.getActiveSpreadsheet();
  if (bound && bound.getId() !== FIRESTORE_STAGING.accessId) throw new Error('STAGING_BOUND_SHEET_REQUIRED');
  const access = SpreadsheetApp.openById(FIRESTORE_STAGING.accessId).getSheetByName(FIRESTORE_STAGING.accessTab);
  const regular = SpreadsheetApp.openById(FIRESTORE_STAGING.regularId).getSheetByName(FIRESTORE_STAGING.regularTab);
  if (!access || !regular) throw new Error('STAGING_TABS_REQUIRED');
  const actual = access.getRange(1, 1, 1, 12).getDisplayValues()[0];
  if (actual.some(function(value, i) { return value !== FIRESTORE_ACCESS_HEADERS[i]; })) throw new Error('ACCESS_HEADERS_MISMATCH');
  const extra = access.getRange(1, 13, 1, 2).getDisplayValues()[0];
  if (extra.some(function(value, i) { return value && value !== FIRESTORE_ACCESS_HEADERS[i + 12]; })) throw new Error('ADMIN_HEADERS_MISMATCH');
  access.getRange(1, 13, 1, 2).setValues([FIRESTORE_ACCESS_HEADERS.slice(12)]);
  const headers = regular.getRange(1, 1, 1, 26).getDisplayValues()[0];
  if (headers[14] !== 'Tanggal' || headers[15] !== 'Status' || headers[16] !== 'Buyer Email' || headers[25] !== 'Ref') throw new Error('REGULAR_HEADERS_MISMATCH');
  return { access: access, regular: regular };
}
function firestoreLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return callback(); }
  finally { try { SpreadsheetApp.flush(); } finally { lock.releaseLock(); } }
}
function firestoreJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  return firestoreJson_({ success: true, environment: 'staging', backend: 'firestore', version: '4.0.0-staging-report' });
}
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('API_SHARED_SECRET');
    if (!secret || secret.length < 32 || body.serverSecret !== secret) return firestoreJson_({ success: false, reason: 'UNAUTHORIZED' });
    if (body.action !== 'mirrorFirestorePurchase') return firestoreJson_({ success: false, reason: 'FIRESTORE_REPORT_ONLY' });
    if (!body.purchase || !body.account || body.purchase.email !== body.account.email) return firestoreJson_({ success: false, reason: 'INVALID_REPORT' });
    firestoreLock_(function() {
      const sheets = firestoreSheets_();
      mirrorFirestorePurchase_(sheets.regular, body.purchase);
      mirrorFirestoreAccount_(sheets.access, body.account);
    });
    return firestoreJson_({ success: true, status: 'REPORT_SYNCED' });
  } catch (error) {
    return firestoreJson_({ success: false, reason: 'REPORT_FAILED' });
  }
}
function sheetText_(value) {
  const text = String(value || '');
  return /^[=+@-]/.test(text) ? "'" + text : text;
}
function sheetDate_(value, withTime) {
  if (value instanceof Date) return Utilities.formatDate(value, FIRESTORE_STAGING.timezone, withTime ? "yyyy-MM-dd'T'HH:mm:ssXXX" : 'yyyy-MM-dd');
  const text = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return withTime ? text : text.slice(0, 10);
  const match = text.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!match) throw new Error('INVALID_DATE');
  const date = match[3] + '-' + match[2] + '-' + match[1];
  return withTime ? date + 'T' + (match[4] || '00') + ':' + (match[5] || '00') + ':00+07:00' : date;
}
function mirrorFirestorePurchase_(sheet, purchase) {
  const count = Math.max(0, sheet.getLastRow() - 1);
  const refs = count ? sheet.getRange(2, 26, count, 1).getDisplayValues() : [];
  const matches = refs.filter(function(row) { return row[0] === purchase.ref; });
  if (matches.length > 1) throw new Error('DUPLICATE_REF');
  if (matches.length) return;
  const row = Array(26).fill('');
  row[14] = new Date(purchase.purchasedAt);
  row[15] = 'SUCCESS'; row[16] = sheetText_(purchase.email); row[17] = sheetText_(purchase.name);
  row[25] = sheetText_(purchase.ref);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, 26).setValues([row]);
}
function mirrorFirestoreAccount_(sheet, account) {
  const count = Math.max(0, sheet.getLastRow() - 1);
  const rows = count ? sheet.getRange(2, 1, count, 14).getValues() : [];
  const index = rows.findIndex(function(row) { return String(row[0]).trim().toLowerCase() === account.email && String(row[1]) === account.ref; });
  const candidates = rows.map(function(row, i) { return { row: row, index: i }; }).filter(function(item) {
    return String(item.row[0]).trim().toLowerCase() === account.email;
  });
  // Preserve historical rows, and always use the highest revision for current data.
  if (candidates.some(function(item) { return Number(item.row[12]) > account.revision; })) return;
  const target = index >= 0 ? index + 2 : candidates.length ? candidates[0].index + 2 : sheet.getLastRow() + 1;
  const today = Utilities.formatDate(new Date(), FIRESTORE_STAGING.timezone, 'yyyy-MM-dd');
  const status = account.statusAccount === 'Inactive' ? 'Inactive' : account.expirationDate <= today ? 'Expired' : 'Active';
  const row = [account.email, account.ref, account.buyerName, account.purchaseDate, account.expirationDate, status,
    account.devices.mobile && account.devices.mobile.label, account.devices.desktop && account.devices.desktop.label,
    account.devices.mobile && account.devices.mobile.id, account.devices.desktop && account.devices.desktop.id,
    FIRESTORE_STAGING.regularId, 'Reguler', account.revision, new Date()];
  sheet.getRange(target, 1, 1, 14).setValues([row.map(function(value) { return typeof value === 'string' ? sheetText_(value) : value == null ? '' : value; })]);
}
function firestoreApi_(body) {
  const secret = PropertiesService.getScriptProperties().getProperty('API_SHARED_SECRET');
  if (!secret || secret.length < 32) throw new Error('API_SHARED_SECRET_REQUIRED');
  const response = UrlFetchApp.fetch(FIRESTORE_STAGING.api, {
    method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + secret },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  const result = JSON.parse(response.getContentText());
  if (response.getResponseCode() !== 200 || result.success !== true) throw new Error(result.reason || 'FIRESTORE_SYNC_FAILED');
  return result;
}
function refreshFirestoreReports() {
  return firestoreLock_(function() {
    const sheets = firestoreSheets_();
    ['billingPurchases', 'billingAccounts'].forEach(function(collection) {
      let cursor = null;
      do {
        const result = firestoreApi_({ action: 'list', collection: collection, cursor: cursor });
        result.rows.forEach(function(record) {
          if (collection === 'billingPurchases') mirrorFirestorePurchase_(sheets.regular, record);
          else mirrorFirestoreAccount_(sheets.access, record);
        });
        cursor = result.cursor;
      } while (cursor);
    });
  });
}
function applyFirestoreSelected_(resetDevice) {
  return firestoreLock_(function() {
    const sheets = firestoreSheets_();
    const active = SpreadsheetApp.getActiveSheet();
    if (active.getName() !== FIRESTORE_STAGING.accessTab || active.getParent().getId() !== FIRESTORE_STAGING.accessId) throw new Error('SELECT_AU_ACCESS_ROW');
    const rowNumber = active.getActiveRange().getRow();
    if (rowNumber < 2) throw new Error('SELECT_BUYER_ROW');
    const row = active.getRange(rowNumber, 1, 1, 14).getValues()[0];
    const command = { action: 'apply', email: String(row[0]).trim().toLowerCase(), expectedRevision: Number(row[12]),
      statusAccount: row[5] === 'Expired' ? 'Active' : String(row[5]), expirationDate: sheetDate_(row[4], false),
      resetDevice: resetDevice || null, commandId: Utilities.getUuid() };
    const result = firestoreApi_(command);
    mirrorFirestoreAccount_(sheets.access, result.account);
    SpreadsheetApp.getActiveSpreadsheet().toast('Perubahan tersimpan di Firebase.', 'AU Admin');
  });
}
function applySelectedFirestoreAccount() { return applyFirestoreSelected_(null); }
function resetSelectedFirestorePhone() { return applyFirestoreSelected_('mobile'); }
function resetSelectedFirestoreLaptop() { return applyFirestoreSelected_('desktop'); }
function resetSelectedFirestoreDevices() { return applyFirestoreSelected_('all'); }
function installFirestoreReportTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'refreshFirestoreReports') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('refreshFirestoreReports').timeBased().everyMinutes(5).create();
}
function importExistingStagingBuyers() {
  return firestoreLock_(function() {
    const sheets = firestoreSheets_();
    const productId = PropertiesService.getScriptProperties().getProperty('LYNK_TEST_PRODUCT_UUID');
    if (!productId) throw new Error('LYNK_TEST_PRODUCT_UUID_REQUIRED');
    const count = Math.max(0, sheets.access.getLastRow() - 1);
    const accessRows = count ? sheets.access.getRange(2, 1, count, 14).getValues() : [];
    const transactionCount = Math.max(0, sheets.regular.getLastRow() - 1);
    const orders = transactionCount ? sheets.regular.getRange(2, 1, transactionCount, 26).getValues() : [];
    const latest = {};
    accessRows.forEach(function(row) {
      const email = String(row[0]).trim().toLowerCase();
      if (!email || String(row[10]) !== FIRESTORE_STAGING.regularId) return;
      if (!latest[email] || sheetDate_(row[3], true) > sheetDate_(latest[email][3], true)) latest[email] = row;
    });
    Object.keys(latest).forEach(function(email) {
      const row = latest[email];
      const order = orders.find(function(candidate) { return String(candidate[25]) === String(row[1]) && String(candidate[16]).trim().toLowerCase() === email && candidate[15] === 'SUCCESS'; });
      if (!order) throw new Error('SUCCESS_TRANSACTION_REQUIRED');
      const account = { email: email, ref: String(row[1]), buyerName: String(row[2] || ''), purchaseDate: sheetDate_(order[14], false),
        expirationDate: sheetDate_(row[4], false), statusAccount: row[5] === 'Inactive' ? 'Inactive' : 'Active',
        devices: { mobile: row[8] ? { id: String(row[8]), label: String(row[6] || 'Mobile Device') } : null,
          desktop: row[9] ? { id: String(row[9]), label: String(row[7] || 'Desktop Device') } : null }, revision: 1, uid: null };
      const result = firestoreApi_({ action: 'import', account: account,
        purchase: { ref: account.ref, email: email, purchasedAt: new Date(sheetDate_(order[14], true)).toISOString(), productId: productId, source: 'staging-import' } });
      mirrorFirestoreAccount_(sheets.access, result.account);
    });
    orders.forEach(function(order) {
      const email = String(order[16]).trim().toLowerCase();
      if (order[15] !== 'SUCCESS' || !latest[email]) return;
      firestoreApi_({ action: 'importHistory', purchase: {
        email: email, ref: String(order[25]), name: String(order[17] || ''),
        purchasedAt: new Date(sheetDate_(order[14], true)).toISOString(), productId: productId, source: 'staging-import'
      } });
    });
  });
}
