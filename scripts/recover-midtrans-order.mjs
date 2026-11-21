import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createAccessStore, accountId } from "../lib/staging-access-store.js";
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
  const date = new Date(hasTimezone ? normalized : `${normalized}+07:00`);

  if (Number.isNaN(date.getTime())) {
    fail("INVALID_SETTLEMENT_TIME");
  }

  return date.toISOString();
}

async function verifyMidtrans() {
  const serverKey = String(process.env.MIDTRANS_SERVER_KEY ||
    process.env.VITE_MIDTRANS_SERVER_KEY || "").trim();

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

  const providerEmail = normalizeEmail(data.customer_details?.email);

if (providerEmail && providerEmail !== TARGET.email) {
  fail("MIDTRANS_EMAIL_MISMATCH");
}

if (!providerEmail) {
  console.warn(
    "[MIDTRANS] Email tidak tersedia di status API. " +
    "Menggunakan email yang telah diverifikasi dari dashboard transaksi."
  );
}

  if (providerEmail && providerEmail !== TARGET.email) {
  fail("MIDTRANS_EMAIL_MISMATCH");
}

if (!providerEmail) {
  console.warn(
    "[MIDTRANS] Email tidak tersedia di status API. " +
    "Menggunakan email yang telah diverifikasi dari dashboard transaksi."
  );
}

  if (data.status_code !== "200") {
    fail(`MIDTRANS_STATUS_CODE_INVALID: ${data.status_code}`);
  }

  return {
    transactionId: data.transaction_id,
    purchasedAt: toJakartaIso(data.settlement_time),
    status: data.transaction_status,
    amount: Number(data.gross_amount),
    email: TARGET.email,
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

    // Pastikan identitas Firebase masih cocok.
    const user = await auth.getUser(TARGET.uid);

    if (
      normalizeEmail(user.email) !== TARGET.email ||
      user.disabled ||
      !user.emailVerified
    ) {
      fail("FIREBASE_AUTH_IDENTITY_INVALID");
    }

    const plan = MIDTRANS_PLANS.find(
      (item) => item.id === TARGET.planId,
    );

    if (
      !plan ||
      plan.accessDays !== 365 ||
      plan.domesticAmount !== TARGET.amount
    ) {
      fail("YEARLY_PLAN_CONFIG_MISMATCH");
    }

    // Verifikasi transaksi langsung ke Midtrans Production.
    const payment = await verifyMidtrans();

    // Periksa dokumen terkait sebelum melakukan perubahan.
    const accountRef = db.collection("billingAccounts").doc(
      accountId(TARGET.email),
    );
    const purchaseRef = db.collection("billingPurchases").doc(
      TARGET.orderId,
    );
    const internalOrderRef = db.collection("midtransOrders").doc(
      TARGET.orderId,
    );

    const [accountSnap, purchaseSnap, internalOrderSnap] =
      await Promise.all([
        accountRef.get(),
        purchaseRef.get(),
        internalOrderRef.get(),
      ]);

    if (accountSnap.exists) {
      fail("ACCOUNT_ALREADY_EXISTS_STOP_AND_INSPECT");
    }

    if (purchaseSnap.exists) {
      fail("PURCHASE_ALREADY_EXISTS_STOP_AND_INSPECT");
    }

    // Jika order internal ada, jangan melewati alur status order yang ada.
    if (internalOrderSnap.exists) {
      fail("INTERNAL_MIDTRANS_ORDER_EXISTS_STOP_AND_INSPECT");
    }

    const purchaseDate = new Date(
      new Date(payment.purchasedAt).getTime() + 7 * 3600000,
    ).toISOString().slice(0, 10);

    const purchase = {
      ref: TARGET.orderId,
      email: TARGET.email,
      name: "",
      productId: "midtrans-yearly",
      planId: "yearly",
      accessDays: 365,
      amount: TARGET.amount,
      currency: "IDR",
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
      accessDays: plan.accessDays,
      purchasedAt: payment.purchasedAt,
      purchaseDate,
      expirationDate: new Date(
        Date.parse(purchaseDate) + 365 * 86400000,
      ).toISOString().slice(0, 10),
      mode: APPLY ? "APPLY" : "DRY RUN",
    });

    if (!APPLY) {
      console.log("\nDRY RUN OK. Belum ada dokumen yang diubah.");
      console.log("Periksa hasil di atas sebelum menjalankan --apply.");
      return;
    }

    // UID dan purchaseDate dimasukkan dalam transaksi yang sama.
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

    // Verifikasi ulang ketiga dokumen setelah transaksi.
    const [finalAccount, finalPurchase, finalWorkspace] =
      await Promise.all([
        accountRef.get(),
        purchaseRef.get(),
        db.collection("workspaceAccess").doc(TARGET.uid).get(),
      ]);

    if (
      !finalAccount.exists ||
      !finalPurchase.exists ||
      !finalWorkspace.exists
    ) {
      fail("RECOVERY_POST_WRITE_VERIFICATION_FAILED");
    }

    const account = finalAccount.data();
    const savedPurchase = finalPurchase.data();
    const workspace = finalWorkspace.data();

    if (
      account.uid !== TARGET.uid ||
      account.email !== TARGET.email ||
      account.planId !== "yearly" ||
      savedPurchase.ref !== TARGET.orderId ||
      savedPurchase.transactionId !== TARGET.transactionId ||
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
    });
  } finally {
    await app.delete();
  }
}

main().catch((error) => {
  console.error("\nRECOVERY STOPPED:", error.message);
  process.exitCode = 1;
});