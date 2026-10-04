import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT, jwtVerify } from 'jose';
import { createHandler, tokenOptions } from '../api/verify-buyer.js';

process.env.VITE_FIREBASE_PROJECT_ID = 'au-toolkit-staging-20261005';
process.env.GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4xs8YHS0r0jSXpqD8z0eg6jN25gTtziNOg18ILcy0bdBGR_NNIS_Vub4obYop__vd/exec';
process.env.APPS_SCRIPT_SHARED_SECRET = 'test-only-secret-not-a-real-key-1234567890';
process.env.ALLOWED_ORIGINS = 'https://au-toolkit-testing.vercel.app';
const { publicKey, privateKey } = await generateKeyPair('RS256');
let calls = 0;
const handler = createHandler({
  verifyToken: token => jwtVerify(token, publicKey, tokenOptions),
  delegate: async event => {
    calls++;
    return { statusCode: 200, body: JSON.stringify(JSON.parse(event.body)), headers: {} };
  },
  fetchImpl: async () => ({ ok: true, json: async () => ({ success: false, reason: 'UNAUTHORIZED' }) }),
});
async function invoke(body, headers = {}, method = 'POST') {
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(value = '') { this.body = value; } };
  await handler({ body, headers, method }, res);
  return res;
}
async function token(audience = tokenOptions.audience, expiration = '5m') {
  return new SignJWT({ email: 'tester@example.com' }).setProtectedHeader({ alg: 'RS256' }).setSubject('tester')
    .setIssuer(tokenOptions.issuer).setAudience(audience).setIssuedAt().setExpirationTime(expiration).sign(privateKey);
}
assert.equal((await invoke({ action: 'checkBuyerEmail', email: 'tester@example.com' })).statusCode, 200);
assert.equal((await invoke('{bad')).statusCode, 400);
assert.equal((await invoke([])).statusCode, 400);
assert.equal((await invoke({ action: 'registerDevice' })).statusCode, 400);
assert.equal((await invoke({})).statusCode, 401);
assert.equal((await invoke({}, { authorization: 'Bearer forged.payload.signature' })).statusCode, 401);
assert.equal((await invoke({}, { authorization: `Bearer ${await token('production-project')}` })).statusCode, 401);
assert.equal((await invoke({}, { authorization: `Bearer ${await token(tokenOptions.audience, -1)}` })).statusCode, 401);
const authorization = `Bearer ${await token()}`;
assert.equal((await invoke({ email: 'other@example.com' }, { authorization })).statusCode, 403);
const valid = await invoke({ deviceId: 'dev_mobile_hw_12345678' }, { authorization });
assert.equal(valid.statusCode, 200);
assert.equal(JSON.parse(valid.body).email, 'tester@example.com');
assert.equal((await invoke({}, { origin: 'https://autoolkit.com' })).statusCode, 403);
assert.equal((await invoke({}, { origin: process.env.ALLOWED_ORIGINS }, 'OPTIONS')).statusCode, 204);
assert.equal((await invoke({}, {}, 'GET')).statusCode, 405);
assert.equal((await invoke({ action: 'healthCheck' })).statusCode, 502);
process.env.VITE_FIREBASE_PROJECT_ID = 'gen-lang-client-0839250297';
assert.equal((await invoke({ action: 'checkBuyerEmail' })).statusCode, 500);
assert.equal(calls, 2);
console.log('Vercel buyer tests passed: staging isolation, CORS, real signed JWTs, expiry, identity matching, health failure.');
