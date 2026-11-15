/**
 * Cross-check Firebase Auth users vs AU Access Spreadsheet
 * Temukan siapa yang ada di Firebase tapi belum di sheet
 * Usage: node scripts/crosscheck-firebase-vs-sheet.mjs
 */
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const certPath = resolve('gen-lang-client-0839250297-firebase-adminsdk-fbsvc-2c3bdac3e8.json');
if (!existsSync(certPath)) { console.error('Service account tidak ditemukan'); process.exit(1); }

const SA = JSON.parse(readFileSync(certPath, 'utf8'));
const app = !admin.apps.length
  ? admin.initializeApp({ credential: admin.credential.cert(SA), projectId: SA.project_id })
  : admin.app();
const db = getFirestore(app, 'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2');
const auth = admin.auth(app);

// ── Ambil semua email dari Spreadsheet via Apps Script ──────────
// Karena kita tidak bisa akses sheet langsung dari Node,
// kita baca dari file export jika ada, atau pakai daftar dari Firestore workspaceAccess
async function getSheetEmailsFromWorkspaceAccess() {
  const snap = await db.collection('workspaceAccess').get();
  const emails = new Set();
  snap.docs.forEach(d => {
    const e = String(d.data().email || '').trim().toLowerCase();
    if (e) emails.add(e);
  });
  return emails;
}

async function main() {
  console.log('\n📊 CROSS-CHECK: Firebase Auth vs Spreadsheet');
  console.log('='.repeat(60));

  // 1. Ambil semua user dari Firebase Auth
  console.log('\n[1/3] Mengambil semua user dari Firebase Auth...');
  const allAuthUsers = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    allAuthUsers.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  console.log(`  Total Firebase Auth users: ${allAuthUsers.length}`);

  // 2. Ambil email yang sudah ada di workspaceAccess (proxy dari sheet)
  console.log('\n[2/3] Mengambil data workspaceAccess dari Firestore...');
  const sheetEmails = await getSheetEmailsFromWorkspaceAccess();
  console.log(`  Total di workspaceAccess (proxy sheet): ${sheetEmails.size}`);

  // 3. Cross-check
  console.log('\n[3/3] Membandingkan...\n');
  const notInSheet    = [];
  const inSheet       = [];
  const activeInSheet = [];

  for (const user of allAuthUsers) {
    const email = String(user.email || '').trim().toLowerCase();
    if (!email) continue;

    const created = new Date(user.metadata.creationTime);
    const lastLogin = new Date(user.metadata.lastSignInTime);
    const hasWorkspace = sheetEmails.has(email);

    if (hasWorkspace) {
      inSheet.push({ email, created, lastLogin });
      // Cek apakah akses masih aktif
      const wsSnap = await db.collection('workspaceAccess')
        .where('email', '==', email).limit(1).get();
      if (!wsSnap.empty) {
        const ws = wsSnap.docs[0].data();
        if (ws.active) activeInSheet.push(email);
      }
    } else {
      notInSheet.push({
        email,
        displayName: user.displayName || '-',
        created: user.metadata.creationTime,
        lastLogin: user.metadata.lastSignInTime,
        emailVerified: user.emailVerified
      });
    }
  }

  // ── Laporan ─────────────────────────────────────────────────
  console.log('='.repeat(60));
  console.log(`✅ Ada di sheet (workspaceAccess aktif): ${activeInSheet.length}`);
  console.log(`📋 Ada di sheet (semua):                 ${inSheet.length}`);
  console.log(`❓ BELUM di sheet:                       ${notInSheet.length}`);
  console.log('='.repeat(60));

  if (notInSheet.length > 0) {
    console.log('\n❓ EMAIL YANG BELUM ADA DI SHEET:');
    console.log('(Ini bisa: belum bayar, bayar via jalur lain, atau sync gagal)\n');

    // Sort by lastLogin (paling aktif duluan)
    notInSheet.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));

    notInSheet.forEach((u, i) => {
      const loginDate = new Date(u.lastLogin);
      const daysAgo = Math.floor((Date.now() - loginDate) / 86400000);
      console.log(`${i + 1}. ${u.email}`);
      console.log(`   Nama     : ${u.displayName}`);
      console.log(`   Daftar   : ${u.created}`);
      console.log(`   Last login: ${u.lastLogin} (${daysAgo} hari lalu)`);
      console.log(`   Email verified: ${u.emailVerified ? '✅' : '❌'}`);
      console.log('');
    });

    // Simpan ke file CSV untuk diimport ke sheet
    const csvLines = ['Email,Nama,Tanggal Daftar,Last Login,Email Verified'];
    notInSheet.forEach(u => {
      csvLines.push(`"${u.email}","${u.displayName}","${u.created}","${u.lastLogin}","${u.emailVerified}"`);
    });
    const csvPath = resolve('scripts/output-not-in-sheet.csv');
    writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
    console.log(`\n💾 Disimpan ke: ${csvPath}`);
    console.log('   Buka file ini untuk lihat daftar lengkap & cek manual siapa yang sudah bayar.');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
