import fs from 'node:fs';

const authPath = process.argv[2] || 'firebase-auth-users.json';
const buyersPath = process.argv[3] || 'buyer-sheet.csv';

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

const authUsers = JSON.parse(fs.readFileSync(authPath, 'utf8')).users || [];
const rows = parseCsv(fs.readFileSync(buyersPath, 'utf8'));
const header = rows[0] || [];
const emailIndex = header.findIndex((name) => normalizeEmail(name) === 'buyer email');
const statusIndex = header.findIndex((name) => normalizeEmail(name) === 'status');

if (emailIndex === -1 || statusIndex === -1) {
  throw new Error('buyer-sheet.csv must contain Buyer Email and Status columns.');
}

const allBuyerEmails = new Set();
const successBuyerEmails = new Set();
let successRows = 0;

for (const row of rows.slice(1)) {
  const email = normalizeEmail(row[emailIndex]);
  const status = String(row[statusIndex] || '').trim().toUpperCase();
  if (email) allBuyerEmails.add(email);
  if (email && status === 'SUCCESS') {
    successBuyerEmails.add(email);
    successRows += 1;
  }
}

const keep = [];
const deleteCandidates = [];

for (const user of authUsers) {
  const email = normalizeEmail(user.email);
  const record = {
    email,
    uid: user.localId,
    createdAt: user.createdAt ? new Date(Number(user.createdAt)).toISOString() : '',
    lastLoginAt: user.lastLoginAt ? new Date(Number(user.lastLoginAt)).toISOString() : '',
    providers: (user.providerUserInfo || []).map((provider) => provider.providerId).join(',') || 'password',
  };

  if (successBuyerEmails.has(email)) {
    keep.push(record);
  } else {
    deleteCandidates.push({
      ...record,
      reason: allBuyerEmails.has(email) ? 'EMAIL_IN_SHEET_NOT_SUCCESS' : 'EMAIL_NOT_IN_SUCCESS_BUYERS',
    });
  }
}

const deleteReasons = deleteCandidates.reduce((acc, item) => {
  acc[item.reason] = (acc[item.reason] || 0) + 1;
  return acc;
}, {});

fs.writeFileSync('firebase-auth-keep.json', `${JSON.stringify(keep, null, 2)}\n`);
fs.writeFileSync('firebase-auth-delete-candidates.json', `${JSON.stringify(deleteCandidates, null, 2)}\n`);
fs.writeFileSync(
  'firebase-auth-delete-uids.txt',
  `${deleteCandidates.map((item) => item.uid).filter(Boolean).join('\n')}\n`,
);

console.log(JSON.stringify({
  sheetRows: rows.length - 1,
  uniqueSheetEmails: allBuyerEmails.size,
  successRows,
  uniqueSuccessEmails: successBuyerEmails.size,
  authUsers: authUsers.length,
  keepAuthUsers: keep.length,
  deleteCandidates: deleteCandidates.length,
  deleteReasons,
  sampleDelete: deleteCandidates.slice(0, 10),
}, null, 2));
