// ==============================================================
// AU TOOLKIT PRO - REFRESH FROM FIREBASE (REAL FIRESTORE QUERY)
// Versi: 1.0 - Query langsung ke Firestore REST API
// Project: gen-lang-client-0839250297
// Database: ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2
// ==============================================================
//
// SETUP WAJIB - Simpan di Script Properties (Extensions → Apps Script → Project Settings):
//   FIREBASE_PROJECT_ID      = gen-lang-client-0839250297
//   FIREBASE_DATABASE_ID     = ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2
//   FIREBASE_CLIENT_EMAIL    = firebase-adminsdk-fbsvc@gen-lang-client-0839250297.iam.gserviceaccount.com
//   FIREBASE_PRIVATE_KEY     = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
//   API_SHARED_SECRET        = (rahasia yang sama dengan web app)
//
// ==============================================================

// ─── Konfigurasi ───────────────────────────────────────────────
const FB_CONFIG = {
  SHEET_NAME: 'AU Access',
  TIMEZONE: 'Asia/Jakarta',
  SUBSCRIPTION_DAYS: 30,
  // Kolom spreadsheet (1-based)
  COL: {
    EMAIL: 1, REF: 2, NAME: 3, PURCHASE: 4, EXPIRY: 5,
    STATUS: 6, MOB_LABEL: 7, DSK_LABEL: 8, MOB_ID: 9, DSK_ID: 10,
    SRC_ID: 11, SRC_LABEL: 12
  }
};

// ─── Token Cache ────────────────────────────────────────────────
let _fbTokenCache = null;
let _fbTokenExpiry = 0;

/**
 * Normalisasi private key PEM dari berbagai format paste.
 * Handle: literal \n, double-escaped \\n, \r\n, dan newline asli.
 */
function normalizePrivateKey_(raw) {
  // Tahap 1: ganti \\n (double escaped) → \n dulu
  let key = raw.replace(/\\\\n/g, '\n');
  // Tahap 2: ganti literal \n (backslash + n) → newline asli
  key = key.replace(/\\n/g, '\n');
  // Tahap 3: normalisasi \r\n → \n
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Tahap 4: trim spasi/newline di ujung
  key = key.trim();

  // Validasi: harus ada header PEM
  if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error(
      'Format private key salah!\n' +
      'Pastikan key diawali dengan: -----BEGIN PRIVATE KEY-----\n' +
      'Panjang key saat ini: ' + key.length + ' karakter.\n' +
      'Cek Script Properties → FIREBASE_PRIVATE_KEY'
    );
  }

  return key;
}

/**
 * Fungsi debug: cek format key yang tersimpan di Script Properties.
 * Jalankan manual dari Apps Script editor untuk diagnosa.
 */
function debugFirebaseKey() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('FIREBASE_PRIVATE_KEY') || '';
  const ui = SpreadsheetApp.getUi();

  const info = [
    'Panjang raw key : ' + raw.length + ' karakter',
    'Karakter ke-1   : ' + (raw.charCodeAt(0) || 'kosong') + ' (' + (raw[0] || '-') + ')',
    'Mengandung \\\\n  : ' + raw.includes('\\n'),
    'Mengandung newline asli: ' + raw.includes('\n'),
    'Diawali BEGIN   : ' + raw.includes('BEGIN PRIVATE KEY'),
    '5 karakter pertama (kode): ' + Array.from(raw.slice(0, 5)).map(c => c.charCodeAt(0)).join(', '),
    '',
    'Preview 80 karakter pertama:',
    raw.slice(0, 80).replace(/\n/g, '[NL]')
  ].join('\n');

  ui.alert('Debug Firebase Key', info, ui.ButtonSet.OK);
}

/**
 * Buat JWT dan tukar ke OAuth2 Access Token via service account.
 * Token di-cache 55 menit (masa berlaku 60 menit).
 */
