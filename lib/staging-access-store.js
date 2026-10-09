import { createHash } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';

export const PROJECT_ID = 'au-toolkit-staging-20261005';
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4xs8YHS0r0jSXpqD8z0eg6jN25gTtziNOg18ILcy0bdBGR_NNIS_Vub4obYop__vd/exec';
const DAY = 86400000;
export const normalizeEmail = value => String(value || '').trim().toLowerCase();
export const accountId = email => createHash('sha256').update(normalizeEmail(email)).digest('hex');
export function accessError(reason) { return Object.assign(new Error(reason), { reason }); }
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export const jakartaDate = value => new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 10);
const addDays = (date, days) => new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
export function stableDeviceId(value) {
  const id = String(value || '').trim().toLowerCase().split('||')[0].trim();
  const match = id.match(/hw_([a-f0-9]{6,16})/);
  return match ? `dev_${id.includes('mobile') || id.includes('handphone') ? 'mobile' : 'desktop'}_hw_${match[1]}` : id;
}
export function getStagingDb(env = process.env) {
  if (env.VITE_FIREBASE_PROJECT_ID !== PROJECT_ID) throw accessError('STAGING_CONFIG_REQUIRED');
  let credentials;
  try { credentials = JSON.parse(env.FIREBASE_ADMIN_SERVICE_ACCOUNT || ''); } catch { throw accessError('FIREBASE_ADMIN_CONFIG_REQUIRED'); }
  if (credentials.project_id !== PROJECT_ID || !credentials.client_email?.endsWith(`@${PROJECT_ID}.iam.gserviceaccount.com`)) {
    throw accessError('FIREBASE_ADMIN_CONFIG_REQUIRED');
  }
  // Billing documents never share the client-writable users collection.
  const name = 'au-staging-access';
  const app = getApps().find(item => item.name === name) || initializeApp({ credential: cert(credentials), projectId: PROJECT_ID }, name);
  return getFirestore(app);
}
export function accessView(account, now = Date.now()) {
  if (!account) return { success: true, accessGranted: false, reason: 'BUYER_NOT_FOUND', status: 'BUYER_NOT_FOUND', isRegisteredBuyer: false, isValid: false };
  if (!validDate(account.purchaseDate) || !validDate(account.expirationDate)) {
    return { success: true, accessGranted: false, isValid: false, isRegisteredBuyer: true, reason: 'INVALID_PURCHASE_DATA', status: 'INVALID_PURCHASE_DATA' };
  }
  const daysRemaining = Math.max(0, Math.round((Date.parse(account.expirationDate) - Date.parse(jakartaDate(now))) / DAY));
  const inactive = account.statusAccount === 'Inactive';
  const reason = inactive ? 'ACCOUNT_INACTIVE' : daysRemaining <= 0 ? 'ACCOUNT_EXPIRED' : 'ACCESS_GRANTED';
  return {
    success: true, accessGranted: reason === 'ACCESS_GRANTED', isValid: reason === 'ACCESS_GRANTED',
    reason, status: reason, statusAccount: inactive ? 'Inactive' : daysRemaining <= 0 ? 'Expired' : 'Active',
    isRegisteredBuyer: true, email: account.email, buyerName: account.buyerName || account.email.split('@')[0],
    purchaseDate: account.purchaseDate, expirationDate: account.expirationDate, daysRemaining,
    deviceHandphone: account.devices?.mobile?.label || null, deviceLaptop: account.devices?.desktop?.label || null,
    mobileDeviceId: account.devices?.mobile?.id || null, laptopDeviceId: account.devices?.desktop?.id || null,
    message: inactive ? 'Status akun tidak aktif.' : daysRemaining <= 0 ? 'Masa berlangganan Anda telah habis.' : 'Akses aktif.',
  };
}
export function createAccessStore(db, now = () => Date.now()) {
  const accounts = db.collection('billingAccounts');
  const purchases = db.collection('billingPurchases');
  const audit = db.collection('billingAdminAudit');
  async function getAccount(email) {
    const snapshot = await accounts.doc(accountId(email)).get();
    return snapshot.exists ? snapshot.data() : null;
  }
  async function ingest(purchase, importedAccount = null) {
    const email = normalizeEmail(purchase.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-zA-Z0-9_-]{1,200}$/.test(purchase.ref) ||
      !purchase.purchasedAt || Number.isNaN(Date.parse(purchase.purchasedAt)) || Date.parse(purchase.purchasedAt) > now() + 300000) throw accessError('INVALID_PURCHASE');
    if (new Date(purchase.purchasedAt).toISOString() !== purchase.purchasedAt ||
        (importedAccount && importedAccount.purchaseDate !== jakartaDate(purchase.purchasedAt))) throw accessError('INVALID_PURCHASE');
    const orderRef = purchases.doc(purchase.ref);
    const buyerRef = accounts.doc(accountId(email));
    return db.runTransaction(async tx => {
      const order = await tx.get(orderRef);
      const buyer = await tx.get(buyerRef);
      const previous = buyer.exists ? buyer.data() : null;
      if (order.exists) {
        const existing = order.data();
        if (existing.email !== email || existing.purchasedAt !== purchase.purchasedAt || existing.productId !== purchase.productId ||
            (existing.amount !== null && purchase.amount !== null && existing.amount !== purchase.amount)) throw accessError('TRANSACTION_CONFLICT');
        if (!previous) throw accessError('ACCOUNT_MISSING');
        return { duplicate: true, purchase: existing, account: previous };
      }
      if (importedAccount && previous) throw accessError('ACCOUNT_ALREADY_EXISTS');
      const purchaseDate = jakartaDate(purchase.purchasedAt);
      const timestamp = new Date(now()).toISOString();
      const record = { ...purchase, email, orderStatus: 'SUCCESS', createdAt: timestamp, reportPending: true };
      tx.set(orderRef, record);
      let account = previous;
      // Historical deliveries are retained, but cannot renew a newer subscription.
      if (!previous || purchase.purchasedAt > previous.purchasedAt) {
        account = {
          email, ref: purchase.ref, buyerName: purchase.name || previous?.buyerName || '',
          purchasedAt: purchase.purchasedAt, purchaseDate, expirationDate: addDays(purchaseDate, 30),
          statusAccount: previous?.statusAccount === 'Inactive' ? 'Inactive' : 'Active',
          devices: previous?.devices || { mobile: null, desktop: null },
          uid: previous?.uid || null, revision: (previous?.revision || 0) + 1,
          ...importedAccount, updatedAt: timestamp,
        };
        tx.set(buyerRef, account);
      }
      return { duplicate: false, purchase: record, account };
    });
  }
  async function validate(email, identity) {
    const ref = accounts.doc(accountId(email));
    return db.runTransaction(async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists) return accessView(null);
      const account = snapshot.data();
      const view = accessView(account, now());
      if (!view.accessGranted) return view;
      if (account.uid && account.uid !== identity.uid) throw accessError('ACCOUNT_IDENTITY_MISMATCH');
      // Device fields are legacy report data, not subscription access controls.
      const updated = { ...account, uid: identity.uid };
      if (!account.uid) {
        updated.revision += 1;
        updated.updatedAt = new Date(now()).toISOString();
        tx.set(ref, updated);
      }
      return accessView(updated, now());
    });
  }
  async function administer(command) {
    const ref = accounts.doc(accountId(command.email));
    if (!Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 1 ||
        !['Active', 'Inactive'].includes(command.statusAccount) || !validDate(command.expirationDate) ||
        ![null, 'mobile', 'desktop', 'all'].includes(command.resetDevice ?? null) ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(command.commandId || '')) throw accessError('INVALID_ADMIN_COMMAND');
    const auditRef = audit.doc(command.commandId);
    return db.runTransaction(async tx => {
      const accountSnapshot = await tx.get(ref);
      const receipt = await tx.get(auditRef);
      if (!accountSnapshot.exists) throw accessError('BUYER_NOT_FOUND');
      const account = accountSnapshot.data();
      const digest = createHash('sha256').update(JSON.stringify({ email: normalizeEmail(command.email), revision: command.expectedRevision,
        status: command.statusAccount, expiry: command.expirationDate, reset: command.resetDevice || null })).digest('hex');
      if (receipt.exists) {
        if (receipt.data().digest !== digest) throw accessError('ADMIN_COMMAND_CONFLICT');
        return account;
      }
      if (account.revision !== command.expectedRevision) throw accessError('STALE_ADMIN_REVISION');
      const devices = { ...account.devices };
      if (command.resetDevice === 'all' || command.resetDevice === 'mobile') devices.mobile = null;
      if (command.resetDevice === 'all' || command.resetDevice === 'desktop') devices.desktop = null;
      const updated = { ...account, statusAccount: command.statusAccount, expirationDate: command.expirationDate,
        devices, revision: account.revision + 1, updatedAt: new Date(now()).toISOString() };
      tx.set(ref, updated);
      tx.set(auditRef, { email: account.email, digest, before: account, after: updated, actor: command.actor || 'spreadsheet-admin', createdAt: updated.updatedAt });
      return updated;
    });
  }
  async function list(collection, cursor = '') {
    let query = db.collection(collection).orderBy(FieldPath.documentId()).limit(100);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    return { rows: snapshot.docs.map(doc => doc.data()), cursor: snapshot.docs.length === 100 ? snapshot.docs.at(-1).id : null };
  }
  return { ingest, getAccount, validate, administer, list,
    markReported: ref => purchases.doc(ref).update({ reportPending: false }),
  };
}
