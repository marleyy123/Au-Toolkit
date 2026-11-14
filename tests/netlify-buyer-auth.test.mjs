import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { createFirebaseTokenVerifier, firebaseTokenOptions } from '../netlify/lib/firebase-token.mjs';
import { createHandler } from '../netlify/functions/verify-buyer.mjs';

const projectId = 'gen-lang-client-0839250297';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const verifier = createFirebaseTokenVerifier({ env: { FIREBASE_PROJECT_ID: projectId }, keySet: publicKey });
const handler = createHandler({ verifyAuthorization: verifier });
process.env.GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/review-fixture/exec';
process.env.APPS_SCRIPT_SHARED_SECRET = 'test-only-not-a-real-secret-1234567890';
process.env.ALLOWED_ORIGINS = 'https://autoolkit.com';
const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (_url, options) => {
  calls.push(JSON.parse(options.body));
  return { ok: true, text: async () => JSON.stringify({ success: true, reason: 'ACCESS_GRANTED', accessGranted: true,
    statusAccount: 'Active', expirationDate: '2099-01-01', buyerName: 'Fixture' }) };
};
const options = firebaseTokenOptions(projectId);
async function token({ audience = projectId, issuer = options.issuer, verified = true, expiry = '5m', signingKey = privateKey } = {}) {
  return new SignJWT({ email: 'buyer@example.com', email_verified: verified }).setProtectedHeader({ alg: 'RS256' })
    .setSubject('buyer-uid').setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime(expiry).sign(signingKey);
}
async function invoke(body, authorization, extra = {}) {
  const result = await handler({ httpMethod: 'POST', headers: authorization ? { authorization } : {}, body: JSON.stringify(body), ...extra });
  return { ...JSON.parse(result.body), httpStatus: result.statusCode };
}
try {
  for (const action of ['validateAccess', 'registerDevice', '']) {
    assert.equal((await invoke({ action, email: 'buyer@example.com', deviceId: 'dev_desktop_hw_12345678' })).httpStatus, 401);
  }
  const signed = 'Bearer ' + await token();
  const body = { action: 'registerDevice', email: 'buyer@example.com', deviceId: 'dev_desktop_hw_12345678' };
  for (const authorization of ['Bearer forged.payload.signature', 'Bearer ' + await token({ audience: 'other-project' }),
    'Bearer ' + await token({ issuer: 'https://attacker.invalid' }), 'Bearer ' + await token({ expiry: -1 }),
    'Bearer ' + await token({ signingKey: (await generateKeyPair('RS256')).privateKey })]) {
    assert.equal((await invoke(body, authorization)).httpStatus, 401);
  }
  assert.equal((await invoke(body, 'Bearer ' + await token({ verified: false }))).reason, 'EMAIL_NOT_VERIFIED');
  assert.equal((await invoke({ ...body, email: 'other@example.com' }, signed)).reason, 'EMAIL_MISMATCH');
  assert.equal((await invoke({ ...body, user_email: 'other@example.com' }, signed)).reason, 'EMAIL_MISMATCH');
  assert.equal((await invoke({ ...body, action: 'deleteBuyer' }, signed)).reason, 'INVALID_ACTION');
  assert.equal(calls.length, 0, 'Rejected requests must never reach Apps Script');
  await invoke({ ...body, email: ' BUYER@EXAMPLE.COM ' }, signed);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].action, 'registerDevice');
  assert.equal(calls[0].email, 'buyer@example.com');
  assert.equal((await invoke(body, signed, { headers: { authorization: signed, origin: 'https://attacker.invalid' } })).httpStatus, 403);
  assert.equal((await invoke({ action: 'checkBuyerEmail', email: 'buyer@example.com' })).httpStatus, 200);
  assert.equal(calls[1].action, 'checkBuyerEmail', 'Public signup precheck stays read-only');
  await assert.rejects(createFirebaseTokenVerifier({ env: { FIREBASE_PROJECT_ID: projectId, VITE_FIREBASE_PROJECT_ID: 'other' }, keySet: publicKey })(signed), error => error.reason === 'AUTH_CONFIG_ERROR');
  console.log('PASS Netlify auth: signed JWT, expiry/issuer/audience/signature, verified email, request identity, protected mutation, read-only signup precheck, project mismatch.');
} finally { globalThis.fetch = originalFetch; }