function getFirebaseAccessToken_() {
  const now = Math.floor(Date.now() / 1000);
  if (_fbTokenCache && now < _fbTokenExpiry) return _fbTokenCache;

  const props = PropertiesService.getScriptProperties();
  const clientEmail = props.getProperty('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = props.getProperty('FIREBASE_PRIVATE_KEY');

  if (!clientEmail || !privateKeyRaw) {
    throw new Error('FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY belum diset di Script Properties!');
  }

  // Normalisasi private key — handle semua skenario paste:
  // 1. Tersimpan sebagai literal \n (dari JSON copy-paste)
  // 2. Tersimpan sebagai \\n (double escaped)
  // 3. Sudah newline asli (paste langsung dari file)
  const privateKey = normalizePrivateKey_(privateKeyRaw);

  const header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=+$/, '');
  const claimSet = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })).replace(/=+$/, '');

  const sigInput = header + '.' + claimSet;
  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(sigInput, privateKey)
  ).replace(/=+$/, '');

  const jwt = sigInput + '.' + signature;

  const tokenResp = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt,
    muteHttpExceptions: true
  });

  const tokenData = JSON.parse(tokenResp.getContentText());
  if (!tokenData.access_token) {
    throw new Error('Gagal mendapat Firebase token: ' + JSON.stringify(tokenData));
  }

  _fbTokenCache = tokenData.access_token;
  _fbTokenExpiry = now + 3300; // cache 55 menit
  return _fbTokenCache;
}

/**
 * Query Firestore REST API.
 * @param {string} path - path dokumen relatif, contoh: 'users/mQcVng.../devices/mobile'
 * @returns {Object|null} data dokumen atau null jika tidak ditemukan
 */
function firestoreGet_(path) {
  const props = PropertiesService.getScriptProperties();
  const projectId = props.getProperty('FIREBASE_PROJECT_ID') || 'gen-lang-client-0839250297';
  const databaseId = props.getProperty('FIREBASE_DATABASE_ID') ||
    'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2';

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${path}`;
  const token = getFirebaseAccessToken_();

  const resp = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() === 404) return null;
  if (resp.getResponseCode() !== 200) {
    throw new Error('Firestore GET gagal [' + resp.getResponseCode() + ']: ' + resp.getContentText());
  }

  return JSON.parse(resp.getContentText());
}

/**
 * Query Firebase Auth REST API untuk lookup UID by email.
 * Menggunakan Identity Toolkit API (tidak perlu admin SDK).
 */
function firebaseAuthLookupByEmail_(email) {
  const props = PropertiesService.getScriptProperties();
  const projectId = props.getProperty('FIREBASE_PROJECT_ID') || 'gen-lang-client-0839250297';
  const token = getFirebaseAccessToken_();

  const url = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`;
  const resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ email: [email] }),
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) return null;

  const data = JSON.parse(resp.getContentText());
  if (!data.users || data.users.length === 0) return null;

  return data.users[0]; // { localId (uid), email, displayName, ... }
}

/**
 * Konversi nilai Firestore "typed value" ke nilai JS biasa.
 * Contoh: { "stringValue": "foo" } → "foo"
 */
function firestoreValueToJs_(typed) {
  if (!typed) return null;
  if ('stringValue' in typed) return typed.stringValue;
  if ('integerValue' in typed) return parseInt(typed.integerValue, 10);
  if ('doubleValue' in typed) return typed.doubleValue;
  if ('booleanValue' in typed) return typed.booleanValue;
  if ('timestampValue' in typed) return new Date(typed.timestampValue);
  if ('nullValue' in typed) return null;
  if ('mapValue' in typed) {
    const obj = {};
    const fields = typed.mapValue.fields || {};
    Object.keys(fields).forEach(k => { obj[k] = firestoreValueToJs_(fields[k]); });
    return obj;
  }
  if ('arrayValue' in typed) {
    return (typed.arrayValue.values || []).map(firestoreValueToJs_);
  }
  return null;
}

/**
 * Ambil semua field dari dokumen Firestore yang sudah di-GET.
 */
function parseFirestoreDoc_(doc) {
  if (!doc || !doc.fields) return null;
  const result = {};
  Object.keys(doc.fields).forEach(k => {
    result[k] = firestoreValueToJs_(doc.fields[k]);
  });
  return result;
}

// ==============================================================
// FUNGSI UTAMA: refreshFromFirebase()
// Dipanggil dari menu AU Admin → "Refresh from Firebase"
// ==============================================================

