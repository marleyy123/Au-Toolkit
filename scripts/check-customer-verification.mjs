
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "../secrets/firebase-new-admin.json" with { type: "json" };

const PROJECT_ID = "au-toolkit-production";

const emails = [
  "rnaurasalwa@gmail.com",
  "esagbrnmh@gmail.com",
  "ismirahmawati10@gmail.com",
  "kalamenepi@gmail.com",
  "serlinda602@gmail.com",
  "rnaurasalwa@gmail.com",
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

if (serviceAccount.project_id !== PROJECT_ID) {
  throw new Error(
    `Project mismatch! Expected ${PROJECT_ID}, got ${serviceAccount.project_id}`
  );
}

const app =
  getApps()[0] ??
  initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth(app);

const uniqueEmails = [...new Set(emails)];

console.log(`Firebase Project: ${PROJECT_ID}`);
console.log(`Total entries: ${emails.length}`);
console.log(`Unique emails: ${uniqueEmails.length}`);
console.log("\nChecking customer verification...\n");

const results = [];

for (const email of uniqueEmails) {
  try {
    const user = await auth.getUserByEmail(email);

    results.push({
      email,
      uid: user.uid,
      verified: user.emailVerified ? "YES" : "NO",
      status: user.emailVerified
        ? "VERIFIED"
        : "NOT VERIFIED",
    });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      results.push({
        email,
        uid: "-",
        verified: "-",
        status: "USER NOT FOUND",
      });
    } else {
      results.push({
        email,
        uid: "-",
        verified: "-",
        status: `ERROR: ${error.code || error.message}`,
      });
    }
  }
}

console.table(results);

const verified = results.filter(
  (item) => item.status === "VERIFIED"
).length;

const notVerified = results.filter(
  (item) => item.status === "NOT VERIFIED"
).length;

const notFound = results.filter(
  (item) => item.status === "USER NOT FOUND"
).length;

const errors = results.filter(
  (item) => item.status.startsWith("ERROR:")
).length;

console.log("\n========== SUMMARY ==========");
console.log(`Total checked : ${results.length}`);
console.log(`Verified      : ${verified}`);
console.log(`Not verified  : ${notVerified}`);
console.log(`User not found: ${notFound}`);
console.log(`Errors        : ${errors}`);
console.log("==============================");
