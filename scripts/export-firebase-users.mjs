/**
 * Export semua email dari Firebase Auth ke CSV
 * lalu bandingkan dengan daftar email di sheet (paste manual)
 * Usage: node scripts/export-firebase-users.mjs
 */
import admin from 'firebase-admin';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const certPath = resolve('gen-lang-client-0839250297-firebase-adminsdk-fbsvc-2c3bdac3e8.json');
if (!existsSync(certPath)) { console.error('Service account tidak ditemukan'); process.exit(1); }

const SA = JSON.parse(readFileSync(certPath, 'utf8'));
const app = !admin.apps.length
  ? admin.initializeApp({ credential: admin.credential.cert(SA), projectId: SA.project_id })
  : admin.app();
const auth = admin.auth(app);

async function main() {
  console.log('\n📤 Export semua Firebase Auth users...');

  const allUsers = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    allUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  console.log(`Total: ${allUsers.length} users`);

  // Sort: paling sering login duluan
  allUsers.sort((a, b) =>
    new Date(b.metadata.lastSignInTime) - new Date(a.metadata.lastSignInTime)
  );

  // Export CSV lengkap
  const csvFull = ['Email,Nama,Tanggal Daftar,Last Login,Email Verified'];
  allUsers.forEach(u => {
    csvFull.push([
      `"${u.email || ''}"`,
      `"${(u.displayName || '').replace(/"/g, "'")}"`,
      `"${u.metadata.creationTime}"`,
      `"${u.metadata.lastSignInTime}"`,
      u.emailVerified ? 'YES' : 'NO'
    ].join(','));
  });
  writeFileSync(resolve('scripts/all-firebase-users.csv'), csvFull.join('\n'), 'utf8');
  console.log('✅ Disimpan: scripts/all-firebase-users.csv');

  // Export hanya email (untuk cross-check di sheet)
  const emailOnly = allUsers.map(u => u.email || '').filter(Boolean);
  writeFileSync(resolve('scripts/all-firebase-emails.txt'), emailOnly.join('\n'), 'utf8');
  console.log('✅ Disimpan: scripts/all-firebase-emails.txt');

  // Statistik login hari ini
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const loginToday = allUsers.filter(u => new Date(u.metadata.lastSignInTime) >= today);
  const loginThisWeek = allUsers.filter(u => {
    const d = new Date(u.metadata.lastSignInTime);
    return (Date.now() - d.getTime()) < 7 * 86400000;
  });

  console.log('\n📊 Statistik:');
  console.log(`  Login hari ini     : ${loginToday.length}`);
  console.log(`  Login 7 hari terakhir: ${loginThisWeek.length}`);
  console.log(`  Total semua user   : ${allUsers.length}`);
  console.log('\n👉 Buka scripts/all-firebase-users.csv untuk lihat semua user');
  console.log('👉 Cocokkan dengan sheet AU Access untuk cari yang belum terdaftar\n');
}

main().catch(console.error);
