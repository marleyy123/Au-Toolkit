
import {
  getStagingDb,
  normalizeEmail,
  accountId
} from './lib/staging-access-store.js';

const orderId = process.argv[2];
const email = normalizeEmail(process.argv[3] || '');

if (!orderId || !email) {
  console.log('Gunakan: node check-midtrans.js <ORDER_ID> <EMAIL>');
  process.exit(1);
}

const db = getStagingDb(process.env);

async function check() {
  const orderRef = db.collection('midtransOrders').doc(orderId);
  const purchaseRef = db.collection('billingPurchases').doc(orderId);
  const accountRef = db.collection('billingAccounts').doc(accountId(email));

  const [orderSnap, purchaseSnap, accountSnap] = await Promise.all([
    orderRef.get(),
    purchaseRef.get(),
    accountRef.get()
  ]);

  console.log('\n===== HASIL PEMERIKSAAN MIDTRANS =====');

  const order = orderSnap.exists ? orderSnap.data() : null;
  const purchase = purchaseSnap.exists ? purchaseSnap.data() : null;
  const account = accountSnap.exists ? accountSnap.data() : null;

  console.log('\n[midtransOrders]');
  console.log({
    exists: orderSnap.exists,
    state: order?.state,
    planId: order?.planId,
    accessDays: order?.accessDays
  });

  console.log('\n[billingPurchases]');
  console.log({
    exists: purchaseSnap.exists,
    planId: purchase?.planId,
    accessDays: purchase?.accessDays
  });

  console.log('\n[billingAccounts]');
  console.log({
    exists: accountSnap.exists,
    planId: account?.planId,
    accessDays: account?.accessDays,
    statusAccount: account?.statusAccount,
    purchaseDate: account?.purchaseDate,
    expirationDate: account?.expirationDate
  });
}

check().catch(error => {
  console.error('Gagal memeriksa Firestore:', error.message);
  process.exit(1);
});
