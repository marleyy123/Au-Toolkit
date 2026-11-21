
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  createAccessStore,
  accountId,
} from "../lib/staging-access-store.js";
import { MIDTRANS_PLANS } from "../lib/midtrans-plans.js";

const TARGET = {
  projectId: "au-toolkit-production",
  email: "miratiarayulainisaleh@gmail.com",
  uid: "npiORd2pHtYHT8ACDHaCr6JnbUs2",
  orderId: "au_live_001c7caee0414cb49ba4f26569c9211c",
  transactionId: "59b1e4ea-4fd4-473d-8f12-7ac71df7bf13",
  amount: 180000,
  currency: "IDR",
  planId: "yearly",
  accessDays: 365,
};

const APPLY = process.argv.includes("--apply");

const fail = (message) => {
  throw new Error(message);
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function toJakartaIso(value) {
  if (!value) fail("MIDTRANS_SETTLEMENT_TIME_MISSING");

  const normalized = String(value).trim().replace(" ", "T");
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);

  const date = new Date(
    hasTimezone ? normalized : `${normalized}+07:00`,
  );

  if (Number.isNaN(date.getTime())) {
    fail("INVALID_SETTLEMENT_TIME");
  }

  return date.toISOString();
}

function getPurchaseDate(isoDate) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoDate));
}