/**
 * Query Firebase Auth + Firestore untuk email yang dipilih di spreadsheet.
 * Jika email belum ada di sheet → auto-insert baris baru.
 * Jika sudah ada → update device info dari Firestore.
 */
function refreshFromFirebase() {
  const ui = SpreadsheetApp.getUi();

  // ── 1. Minta email (bisa dari baris terpilih atau input manual) ──
  let email = '';
  const sheet = SpreadsheetApp.getActiveSheet();
  const selectedRow = sheet.getActiveRange().getRow();

  if (selectedRow >= 2) {
    const rowEmail = String(sheet.getRange(selectedRow, FB_CONFIG.COL.EMAIL).getValue() || '').trim().toLowerCase();
    if (rowEmail) {
      email = rowEmail;
    }
  }

  if (!email) {
    const resp = ui.prompt(
      'Refresh dari Firebase',
      'Masukkan email pembeli yang ingin dicek:',
      ui.ButtonSet.OK_CANCEL
    );
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    email = String(resp.getResponseText() || '').trim().toLowerCase();
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ui.alert('Email tidak valid!');
    return;
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Sedang query Firebase untuk: ' + email + ' ...', 'Refresh Firebase', 15);

  // ── 2. Lookup UID via Firebase Auth ──
  let authUser;
  try {
    authUser = firebaseAuthLookupByEmail_(email);
  } catch (err) {
    ui.alert('Gagal query Firebase Auth:\n' + err.message);
    return;
  }

  if (!authUser) {
    ui.alert(
      'Tidak Ditemukan di Firebase',
      'Email ' + email + ' BELUM terdaftar di Firebase Authentication.\n\n' +
      'Pastikan pembeli sudah login minimal sekali di editor AU Toolkit.',
      ui.ButtonSet.OK
    );
    return;
  }

  const uid = authUser.localId;
  const displayName = authUser.displayName || '';

  // ── 3. Ambil data device dari Firestore users/{uid}/devices/mobile & desktop ──
  let mobileData = null;
  let desktopData = null;

  try {
    const mobileDoc = firestoreGet_(`users/${uid}/devices/mobile`);
    mobileData = parseFirestoreDoc_(mobileDoc);
  } catch (err) {
    console.warn('Gagal ambil mobile device:', err.message);
  }

  try {
    const desktopDoc = firestoreGet_(`users/${uid}/devices/desktop`);
    desktopData = parseFirestoreDoc_(desktopDoc);
  } catch (err) {
    console.warn('Gagal ambil desktop device:', err.message);
  }

  // ── 4. Ambil data akun dari Firestore users/{uid} ──
  let accountData = null;
  try {
    const userDoc = firestoreGet_(`users/${uid}`);
    accountData = parseFirestoreDoc_(userDoc);
  } catch (err) {
    console.warn('Gagal ambil user doc:', err.message);
  }

  // ── 5. Cari atau buat baris di spreadsheet ──
  const accessSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FB_CONFIG.SHEET_NAME);
  if (!accessSheet) {
    ui.alert('Sheet "' + FB_CONFIG.SHEET_NAME + '" tidak ditemukan!');
    return;
  }

  const data = accessSheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][FB_CONFIG.COL.EMAIL - 1] || '').trim().toLowerCase() === email) {
      rowIndex = i + 1; // 1-based row
      break;
    }
  }

  const mobId    = (mobileData && (mobileData.deviceId || '')) || '';
  const mobLabel = (mobileData && (mobileData.deviceModel || mobileData.deviceLabel || '')) || '';
  const dskId    = (desktopData && (desktopData.deviceId || '')) || '';
  const dskLabel = (desktopData && (desktopData.deviceModel || desktopData.deviceLabel || '')) || '';

  if (rowIndex === -1) {
    // ─── Email belum ada di sheet → INSERT baris baru ───────────
    const today = Utilities.formatDate(new Date(), FB_CONFIG.TIMEZONE, 'yyyy-MM-dd');
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + FB_CONFIG.SUBSCRIPTION_DAYS);
    const expStr = Utilities.formatDate(expDate, FB_CONFIG.TIMEZONE, 'yyyy-MM-dd');

    // Gunakan data dari Firestore user doc jika ada
    const purchaseDate = (accountData && accountData.purchaseDate)
      ? formatFbDate_(accountData.purchaseDate)
      : today;
    const expiration = (accountData && accountData.expirationDate)
      ? formatFbDate_(accountData.expirationDate)
      : expStr;
    const ref  = (accountData && accountData.ref) || '';
    const name = displayName || (accountData && accountData.buyerName) || '';
    const status = (accountData && accountData.statusAccount) || 'Active';

    const newRow = [
      email, ref, name, purchaseDate, expiration, status,
      mobLabel, dskLabel, mobId, dskId,
      'Firebase-Auth', 'Manual Refresh'
    ];

    accessSheet.appendRow(newRow);
    rowIndex = accessSheet.getLastRow();

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Baris baru ditambahkan untuk: ' + email, 'Refresh Firebase', 5
    );
  } else {
    // ─── Email sudah ada → UPDATE device info dari Firestore ────
    if (mobId) {
      accessSheet.getRange(rowIndex, FB_CONFIG.COL.MOB_LABEL).setValue(mobLabel || 'Mobile Device');
      accessSheet.getRange(rowIndex, FB_CONFIG.COL.MOB_ID).setValue(mobId);
    }
    if (dskId) {
      accessSheet.getRange(rowIndex, FB_CONFIG.COL.DSK_LABEL).setValue(dskLabel || 'Desktop Device');
      accessSheet.getRange(rowIndex, FB_CONFIG.COL.DSK_ID).setValue(dskId);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Data device diperbarui dari Firebase untuk: ' + email, 'Refresh Firebase', 5
    );
  }

  // ── 6. Tampilkan laporan ke admin ──
  const hpInfo = mobId
    ? 'Terdaftar\n  Label: ' + (mobLabel || '-') + '\n  ID: ' + mobId
    : 'Slot kosong / Belum login HP';
  const laptopInfo = dskId
    ? 'Terdaftar\n  Label: ' + (dskLabel || '-') + '\n  ID: ' + dskId
    : 'Slot kosong / Belum login Laptop';

  const fbCreated = authUser.createdAt ? new Date(parseInt(authUser.createdAt, 10)).toLocaleString('id-ID') : '-';
  const fbLastLogin = authUser.lastLoginAt ? new Date(parseInt(authUser.lastLoginAt, 10)).toLocaleString('id-ID') : '-';

  const pesan = [
    'Hasil Refresh dari Firebase:',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'Email    : ' + email,
    'Nama     : ' + (displayName || '-'),
    'UID      : ' + uid,
    'Dibuat   : ' + fbCreated,
    'Last Login: ' + fbLastLogin,
    '',
    'Perangkat di Firestore:',
    '• Handphone: ' + hpInfo,
    '• Laptop/PC: ' + laptopInfo,
    '',
    rowIndex > 0
      ? '✅ Spreadsheet diperbarui di baris ' + rowIndex + '.'
      : '✅ Baris baru ditambahkan.',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');

  ui.alert('Refresh Firebase - ' + email, pesan, ui.ButtonSet.OK);
}

