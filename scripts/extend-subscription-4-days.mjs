/**
 * Compensation script: extend all accounts by +4 days.
 *
 * Scope:
 *   - statusAccount === 'Active'  → expirationDate + 4 days
 *   - statusAccount === 'Expired' AND expired during maintenance window (Nov 18–21)
 *     → re-activated, expirationDate = original expiry + 4 days
 *
 * Updates:
 *   - billingAccounts/{docId}.expirationDate, statusAccount (if re-activating)
 *   - workspaceAccess/{uid}.expiresAtMs, active (if re-activating)
 *
 * Usage:
 *   node scripts/extend-subscription-4-days.mjs          # dry run
 *   node scripts/extend-subscription-4-days.mjs --apply  # live write
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const DAYS  = 4;
const MAINTENANCE_START = new Date('2026-11-18T00:00:00+07:00');
const MAINTENANCE_END   = new Date('2026-11-21T23:59:59+07:00');

// ── Firebase init ──────────────────────────────────────────────────────────
const PROJECT_ID  = 'au-toolkit-production';
const credPath    = resolve('secrets/firebase-new-admin.json');
const credentials = JSON.parse(await readFile(credPath, 'utf8'));
if (credentials.project_id !== PROJECT_ID) {
  throw new Error(`Project mismatch! Expected ${PROJECT_ID}, got ${credentials.project_id}`);
}
const app = getApps()[0] ?? initializeApp({ credential: cert(credentials) });
const db  = getFirestore(app);

// ── Helpers ────────────────────────────────────────────────────────────────
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00+07:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD in UTC — close enough for +7
}

function dateStrToMidnightWibMs(dateStr) {
  return new Date(dateStr + 'T00:00:00+07:00').getTime();
}

function isInMaintenanceWindow(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00+07:00');
  return d >= MAINTENANCE_START && d <= MAINTENANCE_END;
}

// ── Main ───────────────────────────────────────────────────────────────────
console.log(`\n========================================`);
console.log(`  COMPENSATION +${DAYS} DAYS`);
console.log(`  Mode: ${APPLY ? '⚠️  APPLY (LIVE WRITE)' : '🔍 DRY RUN'}`);
console.log(`========================================\n`);

const billingSnap = await db.collection('billingAccounts').get();
console.log(`Total billingAccounts: ${billingSnap.size}\n`);

const toUpdate = [];
const skipped  = [];

for (const doc of billingSnap.docs) {
  const data   = doc.data();
  const docId  = doc.id;
  const uid    = data.uid || '';
  const status = data.statusAccount || '';
  const expiry = data.expirationDate || '';

  const isActive             = status === 'Active';
  const isExpiredMaintenance = status === 'Expired' && isInMaintenanceWindow(expiry);

  if (!isActive && !isExpiredMaintenance) {
    skipped.push({ email: data.email, status, expiry, reason: status === 'Expired' ? 'expired before maintenance' : `unknown status: ${status}` });
    continue;
  }

  if (!uid) {
    skipped.push({ email: data.email, status, expiry, reason: 'no uid — cannot update workspaceAccess' });
    continue;
  }

  const newExpiry   = addDays(expiry, DAYS);
  const newExpiryMs = dateStrToMidnightWibMs(newExpiry);

  toUpdate.push({
    docId, uid,
    email:      data.email || docId,
    status,
    oldExpiry:  expiry,
    newExpiry,
    newExpiryMs,
    wasExpired: isExpiredMaintenance,
  });
}

// ── Print plan ─────────────────────────────────────────────────────────────
const activeCount  = toUpdate.filter(r => !r.wasExpired).length;
const expiredCount = toUpdate.filter(r =>  r.wasExpired).length;

console.log(`📋 ACCOUNTS TO UPDATE : ${toUpdate.length}`);
console.log(`  ├─ Active (extend)         : ${activeCount}`);
console.log(`  └─ Expired during maint.   : ${expiredCount}`);
console.log(`⏭️  SKIPPED (not in scope)   : ${skipped.length}\n`);

console.log('─── Preview (first 25) ────────────────────────────────────────────');
toUpdate.slice(0, 25).forEach(r => {
  const tag = r.wasExpired ? '[RE-ACTIVATE]' : '[EXTEND]     ';
  console.log(`${tag} ${r.email.padEnd(40)} ${r.oldExpiry} → ${r.newExpiry}`);
});
if (toUpdate.length > 25) console.log(`... and ${toUpdate.length - 25} more`);
console.log('────────────────────────────────────────────────────────────────────\n');

if (!APPLY) {
  console.log('✅ DRY RUN complete. No data written.');
  console.log('   Run with --apply to execute.\n');
  process.exit(0);
}

// ── Live write in batches of 400 ops (200 billing + 200 workspace = 400 ops) ──
console.log('🚀 Writing to Firestore...\n');

const CHUNK = 200; // 200 accounts = 400 Firestore ops (2 per account), safely under 500 limit
let updated = 0;
let errors  = 0;

for (let i = 0; i < toUpdate.length; i += CHUNK) {
  const chunk = toUpdate.slice(i, i + CHUNK);
  const batch = db.batch();

  for (const r of chunk) {
    // 1. billingAccounts/{docId}
    const billingRef = db.collection('billingAccounts').doc(r.docId);
    const billingUpdate = {
      expirationDate: r.newExpiry,
      updatedAt: Timestamp.now(),
    };
    if (r.wasExpired) {
      billingUpdate.statusAccount = 'Active';
    }
    batch.set(billingRef, billingUpdate, { merge: true });

    // 2. workspaceAccess/{uid}
    const wsRef = db.collection('workspaceAccess').doc(r.uid);
    const wsUpdate = {
      expiresAtMs: r.newExpiryMs,
      email: r.email,
    };
    if (r.wasExpired) {
      wsUpdate.active = true;
    }
    batch.set(wsRef, wsUpdate, { merge: true });
  }

  try {
    await batch.commit();
    updated += chunk.length;
    console.log(`  ✅ Batch ${Math.ceil((i + 1) / CHUNK)}: ${chunk.length} accounts → total ${updated}`);
  } catch (err) {
    errors++;
    console.error(`  ❌ Batch ${Math.ceil((i + 1) / CHUNK)} error:`, err.message);
  }
}

console.log(`\n========================================`);
console.log(`  DONE`);
console.log(`  Updated  : ${updated} accounts`);
console.log(`  Errors   : ${errors}`);
console.log(`========================================\n`);
