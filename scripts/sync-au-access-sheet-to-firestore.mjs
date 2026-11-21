import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { accountId } from "../lib/staging-access-store.js";

const PROJECT_ID = "au-toolkit-production";
const SHEET_ID = "1B0lN8Cfn7-Tev81vSRsGS7OWeAtaWpoGrcmG7A6-FoQ";
const APPLY = process.argv.includes("--apply");

const serviceAccountPath = resolve("secrets/firebase-new-admin.json");
const credentials = JSON.parse(await readFile(serviceAccountPath, "utf8"));

if (credentials.project_id !== PROJECT_ID) {
  throw new Error(`Project mismatch! Expected ${PROJECT_ID}, got ${credentials.project_id}`);
}

const app = getApps()[0] ?? initializeApp({ credential: cert(credentials) });
const auth = getAuth(app);
const db = getFirestore(app);

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseDmy(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  return `${year}-${month}-${day}`;
}

function parsePurchaseIso(dateStr) {
  if (!dateStr) return new Date().toISOString();
  // e.g. "08-11-2026 11:33"
  const match = dateStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!match) return new Date().toISOString();
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  const hours = match[4] ? match[4].padStart(2, "0") : "00";
  const minutes = match[5] ? match[5].padStart(2, "0") : "00";
  const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00+07:00`);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function fetchSheetCsv() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet CSV: ${res.status}`);
  }
  return await res.text();
}

async function main() {
  console.log(`[SYNC] Mode: ${APPLY ? "APPLY (WRITING TO FIRESTORE)" : "DRY RUN (READ ONLY)"}`);
  console.log(`[SYNC] Fetching AU Access sheet CSV (${SHEET_ID})...`);

  const csv = await fetchSheetCsv();
  const lines = csv.split("\n").filter(Boolean);

  console.log(`[SYNC] Total lines in sheet: ${lines.length}`);

  // Headers: Buyer Email,Ref,Buyer Name,Purchase Date,AU Expiration Date,AU Status Account,AU Device Handphone,AU Device Laptop,Mobile Device ID,Laptop Device ID,Transaction Source,Jalur Pembelian
  const buyersMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const email = normalizeEmail(cols[0]);
    if (!email || !email.includes("@")) continue;

    const ref = cols[1] || "";
    const name = cols[2] || "";
    const purchaseDateRaw = cols[3] || "";
    const expDateRaw = cols[4] || "";
    const statusAccount = cols[5] === "Inactive" ? "Inactive" : cols[5] === "Expired" ? "Expired" : "Active";
    const devPhoneLabel = cols[6] || "";
    const devLaptopLabel = cols[7] || "";
    const mobileId = cols[8] || "";
    const laptopId = cols[9] || "";
    const source = cols[10] || "";
    const path = cols[11] || "";

    const expYmd = parseDmy(expDateRaw);
    const purchaseYmd = parseDmy(purchaseDateRaw);
    const purchaseIso = parsePurchaseIso(purchaseDateRaw);

    const candidate = {
      email,
      ref,
      name,
      purchaseDateRaw,
      purchaseYmd: purchaseYmd || "2026-10-01",
      purchaseIso,
      expDateRaw,
      expYmd: expYmd || "2026-11-01",
      statusAccount,
      devPhoneLabel,
      devLaptopLabel,
      mobileId,
      laptopId,
      source,
      path,
    };

    const existing = buyersMap.get(email);
    if (!existing) {
      buyersMap.set(email, candidate);
    } else {
      // Pick the row with latest expiration date, or Active over Expired
      const isCandidateActive = candidate.statusAccount === "Active";
      const isExistingActive = existing.statusAccount === "Active";

      if (isCandidateActive && !isExistingActive) {
        buyersMap.set(email, candidate);
      } else if (candidate.expYmd > existing.expYmd) {
        buyersMap.set(email, candidate);
      }
    }
  }

  console.log(`[SYNC] Total unique buyers to evaluate: ${buyersMap.size}`);

  let written = 0;
  let skipped = 0;
  let preservedExisting = 0;
  const todayYmd = "2026-11-22";

  for (const [email, buyer] of buyersMap.entries()) {
    const accId = accountId(email);
    const accountRef = db.collection("billingAccounts").doc(accId);
    const accountSnap = await accountRef.get();

    if (accountSnap.exists) {
      const existingData = accountSnap.data();
      // If existing account is already active with equal or later expiry, preserve it!
      if (
        existingData.statusAccount === "Active" &&
        existingData.expirationDate >= buyer.expYmd
      ) {
        preservedExisting++;
        continue;
      }
    }

    // Lookup Firebase Auth UID if exists
    let authUser = null;
    try {
      authUser = await auth.getUserByEmail(email);
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
    }

    const uid = authUser?.uid || accountSnap.data()?.uid || null;

    // Check if subscription is active
    const isActive = buyer.statusAccount === "Active" && buyer.expYmd >= todayYmd;
    const finalStatus = isActive ? "Active" : "Expired";

    const devices = {
      mobile: buyer.mobileId
        ? {
            id: buyer.mobileId,
            label: buyer.devPhoneLabel || "Mobile Device",
            type: "mobile",
            lastLoginAt: new Date().toISOString(),
          }
        : null,
      desktop: buyer.laptopId
        ? {
            id: buyer.laptopId,
            label: buyer.devLaptopLabel || "Desktop Device",
            type: "desktop",
            lastLoginAt: new Date().toISOString(),
          }
        : null,
    };

    const accountData = {
      email,
      ref: buyer.ref || `lynk_import_${accId.slice(0, 16)}`,
      buyerName: buyer.name,
      purchasedAt: buyer.purchaseIso,
      purchaseDate: buyer.purchaseYmd,
      expirationDate: buyer.expYmd,
      planId: "monthly",
      accessDays: 30,
      statusAccount: finalStatus,
      devices,
      uid,
      revision: (accountSnap.data()?.revision || 0) + 1,
      updatedAt: new Date().toISOString(),
      workspaceGrantVersion: 1,
    };

    const purchaseRef = db.collection("billingPurchases").doc(accountData.ref);

    const purchaseData = {
      ref: accountData.ref,
      email,
      name: buyer.name,
      productId: "lynk-monthly",
      planId: "monthly",
      accessDays: 30,
      amount: 15000,
      currency: "IDR",
      quantity: 1,
      purchasedAt: buyer.purchaseIso,
      source: "lynk-import",
      orderStatus: "SUCCESS",
      createdAt: new Date().toISOString(),
    };

    if (APPLY) {
      await accountRef.set(accountData, { merge: true });
      await purchaseRef.set(purchaseData, { merge: true });

      if (uid && isActive) {
        const expiresAtMs = Date.parse(`${buyer.expYmd}T23:59:59+07:00`);
        await db.collection("workspaceAccess").doc(uid).set({
          email,
          active: true,
          expiresAtMs,
        }, { merge: true });
      }
    }

    written++;
    if (written <= 10 || written % 50 === 0) {
      console.log(`[SYNC] ${APPLY ? "WROTE" : "PLAN"}: ${email} -> ${finalStatus} (expires: ${buyer.expYmd}, uid: ${uid || "none"})`);
    }
  }

  console.log("\n================ SYNC SUMMARY ================");
  console.log(`Total buyers in sheet    : ${buyersMap.size}`);
  console.log(`Accounts processed       : ${written}`);
  console.log(`Existing newer preserved : ${preservedExisting}`);
  console.log(`Mode                     : ${APPLY ? "APPLIED" : "DRY RUN"}`);
  console.log("==============================================");
}

main().catch((err) => {
  console.error("SYNC FAILED:", err);
  process.exit(1);
});