// ==============================================================
// BONUS: refreshFirebaseForAllRows()
// Refresh semua baris di sheet sekaligus (device sync massal)
// ==============================================================

function refreshFirebaseForAllRows() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Refresh Firebase - Semua Baris',
    'Ini akan query Firebase untuk SEMUA email di sheet AU Access.\n\nProses mungkin memakan waktu beberapa menit.\nLanjutkan?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  const accessSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FB_CONFIG.SHEET_NAME);
  if (!accessSheet) {
    ui.alert('Sheet "' + FB_CONFIG.SHEET_NAME + '" tidak ditemukan!');
    return;
  }

  const data = accessSheet.getDataRange().getValues();
  let updated = 0;
  let notFound = 0;
  let errors = 0;
  const notFoundList = [];

  for (let i = 1; i < data.length; i++) {
    const email = String(data[i][FB_CONFIG.COL.EMAIL - 1] || '').trim().toLowerCase();
    if (!email) continue;

    try {
      const authUser = firebaseAuthLookupByEmail_(email);
      if (!authUser) {
        notFound++;
        notFoundList.push(email);
        continue;
      }

      const uid = authUser.localId;
      const rowIndex = i + 1;

      const mobileDoc  = firestoreGet_(`users/${uid}/devices/mobile`);
      const desktopDoc = firestoreGet_(`users/${uid}/devices/desktop`);

      const mob = parseFirestoreDoc_(mobileDoc);
      const dsk = parseFirestoreDoc_(desktopDoc);

      if (mob && mob.deviceId) {
        accessSheet.getRange(rowIndex, FB_CONFIG.COL.MOB_LABEL).setValue(mob.deviceModel || mob.deviceLabel || 'Mobile Device');
        accessSheet.getRange(rowIndex, FB_CONFIG.COL.MOB_ID).setValue(mob.deviceId);
      }
      if (dsk && dsk.deviceId) {
        accessSheet.getRange(rowIndex, FB_CONFIG.COL.DSK_LABEL).setValue(dsk.deviceModel || dsk.deviceLabel || 'Desktop Device');
        accessSheet.getRange(rowIndex, FB_CONFIG.COL.DSK_ID).setValue(dsk.deviceId);
      }

      updated++;
      Utilities.sleep(200); // hindari quota rate limit
    } catch (err) {
      errors++;
      console.error('Error refresh ' + email + ':', err.message);
    }
  }

  SpreadsheetApp.flush();

  ui.alert(
    'Refresh Firebase Selesai',
    'Berhasil diperbarui : ' + updated + ' akun\n' +
    'Tidak ada di Firebase: ' + notFound + ' akun\n' +
    (notFoundList.length ? '  → ' + notFoundList.slice(0, 5).join(', ') + (notFoundList.length > 5 ? ' ...' : '') + '\n' : '') +
    'Error              : ' + errors + ' akun',
    ui.ButtonSet.OK
  );
}

