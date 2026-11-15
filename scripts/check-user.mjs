import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.log('\n❌ Masukkan email yang ingin dicek!');
  console.log('Contoh: node scripts/check-user.mjs user@example.com\n');
  process.exit(1);
}

// Cari service account production
const certPath = resolve('gen-lang-client-0839250297-firebase-adminsdk-fbsvc-2c3bdac3e8.json');
if (!existsSync(certPath)) {
  console.error('Service account production tidak ditemukan di:', certPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(certPath, 'utf8'));

const app = !admin.apps.length
  ? admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    })
  : admin.app();

const auth = admin.auth();

// Di production menggunakan database ID custom
const databaseId = 'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2';

let db;
try {
  db = getFirestore(app, databaseId);
} catch {
  db = getFirestore(app);
}

async function checkUser() {
  console.log(`\n🔍 Mencari data Firebase untuk: ${email} ...\n`);

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('⚠️  Email ini BELUM PERNAH LOGIN / BELUM TERDAFTAR di Firebase Authentication!');
      return;
    }
    console.error('Error mencari user auth:', err.message);
    return;
  }

  console.log('================ [ FIREBASE AUTH ] ================');
  console.log(`UID             : ${userRecord.uid}`);
  console.log(`Email           : ${userRecord.email}`);
  console.log(`Nama            : ${userRecord.displayName || '(belum ada)'}`);
  console.log(`Email Verified  : ${userRecord.emailVerified ? '✅ Ya' : '❌ Belum'}`);
  console.log(`Dibuat Pada     : ${userRecord.metadata.creationTime}`);
  console.log(`Terakhir Login  : ${userRecord.metadata.lastSignInTime}`);
  console.log('====================================================\n');

  // Cek Firestore users/{uid}/devices
  const uid = userRecord.uid;
  let mobileDoc, desktopDoc;
  try {
    mobileDoc = await db.doc(`users/${uid}/devices/mobile`).get();
    desktopDoc = await db.doc(`users/${uid}/devices/desktop`).get();
  } catch (fsErr) {
    // Coba fallback ke default database jika custom database gagal
    try {
      const fallbackDb = getFirestore(app);
      mobileDoc = await fallbackDb.doc(`users/${uid}/devices/mobile`).get();
      desktopDoc = await fallbackDb.doc(`users/${uid}/devices/desktop`).get();
    } catch {
      console.error('Error mengambil data Firestore:', fsErr.message);
      return;
    }
  }

  console.log('================ [ PERANGKAT FIRESTORE ] ================');
  
  if (mobileDoc && mobileDoc.exists) {
    const mob = mobileDoc.data();
    console.log('📱 HANDPHONE / TABLET:');
    console.log(`   - Model Device : ${mob.deviceModel || mob.deviceLabel || '-'}`);
    console.log(`   - Device ID    : ${mob.deviceId || '-'}`);
    console.log(`   - Terakhir Aktif: ${mob.lastLoginAt || mob.registeredAt || '-'}`);
  } else {
    console.log('📱 HANDPHONE / TABLET: (Belum ada perangkat terdaftar / slot kosong)');
  }

  console.log('----------------------------------------------------');

  if (desktopDoc && desktopDoc.exists) {
    const dsk = desktopDoc.data();
    console.log('💻 LAPTOP / PC:');
    console.log(`   - Model Device : ${dsk.deviceModel || dsk.deviceLabel || '-'}`);
    console.log(`   - Device ID    : ${dsk.deviceId || '-'}`);
    console.log(`   - Terakhir Aktif: ${dsk.lastLoginAt || dsk.registeredAt || '-'}`);
  } else {
    console.log('💻 LAPTOP / PC: (Belum ada perangkat terdaftar / slot kosong)');
  }

  console.log('========================================================\n');
  console.log('💡 Cocokkan Device ID di atas dengan Kolom I (HP) atau Kolom J (Laptop) di spreadsheet!');
}

checkUser().catch(console.error);
