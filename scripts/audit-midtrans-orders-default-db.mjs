/**
 * Audit Midtrans orders di DEFAULT Firestore (yang dipakai webhook)
 * Usage: node scripts/audit-midtrans-orders-default-db.mjs
 */
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const certPath = resolve('gen-lang-client-0839250297-firebase-adminsdk-fbsvc-2c3bdac3e8.json');
if (!existsSync(certPath)) { console.error('Service account tidak ditemukan'); process.exit(1); }

const serviceAccount = JSON.parse(readFileSync(certPath, 'utf8'));
const app = !admin.apps.length
  ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: serviceAccount.project_id })
  : admin.app();

// ⚠️ Pakai DEFAULT database (sama seperti getStagingDb di webhook)
const db = getFirestore(app);
// Custom database (yang dipakai check-user.mjs)
const customDb = getFirestore(app, 'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2');

async function main() {
  console.log('\n📊 AUDIT — DEFAULT vs CUSTOM DATABASE');
  console.log('='.repeat(60));

  // Cek di DEFAULT database
  console.log('\n[DEFAULT DB] Koleksi yang ada:');
  for (const col of ['midtransOrders', 'billingAccounts', 'billingPurchases', 'midtransLimits', 'users', 'workspaceAccess']) {
    try {
      const snap = await db.collection(col).limit(3).get();
      console.log(`  ${col}: ${snap.size} dokumen (ada lebih banyak mungkin)`);
      if (!snap.empty && col === 'midtransOrders') {
        snap.docs.forEach(d => {
          const data = d.data();
          console.log(`    → ${data.email} | state: ${data.state} | ${data.createdAt}`);
        });
      }
      if (!snap.empty && col === 'billingAccounts') {
        snap.docs.forEach(d => {
          const data = d.data();
          console.log(`    → ${data.email} | exp: ${data.expirationDate} | status: ${data.statusAccount}`);
        });
      }
    } catch (e) {
      console.log(`  ${col}: error - ${e.message}`);
    }
  }

  // Cek di CUSTOM database
  console.log('\n[CUSTOM DB] Koleksi yang ada:');
  for (const col of ['midtransOrders', 'billingAccounts', 'billingPurchases', 'users', 'workspaceAccess']) {
    try {
      const snap = await customDb.collection(col).limit(3).get();
      console.log(`  ${col}: ${snap.size} dokumen`);
      if (!snap.empty && col === 'users') {
        snap.docs.forEach(d => {
          const data = d.data();
          console.log(`    → UID: ${d.id} | email: ${data.email || '-'}`);
        });
      }
    } catch (e) {
      console.log(`  ${col}: error - ${e.message}`);
    }
  }

  // Semua paid orders dari DEFAULT db
  console.log('\n' + '='.repeat(60));
  console.log('SEMUA PAID ORDERS (default DB):');
  const paidSnap = await db.collection('midtransOrders').where('state', '==', 'paid').get();
  if (paidSnap.empty) {
    console.log('  Tidak ada order paid di default DB');
  } else {
    console.log(`  Ditemukan ${paidSnap.size} paid orders:\n`);
    paidSnap.docs.forEach(d => {
      const o = d.data();
      console.log(`  ✅ ${o.email}`);
      console.log(`     Order: ${d.id}`);
      console.log(`     Amount: Rp${o.amount?.toLocaleString('id-ID')}`);
      console.log(`     Created: ${o.createdAt}`);
      console.log('');
    });
  }

  // Pending orders
  const pendingSnap = await db.collection('midtransOrders').where('state', '==', 'pending').get();
  if (!pendingSnap.empty) {
    console.log(`\n⏳ ${pendingSnap.size} ORDER MASIH PENDING:`);
    pendingSnap.docs.forEach(d => {
      const o = d.data();
      console.log(`  ⏳ ${o.email} | ${d.id} | ${o.createdAt}`);
    });
    console.log('\nJalankan recheck untuk verifikasi ulang ke Midtrans API');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