async function verifyMidtrans() {
  const serverKey = String(
    process.env.MIDTRANS_SERVER_KEY ||
      process.env.VITE_MIDTRANS_SERVER_KEY ||
      "",
  ).trim();

  if (!/^Mid-server-[A-Za-z0-9.~_-]+$/.test(serverKey)) {
    fail("MIDTRANS_PRODUCTION_SERVER_KEY_INVALID");
  }

  const credentials = Buffer.from(`${serverKey}:`).toString("base64");

  const response = await fetch(
    `https://api.midtrans.com/v2/${TARGET.orderId}/status`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  console.log("MIDTRANS RESPONSE:", {
    order_id: data.order_id,
    transaction_id: data.transaction_id,
    transaction_status: data.transaction_status,
    fraud_status: data.fraud_status,
    gross_amount: data.gross_amount,
    currency: data.currency,
    status_code: data.status_code,
    settlement_time: data.settlement_time,
    transaction_time: data.transaction_time,
    customer_details: data.customer_details ?? null,
  });

  if (!response.ok) {
    fail(`MIDTRANS_API_ERROR: ${response.status}`);
  }

  if (data.order_id !== TARGET.orderId) {
    fail("ORDER_ID_MISMATCH");
  }

  if (data.transaction_id !== TARGET.transactionId) {
    fail("TRANSACTION_ID_MISMATCH");
  }

  if (data.transaction_status !== "settlement") {
    fail(`TRANSACTION_NOT_SETTLED: ${data.transaction_status}`);
  }

  if (data.fraud_status && data.fraud_status !== "accept") {
    fail(`FRAUD_STATUS_REJECTED: ${data.fraud_status}`);
  }

  if (Number(data.gross_amount) !== TARGET.amount) {
    fail("AMOUNT_MISMATCH");
  }

  if (data.currency !== TARGET.currency) {
    fail("CURRENCY_MISMATCH");
  }

  if (data.status_code !== "200") {
    fail(`MIDTRANS_STATUS_CODE_INVALID: ${data.status_code}`);
  }

  const providerEmail = normalizeEmail(data.customer_details?.email);

  if (providerEmail && providerEmail !== TARGET.email) {
    fail("MIDTRANS_EMAIL_MISMATCH");
  }

  if (!providerEmail) {
    console.warn(
      "[MIDTRANS] Email tidak tersedia di status API. " +
        "Menggunakan email yang telah diverifikasi dari dashboard transaksi.",
    );
  }

  return {
    transactionId: data.transaction_id,
    purchasedAt: toJakartaIso(data.settlement_time),
    settlementTime: data.settlement_time,
    status: data.transaction_status,
    amount: Number(data.gross_amount),
  };
}

async function main() {
  const serviceAccountPath = resolve(
    "secrets/firebase-new-admin.json",
  );

  const credentials = JSON.parse(
    readFileSync(serviceAccountPath, "utf8"),
  );

  if (credentials.project_id !== TARGET.projectId) {
    fail("FIREBASE_PROJECT_MISMATCH");
  }

  const appName = "au-toolkit-mirati-recovery";

  const app =
    getApps().find((item) => item.name === appName) ||
    initializeApp(
      {
        credential: cert(credentials),
        projectId: TARGET.projectId,
      },
      appName,
    );

  try {
    const db = getFirestore(app);
    const auth = getAuth(app);
    const store = createAccessStore(db);

    const accountRef = db
      .collection("billingAccounts")
      .doc(accountId(TARGET.email));

    const purchaseRef = db
      .collection("billingPurchases")
      .doc(TARGET.orderId);

    const internalOrderRef = db
      .collection("midtransOrders")
      .doc(TARGET.orderId);

    const lockId = createHash("sha256")
      .update(normalizeEmail(TARGET.email))
      .digest("hex");

    const lockRef = db
      .collection("midtransActiveOrders")
      .doc(lockId);

    // 1. Verifikasi identitas Firebase.
    const user = await auth.getUser(TARGET.uid);

    if (
      normalizeEmail(user.email) !== TARGET.email ||
      user.disabled ||
      !user.emailVerified
    ) {
      fail("FIREBASE_AUTH_IDENTITY_INVALID");
    }

    // 2. Verifikasi konfigurasi paket.
    const plan = MIDTRANS_PLANS.find(
      (item) => item.id === TARGET.planId,
    );

    if (
      !plan ||
      plan.accessDays !== TARGET.accessDays ||
      plan.domesticAmount !== TARGET.amount
    ) {
      fail("YEARLY_PLAN_CONFIG_MISMATCH");
    }

    // 3. Verifikasi pembayaran langsung ke Midtrans.
    const payment = await verifyMidtrans();

    const purchaseDate = getPurchaseDate(payment.purchasedAt);

    // 4. Baca seluruh dokumen sebelum recovery.
    const [
      accountSnap,
      purchaseSnap,
      internalOrderSnap,
      lockSnap,
    ] = await Promise.all([
      accountRef.get(),
      purchaseRef.get(),
      internalOrderRef.get(),
      lockRef.get(),
    ]);

    // Recovery ini hanya untuk transaksi yang belum masuk billing.
    if (accountSnap.exists) {
      fail("ACCOUNT_ALREADY_EXISTS_STOP_AND_INSPECT");
    }

    if (purchaseSnap.exists) {
      fail("PURCHASE_ALREADY_EXISTS_STOP_AND_INSPECT");
    }

    if (!internalOrderSnap.exists) {
      fail("INTERNAL_MIDTRANS_ORDER_NOT_FOUND");
    }

    if (!lockSnap.exists) {
      fail("ACTIVE_ORDER_LOCK_NOT_FOUND");
    }

    const internalOrder = internalOrderSnap.data();
    const lock = lockSnap.data();

    if (
      internalOrder.orderId !== TARGET.orderId ||
      internalOrder.email !== TARGET.email ||
      internalOrder.uid !== TARGET.uid ||
      internalOrder.planId !== TARGET.planId ||
      internalOrder.amount !== TARGET.amount ||
      internalOrder.accessDays !== TARGET.accessDays ||
      !["pending", "paid"].includes(internalOrder.state)
    ) {
      fail("INTERNAL_ORDER_DATA_MISMATCH");
    }

    if (
      lock.email !== TARGET.email ||
      lock.orderId !== TARGET.orderId ||
      lock.reservationId !== internalOrder.reservationId ||
      !["active", "paid"].includes(lock.state)
    ) {
      fail("ACTIVE_ORDER_LOCK_MISMATCH");
    }

    // 5. Siapkan data pembelian.
    const purchase = {
      ref: TARGET.orderId,
      email: TARGET.email,
      name: "",
      productId: "midtrans-yearly",
      planId: TARGET.planId,
      accessDays: TARGET.accessDays,
      amount: TARGET.amount,
      currency: TARGET.currency,
      quantity: 1,
      transactionId: payment.transactionId,
      purchasedAt: payment.purchasedAt,
      source: "midtrans-production",
    };

    console.log("\n=== RECOVERY INSPECTION ===");

    console.log({
      projectId: TARGET.projectId,
      email: TARGET.email,
      uid: TARGET.uid,
      orderId: TARGET.orderId,
      transactionId: payment.transactionId,
      paymentStatus: payment.status,
      amount: payment.amount,
      planId: TARGET.planId,
      accessDays: TARGET.accessDays,
      purchasedAt: payment.purchasedAt,
      purchaseDate,
      mode: APPLY ? "APPLY" : "DRY RUN",
    });

    if (!APPLY) {
      console.log("\nDRY RUN OK. Belum ada dokumen yang diubah.");
      console.log("Gunakan --apply setelah hasil diperiksa.");
      return;
    }

    // 6. Buat billing account, purchase, dan workspace access.
    const result = await store.ingest(
      purchase,
      {
        uid: TARGET.uid,
        purchaseDate,
      },
      {
        reactivateInactive: true,
      },
    );

    if (!result.account || result.account.uid !== TARGET.uid) {
      fail("RECOVERY_RESULT_UID_MISMATCH");
    }

    // 7. Ubah status internal order dan lock menjadi paid.
    await db.runTransaction(async (tx) => {
      const [orderSnap, currentLockSnap] = await Promise.all([
        tx.get(internalOrderRef),
        tx.get(lockRef),
      ]);

      if (!orderSnap.exists || !currentLockSnap.exists) {
        fail("ORDER_OR_LOCK_NOT_FOUND_DURING_FINALIZATION");
      }

      const order = orderSnap.data();
      const currentLock = currentLockSnap.data();

      if (
        order.orderId !== TARGET.orderId ||
        order.email !== TARGET.email ||
        order.uid !== TARGET.uid ||
        order.planId !== TARGET.planId ||
        order.amount !== TARGET.amount ||
        order.accessDays !== TARGET.accessDays ||
        !["pending", "paid"].includes(order.state)
      ) {
        fail("ORDER_CHANGED_OR_MISMATCHED");
      }

      if (
        currentLock.email !== TARGET.email ||
        currentLock.orderId !== TARGET.orderId ||
        currentLock.reservationId !== order.reservationId ||
        !["active", "paid"].includes(currentLock.state)
      ) {
        fail("ACTIVE_ORDER_LOCK_MISMATCHED");
      }

      const now = new Date().toISOString();

      tx.update(internalOrderRef, {
        state: "paid",
        transactionId: payment.transactionId,
        settlementTime: payment.settlementTime,
        purchasedAt: payment.purchasedAt,
        updatedAt: now,
      });

      tx.update(lockRef, {
        state: "paid",
        updatedAt: now,
      });
    });

    // 8. Verifikasi seluruh dokumen setelah recovery.
    const [
      finalAccount,
      finalPurchase,
      finalWorkspace,
      finalOrder,
      finalLock,
    ] = await Promise.all([
      accountRef.get(),
      purchaseRef.get(),
      db.collection("workspaceAccess").doc(TARGET.uid).get(),
      internalOrderRef.get(),
      lockRef.get(),
    ]);

    if (
      !finalAccount.exists ||
      !finalPurchase.exists ||
      !finalWorkspace.exists ||
      !finalOrder.exists ||
      !finalLock.exists
    ) {
      fail("RECOVERY_POST_WRITE_DOCUMENT_MISSING");
    }

    const account = finalAccount.data();
    const savedPurchase = finalPurchase.data();
    const workspace = finalWorkspace.data();
    const savedOrder = finalOrder.data();
    const savedLock = finalLock.data();

    if (
      account.uid !== TARGET.uid ||
      normalizeEmail(account.email) !== TARGET.email ||
      account.planId !== TARGET.planId ||
      savedPurchase.ref !== TARGET.orderId ||
      savedPurchase.transactionId !== TARGET.transactionId ||
      savedOrder.state !== "paid" ||
      savedOrder.transactionId !== TARGET.transactionId ||
      savedLock.state !== "paid" ||
      savedLock.orderId !== TARGET.orderId ||
      workspace.email !== TARGET.email ||
      workspace.active !== true
    ) {
      fail("RECOVERY_POST_WRITE_DATA_MISMATCH");
    }

    console.log("\n=== RECOVERY SUCCESS ===");

    console.log({
      billingAccount: {
        exists: finalAccount.exists,
        uid: account.uid,
        status: account.statusAccount,
        purchaseDate: account.purchaseDate,
        expirationDate: account.expirationDate,
        revision: account.revision,
      },
      billingPurchase: {
        exists: finalPurchase.exists,
        ref: savedPurchase.ref,
        transactionId: savedPurchase.transactionId,
        source: savedPurchase.source,
        status: savedPurchase.orderStatus,
      },
      workspaceAccess: {
        exists: finalWorkspace.exists,
        email: workspace.email,
        active: workspace.active,
        expiresAtMs: workspace.expiresAtMs,
      },
      midtransOrder: {
        state: savedOrder.state,
        transactionId: savedOrder.transactionId,
      },
      activeOrderLock: {
        state: savedLock.state,
        orderId: savedLock.orderId,
      },
    });
  } finally {
    await app.delete();
  }
}

main().catch((error) => {
  console.error("\nRECOVERY STOPPED:", error.message);
  process.exitCode = 1;
});
