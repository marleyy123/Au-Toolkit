import { createHash } from "node:crypto";
import {
  getStagingDb,
  normalizeEmail
} from "./lib/staging-access-store.js";

const email = normalizeEmail("hendrianyudha877@gmail.com");

const correctUid = "chWda8iXI7YdKlWTmiUIMr2kiLF3";
const previousUid = "SnAWwSGXUNVhVJwKSpjkLHRhs8P2";

const db = await getStagingDb();

const accountId = createHash("sha256")
  .update(email)
  .digest("hex");

const accountRef = db.collection("billingAccounts").doc(accountId);
const oldWorkspaceRef = db.collection("workspaceAccess").doc(previousUid);
const correctWorkspaceRef = db.collection("workspaceAccess").doc(correctUid);

await db.runTransaction(async (tx) => {
  const accountSnap = await tx.get(accountRef);
  const oldWorkspaceSnap = await tx.get(oldWorkspaceRef);
  const correctWorkspaceSnap = await tx.get(correctWorkspaceRef);

  if (!accountSnap.exists) throw new Error("ACCOUNT_NOT_FOUND");
  if (!oldWorkspaceSnap.exists) throw new Error("OLD_WORKSPACE_NOT_FOUND");

  const account = accountSnap.data();
  const oldWorkspace = oldWorkspaceSnap.data();

  if (normalizeEmail(account.email) !== email) {
    throw new Error("ACCOUNT_EMAIL_MISMATCH");
  }

  if (account.uid !== previousUid) {
    throw new Error("ACCOUNT_UID_CHANGED");
  }

  if (normalizeEmail(oldWorkspace.email) !== email) {
    throw new Error("WORKSPACE_EMAIL_MISMATCH");
  }

  if (correctWorkspaceSnap.exists) {
    throw new Error("CORRECT_WORKSPACE_ALREADY_EXISTS");
  }

  // Salin workspace ke UID Authentication yang benar.
  tx.set(correctWorkspaceRef, oldWorkspace);

  // Perbaiki relasi UID akun.
  tx.update(accountRef, { uid: correctUid });
});

console.log("CORRECT_UID_RESTORED");
console.log({
  email,
  correctUid,
  previousUid,
  oldWorkspacePreserved: true
});
