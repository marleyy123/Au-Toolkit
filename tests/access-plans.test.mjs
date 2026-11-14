import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createHandler } from '../api/regional-pricing.js';

const env = { VERCEL: '1', ACCESS_BACKEND: 'firestore', VITE_FIREBASE_PROJECT_ID: 'au-toolkit-staging-20261005',
  MIDTRANS_IS_PRODUCTION: 'false', MIDTRANS_SERVER_KEY: 'Mid-server-test', MIDTRANS_CLIENT_KEY: 'Mid-client-test',
  FIREBASE_ADMIN_SERVICE_ACCOUNT: 'test-only' };
function quote(country = 'ID', config = env) {
  let output;
  const response = { setHeader() {}, end(value) { output = JSON.parse(value); } };
  createHandler({ env: config })({ method: 'GET', headers: { 'x-vercel-ip-country': country } }, response);
  return { ...output, httpStatus: response.statusCode };
}
for (const country of ['ID', 'US']) {
  const result = quote(country);
  assert.equal(result.httpStatus, 200);
  assert.deepEqual(result.plans.map(plan => plan.accessDays), [30, 180, 365]);
  assert.deepEqual(result.plans.map(plan => plan.amount), country === 'ID' ? [15000, 90000, 180000] : [39000, 234000, 468000]);
  assert(result.plans.every(plan => plan.available && plan.checkout === null));
}
assert.equal(quote('ID', { ...env, MIDTRANS_SERVER_KEY: '' }).ready, false);
assert.equal(quote('ID', { ...env, MIDTRANS_SERVER_KEY: '' }).provider, 'midtrans');
console.log('PASS development catalog: all prices/durations, Midtrans only, missing keys fail closed.');

if (!process.env.LANDING_TEST_URL) process.exit(0);
await mkdir('dist/landing-qa', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 768, 390, 320]) {
    for (const country of ['ID', 'US']) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let response = quote(country), selected, creates = 0;
      const orders = new Map();
      await page.route('**/api/regional-pricing', route => route.fulfill({ json: response }));
      await page.route('**/api/midtrans', route => {
        const body = route.request().postDataJSON();
        assert.equal(body.action, 'create');
        assert.equal(body.planId, selected.id);
        assert.equal(body.email, 'buyer@example.com');
        creates++;
        const order = { success: true, orderId: 'au_sb_' + String(creates).padStart(32, '0'), statusToken: 'b'.repeat(64),
          snapToken: 'snap-' + body.planId, clientKey: 'Mid-client-test', sandbox: true,
          planId: selected.id, amount: selected.amount, accessDays: selected.accessDays };
        orders.set(selected.id, order);
        return route.fulfill({ json: order });
      });
      await page.route('https://app.sandbox.midtrans.com/snap/snap.js', route => route.fulfill({ contentType: 'text/javascript',
        body: 'window.snap={pay(token, callbacks){window.__snapToken=token;callbacks.onClose();}};' }));
      await page.goto(`${process.env.LANDING_TEST_URL}/#pilihan-paket`);
      const buttonName = country === 'ID' ? 'Bayar melalui Midtrans' : 'Pay with Midtrans';
      await page.locator('[data-plan="semiannual"]').getByRole('button', { name: buttonName }).waitFor();
      assert.equal(await page.locator('a[href*="lynk.id"]').count(), 0);
      assert.equal(await page.locator('[data-plan="quarterly"]').count(), 0);
      for (const plan of response.plans) {
        selected = plan;
        const card = page.locator(`[data-plan="${plan.id}"]`);
        const expectedPrice = country === 'ID' ? `Rp${new Intl.NumberFormat('id-ID').format(plan.amount)}` : `IDR ${new Intl.NumberFormat('en-US').format(plan.amount)}`;
        assert((await card.locator('.landing-plan-price').innerText()).includes(expectedPrice));
        assert((await card.innerText()).includes(`${plan.accessDays} ${country === 'ID' ? 'hari' : 'days'}`));
        await card.getByRole('button', { name: buttonName }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel(/Email akun Google untuk akses|Google account email for access/).fill('buyer@example.com');
        assert((await dialog.innerText()).includes(String(plan.accessDays)));
        await dialog.getByRole('button', { name: /Pilih metode pembayaran|Choose payment method/ }).click();
        await dialog.getByRole('button', { name: /Lanjutkan pembayaran|Resume payment/ }).waitFor();
        assert.equal(await page.evaluate(() => window.__snapToken), 'snap-' + plan.id);
        await dialog.getByRole('button', { name: /Tutup|Close/, exact: true }).click();
      }
      await page.reload();
      for (const plan of response.plans) {
        await page.locator(`[data-plan="${plan.id}"]`).getByRole('button', { name: buttonName }).click();
        const dialog = page.getByRole('dialog');
        assert((await dialog.innerText()).includes(orders.get(plan.id).orderId));
        await dialog.getByRole('button', { name: /Lanjutkan pembayaran|Resume payment/ }).click();
        await page.waitForFunction(token => window.__snapToken === token, 'snap-' + plan.id);
        await dialog.getByRole('button', { name: /Tutup|Close/, exact: true }).click();
      }
      assert.equal(creates, 3, 'Each package resumes its own saved transaction after reload');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('.landing-plan-grid').screenshot({ path: `dist/landing-qa/plans-${country}-${width}.png` });
      response.plans[1].accessDays = 9999;
      await page.reload();
      await page.locator('[data-plan="monthly"]').getByText(/Harga belum tersedia|Price unavailable/).waitFor();
      assert.equal(await page.locator('a[href*="lynk.id"]').count(), 0);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS ${country} ${width}px: prices, selected package, separate saved orders, reload/resume, no Lynk, no overflow, tampered quote rejected.`);
    }
  }
} finally { await browser.close(); }