// ==============================================================
// HELPER: format tanggal dari Firestore (bisa Date atau string)
// ==============================================================
function formatFbDate_(val) {
  if (!val) return '';
  if (val instanceof Date) return Utilities.formatDate(val, FB_CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return str;
}

// ==============================================================
// SETUP HELPER: Simpan kredensial Firebase ke Script Properties
// Jalankan sekali dari editor Apps Script
// ==============================================================
function setupFirebaseCredentials() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  // Cek apakah sudah ada
  const existing = props.getProperty('FIREBASE_CLIENT_EMAIL');
  if (existing) {
    const confirm = ui.alert(
      'Kredensial Firebase sudah ada:\n' + existing + '\n\nTimpa dengan yang baru?',
      ui.ButtonSet.YES_NO
    );
    if (confirm !== ui.Button.YES) return;
  }

  const projectId = ui.prompt('Firebase Project ID:', '', ui.ButtonSet.OK_CANCEL);
  if (projectId.getSelectedButton() !== ui.Button.OK) return;

  const databaseId = ui.prompt('Firestore Database ID (tekan OK untuk default):', '', ui.ButtonSet.OK_CANCEL);
  if (databaseId.getSelectedButton() !== ui.Button.OK) return;

  const clientEmail = ui.prompt('Service Account Client Email:', '', ui.ButtonSet.OK_CANCEL);
  if (clientEmail.getSelectedButton() !== ui.Button.OK) return;

  const privateKey = ui.prompt('Private Key (paste seluruh isi termasuk BEGIN/END):', '', ui.ButtonSet.OK_CANCEL);
  if (privateKey.getSelectedButton() !== ui.Button.OK) return;

  props.setProperties({
    'FIREBASE_PROJECT_ID'  : projectId.getResponseText().trim(),
    'FIREBASE_DATABASE_ID' : databaseId.getResponseText().trim() ||
      'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2',
    'FIREBASE_CLIENT_EMAIL': clientEmail.getResponseText().trim(),
    'FIREBASE_PRIVATE_KEY' : privateKey.getResponseText().trim()
  });

  ui.alert('Kredensial Firebase berhasil disimpan!');
}
