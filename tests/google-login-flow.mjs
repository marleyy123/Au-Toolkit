import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

// Exercise the real login component and entitlement service without live accounts.
const bundle = await build({
  stdin: {
    contents: `import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { Login } from './src/features/auth/components/Login';
      window.calls = [];
      createRoot(document.getElementById('root')).render(<Login
        onLoginSuccess={(email) => window.calls.push({event: 'allowed', email})}
        onAccessExpired={() => window.calls.push({event: 'expired'})} />);`,
    resolveDir: process.cwd(), loader: 'tsx',
  },
  bundle: true, write: false, format: 'iife',
  plugins: [{
    name: 'isolated-auth',
    setup(builder) {
      builder.onResolve({ filter: /\/firebase$/ }, () => ({ path: 'firebase', namespace: 'mock' }));
      builder.onResolve({ filter: /deviceAuthService$/ }, () => ({ path: 'device', namespace: 'mock' }));
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents: path === 'device' ? `
        export const detectDeviceSlot = () => 'desktop';
        export const getOrCreateDeviceId = () => 'test-desktop';
        export const getStableDeviceModel = () => 'Test desktop';
      ` : `
        export const auth = { app: { options: { projectId: 'au-toolkit-staging-20261005' } }, currentUser: null, authStateReady: async () => {} };
        export async function signInWithGoogle() {
          window.calls.push({event: 'google', activation: navigator.userActivation.isActive});
          const popup = window.open('about:blank', 'google-login-test', 'popup');
          if (!popup) throw Object.assign(new Error('Blocked'), {code: 'auth/popup-blocked'});
          popup.close();
          if (window.cancelGoogle) return null;
          auth.currentUser = {uid: 'test-user', email: 'Buyer@Example.com', getIdToken: async () => 'test-token'};
          return auth.currentUser;
        }
        export async function signInWithEmail(email) {
          window.calls.push({event: 'email', email});
          auth.currentUser = {uid: 'email-user', email, getIdToken: async () => 'test-token'};
          return auth.currentUser;
        }
        export async function signOutUser() { auth.currentUser = null; window.calls.push({event: 'signout'}); }
        export function setStoredAuthUser() { window.calls.push({event: 'stored'}); }
        export async function requestPasswordReset() {}
      ` }));
    },
  }],
});
const assets = await readdir('dist/assets');
const css = await readFile(`dist/assets/${assets.find((file) => file.endsWith('.css'))}`, 'utf8');
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css : '<link rel="stylesheet" href="/style.css"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = `http://127.0.0.1:${server.address().port}`;
const active = { success: true, accessGranted: true, reason: 'ACCESS_GRANTED', statusAccount: 'Active', expirationDate: '2099-01-01', daysRemaining: 100 };
try {
  for (const scenario of [
    {name: 'active buyer', body: active, allowed: true},
    {name: 'unknown email', body: {reason: 'BUYER_NOT_FOUND', accessGranted: false}},
    {name: 'expired buyer', body: {reason: 'ACCOUNT_EXPIRED', statusAccount: 'Expired', accessGranted: false}, expired: true},
    {name: 'inactive buyer', body: {reason: 'ACCOUNT_INACTIVE', statusAccount: 'Inactive', accessGranted: false}},
    {name: 'device mismatch', body: {reason: 'DEVICE_MISMATCH', accessGranted: false}},
    {name: 'server unavailable despite valid cache', http: 503, body: {reason: 'APPS_SCRIPT_UNAVAILABLE', accessGranted: false}},
    {name: 'popup cancelled', cancel: true},
  ]) {
    const page = await browser.newPage();
    const requests = [];
    await page.route('**/api/verify-buyer', async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({status: scenario.http || 200, contentType: 'application/json', body: JSON.stringify(scenario.body)});
    });
    await page.goto(base);
    assert.equal(await page.locator('input').count(), 0, 'Google mode must not ask for email');
    await page.evaluate((cancel) => {
      window.cancelGoogle = cancel;
      localStorage.setItem('au_buyer_entitlement_cache_buyer@example.com', JSON.stringify({isRegisteredBuyer: true, isValid: true, status: 'ACTIVE', email: 'buyer@example.com', expirationDate: '2099-01-01'}));
    }, !!scenario.cancel);
    await page.getByRole('button', {name: 'Masuk dengan Google', exact: true}).click();
    await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
    const calls = await page.evaluate(() => window.calls);
    assert.equal(calls[0].event, 'google');
    assert.equal(calls[0].activation, true, 'Popup must be invoked during user activation');
    assert.equal(calls.some((call) => call.event === 'allowed'), !!scenario.allowed, scenario.name);
    assert.equal(calls.some((call) => call.event === 'expired'), !!scenario.expired);
    if (!scenario.cancel) {
      assert.equal(requests.length, 1);
      assert.equal(requests[0].action, 'validateAccess');
      assert.equal(requests[0].email, 'buyer@example.com');
      if (!scenario.allowed) assert(calls.some((call) => call.event === 'signout'));
    } else assert.equal(requests.length, 0);
    await page.close();
    console.log(`PASS ${scenario.name}`);
  }
  const page = await browser.newPage();
  await page.goto(base);
  await page.getByRole('tab', {name: 'Email & Password'}).click();
  assert.equal(await page.locator('input[type="email"]').count(), 1);
  assert.equal(await page.locator('input[type="password"]').count(), 1);
  console.log('PASS email/password form preserved');
  for (const viewport of [{width: 1440, height: 900}, {width: 390, height: 844}]) {
    await page.setViewportSize(viewport);
    await page.getByRole('tab', {name: 'Google', exact: true}).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path: `dist/login-google-${viewport.width}.png`, fullPage: true});
  }
  await page.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
