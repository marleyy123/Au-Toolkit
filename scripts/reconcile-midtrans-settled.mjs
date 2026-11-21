import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createAccessStore, accountId, jakartaDate } from "../lib/staging-access-store.js";

const PROJECT_ID = "au-toolkit-production";
const APPLY = process.argv.includes("--apply");

const serviceAccountPath = resolve("secrets/firebase-new-admin.json");
const credentials = JSON.parse(await readFile(serviceAccountPath, "utf8"));

if (credentials.project_id !== PROJECT_ID) {
  throw new Error(`Project mismatch! Expected ${PROJECT_ID}, got ${credentials.project_id}`);
}

const app = getApps()[0] ?? initializeApp({ credential: cert(credentials) });
const auth = getAuth(app);
const db = getFirestore(app);
const store = createAccessStore(db);

const key = process.env.MIDTRANS_SERVER_KEY || (() => { throw new Error("MIDTRANS_SERVER_KEY env var is required"); })();
const basicAuth = Buffer.from(key + ":").toString("base64");

async function main() {
  console.log(`[RECONCILE] Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log("[RECONCILE] Querying pending midtransOrders...");

  const snap = await db.collection("midtransOrders").where("state", "==", "pending").get();
  console.log(`[RECONCILE] Found ${snap.size} pending orders to check.`);

  const reconciled = [];

  for (const doc of snap.docs) {
    const order = doc.data();
    const orderId = doc.id;

    try {
      const res = await fetch(`https://api.midtrans.com/v2/${orderId}/status`, {
        headers: { Authorization: `Basic ${basicAuth}` },
      });
      if (!res.ok) continue;
      const mid = await res.json();

      if (mid.transaction_status === "settlement" || mid.transaction_status === "capture") {
        let authUser = null;
        try {
          authUser = await auth.getUserByEmail(order.email);
        } catch (e) {
          if (e.code !== "auth/user-not-found") throw e;
        }

        const uid = authUser?.uid || order.uid || null;
        const settlementIso = mid.settlement_time
          ? new Date(mid.settlement_time.replace(" ", "T") + "+07:00").toISOString()
          : new Date().toISOString();

        console.log(`[RECONCILE] Settled order found: ${orderId} (${order.email}) amount: ${order.amount} uid: ${uid || "none"}`);

        if (APPLY) {
          // 1. Ingest purchase
          const purchaseDate = jakartaDate(settlementIso);
          await store.ingest(
            {
              ref: order.orderId,
              email: order.email,
              name: "",
              productId: "midtrans-" + order.planId,
              planId: order.planId,
              accessDays: order.accessDays || (order.planId === "yearly" ? 365 : 30),
              amount: order.amount,
              currency: "IDR",
              quantity: 1,
              purchasedAt: settlementIso,
              source: "midtrans-production",
            },
            uid ? { uid, purchaseDate } : null,
            { reactivateInactive: true }
          );

          // 2. Update midtransOrders
          await doc.ref.update({
            state: "paid",
            transactionId: mid.transaction_id || order.transactionId,
            transactionTime: mid.transaction_time || null,
            settlementTime: mid.settlement_time || null,
            purchasedAt: settlementIso,
            updatedAt: new Date().toISOString(),
          });

          // 3. Release lock
          const lockRef = db.collection("midtransActiveOrders").doc(accountId(order.email));
          await lockRef.delete().catch(() => {});

          // 4. Update workspaceAccess if UID exists
          if (uid) {
            const acc = await store.getAccount(order.email);
            if (acc && acc.expirationDate) {
              const expiresAtMs = Date.parse(`${acc.expirationDate}T23:59:59+07:00`);
              await db.collection("workspaceAccess").doc(uid).set({
                email: order.email,
                active: true,
                expiresAtMs,
              }, { merge: true });
            }
          }
        }

        reconciled.push({
          orderId,
          email: order.email,
          amount: order.amount,
          uid,
        });
      }
    } catch (err) {
      console.error(`[RECONCILE] Error checking ${orderId}:`, err.message);
    }
  }

  console.log("\n================ RECONCILIATION SUMMARY ================");
  console.log(`Total checked    : ${snap.size}`);
  console.log(`Settled & handled: ${reconciled.length}`);
  console.log(`Mode             : ${APPLY ? "APPLIED" : "DRY RUN"}`);
  console.log("========================================================");
}

main().catch((err) => {
  console.error("RECONCILIATION FAILED:", err);
  process.exit(1);
});
