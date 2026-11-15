/**
 * Audit semua order Midtrans di Firestore
 * Cek mana yang sudah paid tapi belum ada di billingPurchases/users
 * Usage: node scripts/audit-midtrans-orders.mjs
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

const databaseId = 'ai-studio-remixremixremixr-6c0b7143-5f10-455d-add4-f50bb2f57cb2';
let db;
try { db = getFirestore(app, databaseId); } catch { db = getFirestore(app); }

async function main() {
  console.log('\n📊 AUDIT MIDTRANS ORDERS\n' + '='.repeat(60));

  // 1. Ambil semua midtransOrders
  const ordersSnap = await db.collection('midtransOrders').get();
  const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const paid    = orders.filter(o => o.state === 'paid');
  const pending = orders.filter(o => o.state === 'pending');
  const created = orders.filter(o => o.state === 'created');
  const other   = orders.filter(o => !['paid','pending','created'].includes(o.state));

  console.log(`Total orders  : ${orders.length}`);
  console.log(`  ✅ paid     : ${paid.length}`);
  console.log(`  ⏳ pending  : ${pending.length}`);
  console.log(`  🆕 created  : ${created.length}`);
  console.log(`  ❓ other    : ${other.length}`);

  if (paid.length === 0) {
    console.log('\n⚠️  Tidak ada order yang paid di Firestore midtransOrders.');
    console.log('Kemungkinan pembeli tidak bayar via tombol Midtrans di website.\n');
    return;
  }

  // 2. Cek billingPurchases untuk setiap email paid
  console.log('\n' + '='.repeat(60));
  console.log('CEK SYNC: paid orders vs billingPurchases / users doc');
  console.log('='.repeat(60));

  const results = [];
  for (const order of paid) {
    const email = order.email;
    
    // Cek billingPurchases
    const bpSnap = await db.collection('billingPurchases')
      .where('email', '==', email).limit(3).get();
    const hasBilling = !bpSnap.empty;

    // Cek users/{uid}
    let hasUserDoc = false;
    let uid = null;
    try {
      const authUser = await admin.auth(app).getUserByEmail(email);
      uid = authUser.uid;
      const userDoc = await db.doc(`users/${uid}`).get();
      hasUserDoc = userDoc.exists;
    } catch {}

    const synced = hasBilling || hasUserDoc;
    results.push({ email, orderId: order.id, createdAt: order.createdAt, 
                   amount: order.amount, planId: order.planId,
                   hasBilling, hasUserDoc, uid, synced });
  }

  // Tampilkan yang TIDAK sync
  const notSynced = results.filter(r => !r.synced);
  const synced    = results.filter(r => r.synced);

  console.log(`\n✅ Sudah sync ke Firestore: ${synced.length}`);
  console.log(`❌ BELUM sync / bermasalah : ${notSynced.length}`);

  if (synced.length > 0) {
    console.log('\n--- SUDAH SYNC ---');
    synced.forEach(r => {
      console.log(`  ✅ ${r.email} | ${r.orderId} | ${r.amount?.toLocaleString('id-ID')} IDR`);
    });
  }

  if (notSynced.length > 0) {
    console.log('\n--- ❌ BELUM SYNC (perlu tindakan) ---');
    notSynced.forEach(r => {
      console.log(`  ❌ ${r.email}`);
      console.log(`     Order ID  : ${r.orderId}`);
      console.log(`     Tanggal   : ${r.createdAt}`);
      console.log(`     Amount    : ${r.amount?.toLocaleString('id-ID')} IDR`);
      console.log(`     Plan      : ${r.planId}`);
      console.log(`     UID       : ${r.uid || 'belum register'}`);
      console.log(`     Billing   : ${r.hasBilling ? '✅' : '❌'}`);
      console.log(`     User doc  : ${r.hasUserDoc ? '✅' : '❌'}`);
      console.log('');
    });
  }

  // 3. Summary pending yang mungkin sudah bayar tapi webhook tidak terima
  if (pending.length > 0) {
    console.log('='.repeat(60));
    console.log(`⚠️  ${pending.length} order masih PENDING — mungkin sudah bayar tapi webhook gagal:`);
    pending.forEach(o => {
      console.log(`  ⏳ ${o.email} | ${o.id} | ${o.createdAt}`);
    });
    console.log('\nJalankan: node scripts/recheck-pending-orders.mjs untuk re-verify ke Midtrans API');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
