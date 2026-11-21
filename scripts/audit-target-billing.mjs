
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import {
  createAccessStore,
  accountId,
  accessView,
  validDate,
} from "../lib/staging-access-store.js";

const credentials = JSON.parse(
  readFileSync("secrets/firebase-new-admin.json", "utf8")
);

if (credentials.project_id !== "au-toolkit-production") {
  throw new Error("Firebase project bukan au-toolkit-production");
}

const app = initializeApp(
  {
    credential: cert(credentials),
    projectId: credentials.project_id,
  },
  "audit-target-billing"
);

const db = getFirestore(app, "(default)");
const auth = getAuth(app);
const store = createAccessStore(db);

const emails = [
  "rnaurasalwa@gmail.com",
  "esagbrnmh@gmail.com",
  "ismirahmawati10@gmail.com",
  "kalamenepi@gmail.com",
  "serlinda602@gmail.com",
  "habibahmufidah5@gmail.com",
  "fanirevianita284@gmail.com",
  "demistyrose@gmail.com",
  "azifahss18@gmail.com",
  "teehsysy@gmail.com",
  "nazwahfitrinurhakim9@gmail.com",
  "cleverse12@gmail.com",
  "onlycha2005@gmail.com",
  "finailatulizzah11@gmail.com",
  "miratiarayulainisaleh@gmail.com",
  "salfahsaa@gmail.com",
];

for (const email of emails) {
  try {
    const [account, user] = await Promise.all([
      store.getAccount(email),
      auth.getUserByEmail(email).catch(() => null),
    ]);

    const devices = account?.devices || {};
    const activeDevices = Object.entries(devices)
      .filter(([, device]) => device?.id)
      .map(([slot, device]) => ({
        slot,
        type: device.type || null,
        label: device.label || null,
        hasId: Boolean(device.id),
        lastLoginAt: device.lastLoginAt || null,
      }));

    const result = {
      email,
      authFound: Boolean(user),
      authUid: user?.uid || null,
      emailVerified: user?.emailVerified ?? null,
      accountFound: Boolean(account),
      documentId: account ? accountId(email) : null,
      accountUid: account?.uid || null,
      uidMatches: account && user
        ? account.uid === user.uid
        : null,
      statusAccount: account?.statusAccount || null,
      purchaseDate: account?.purchaseDate || null,
      expirationDate: account?.expirationDate || null,
      purchaseDateValid: account
        ? validDate(account.purchaseDate)
        : null,
      expirationDateValid: account
        ? validDate(account.expirationDate)
        : null,
      accessReason: account
        ? accessView(account).reason
        : "BUYER_NOT_FOUND",
      deviceCount: activeDevices.length,
      devices: activeDevices,
      revision: account?.revision ?? null,
      workspaceGrantVersion: account?.workspaceGrantVersion ?? null,
    };

    console.log(JSON.stringify(result));
  } catch (error) {
    console.log(JSON.stringify({
      email,
      auditError: error.message,
    }));
  }
}

process.exitCode = 0;
