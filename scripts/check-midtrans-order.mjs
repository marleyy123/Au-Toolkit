/**
 * Cek order Midtrans di Firestore untuk email tertentu
 * Usage: node scripts/check-midtrans-order.mjs tarisaannaiaa@gmail.com
 */
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.log('\n❌ Masukkan email! Contoh: node scripts/check-midtrans-order.mjs user@example.com\n');
  process.exit(1);
}

const certPath = resolve('gen-lang-client-0839250297-firebase-adminsdk-fbsvc-2c3bdac3e8.json');
if (!existsSync(certPath)) { console.error('Service account tidak ditemukan:', certPath); process.exit(1); }

const serviceAccount = JSON.parse(readFileSync(certPath, 'utf8'));
const app = !admin.apps.length
  ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: serviceAccount.project_id })
  : admin.app();

const databaseId = 'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2';
let db;
try { db = getFirestore(app, databaseId); } catch { db = getFirestore(app); }

async function main() {
  console.log(`\n🔍 Mencari order Midtrans untuk: ${email}\n`);

  // Cek midtransOrders
  const ordersSnap = await db.collection('midtransOrders')
    .where('email', '==', email)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  if (ordersSnap.empty) {
    console.log('❌ Tidak ada order Midtrans ditemukan untuk email ini.');
  } else {
    console.log(`✅ Ditemukan ${ordersSnap.size} order:\n`);
    ordersSnap.forEach(doc => {
      const d = doc.data();
      console.log('Order ID   :', doc.id);
      console.log('Status     :', d.state, '←', d.state === 'paid' ? '✅ SUDAH BAYAR' : '❌ BELUM/GAGAL');
      console.log('Plan       :', d.planId, '|', d.accessDays, 'hari');
      console.log('Amount     :', d.amount?.toLocaleString('id-ID'), 'IDR');
      console.log('Created    :', d.createdAt);
      console.log('─'.repeat(50));
    });
  }

  // Cek billingAccounts / users doc
  console.log('\n🔍 Cek akun di Firestore (users collection)...');
  try {
    const authUser = await admin.auth(app).getUserByEmail(email);
    const uid = authUser.uid;
    const userDoc = await db.doc(`users/${uid}`).get();
    if (userDoc.exists) {
      const u = userDoc.data();
      console.log('✅ User doc ada di Firestore:');
      console.log('  expirationDate :', u.expirationDate || '-');
      console.log('  statusAccount  :', u.statusAccount || '-');
      console.log('  ref            :', u.ref || '-');
    } else {
      console.log('⚠️  User doc TIDAK ADA di Firestore users/{uid}');
      console.log('   UID:', uid);
    }
  } catch (e) {
    console.log('⚠️  Error cek user doc:', e.message);
  }

  // Cek billingPurchases
  console.log('\n🔍 Cek billingPurchases...');
  try {
    const bpSnap = await db.collection('billingPurchases')
      .where('email', '==', email)
      .limit(5)
      .get();
    if (bpSnap.empty) {
      console.log('❌ Tidak ada di billingPurchases');
    } else {
      bpSnap.forEach(doc => {
        const d = doc.data();
        console.log('✅ billingPurchases:', doc.id);
        console.log('   purchasedAt:', d.purchasedAt);
        console.log('   source:', d.source);
      });
    }
  } catch (e) {
    console.log('⚠️  Error:', e.message);
  }
}

main().catch(console.error);
