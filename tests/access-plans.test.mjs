import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createHandler } from '../api/regional-pricing.js';

const env = { VERCEL: '1', ACCESS_BACKEND: 'firestore', VITE_FIREBASE_PROJECT_ID: 'au-toolkit-staging-20261005',
  LYNK_TEST_PRODUCT_UUID: 'monthly-test', LYNK_TEST_PRODUCT_UUID_3_MONTHS: 'quarterly-test',
  LYNK_TEST_PRODUCT_UUID_1_YEAR: 'yearly-test', LYNK_TEST_CHECKOUT_URL_3_MONTHS: 'https://lynk.id/test/quarterly/checkout',
  LYNK_TEST_CHECKOUT_URL_1_YEAR: 'https://lynk.id/test/yearly/checkout' };
function quote(country = 'ID', config = env) {
  let output;
  const response = { setHeader() {}, end(value) { output = JSON.parse(value); } };
  createHandler({ env: config })({ method: 'GET', headers: { 'x-vercel-ip-country': country } }, response);
  return { ...output, httpStatus: response.statusCode };
}
for (const country of ['ID', 'US']) {
  const result = quote(country);
  assert.equal(result.httpStatus, 200);
  assert.deepEqual(result.plans.map(plan => plan.accessDays), [30, 90, 365]);
  assert.deepEqual(result.plans.map(plan => plan.amount), [country === 'ID' ? 15000 : 30000, 0, 0]);
  assert.equal(result.plans[1].checkout, env.LYNK_TEST_CHECKOUT_URL_3_MONTHS);
}
assert.equal(quote('ID', { ...env, LYNK_TEST_PRODUCT_UUID_3_MONTHS: '' }).plans[1].checkout, null);
assert.equal(quote('ID', { ...env, LYNK_TEST_CHECKOUT_URL_1_YEAR: '' }).plans[2].checkout, null);
assert.equal(quote('ID', { ...env, ACCESS_BACKEND: 'sheets' }).plans[1].checkout, null);
assert.equal(quote('ID', { ...env, LYNK_TEST_PRODUCT_UUID_1_YEAR: 'quarterly-test' }).reason, 'INVALID_PLAN_CONFIG');
assert.equal(quote('ID', { ...env, LYNK_TEST_CHECKOUT_URL_1_YEAR: 'https://evil.test/checkout' }).reason, 'CHECKOUT_CONFIG_ERROR');
console.log('PASS plan API: prices, durations, UUID availability, staging isolation, invalid checkout and duplicate product mapping.');

if (!process.env.LANDING_TEST_URL) process.exit(0);
await mkdir('dist/landing-qa', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let response = quote();
    await page.route('**/api/regional-pricing', route => route.fulfill({ json: response }));
    await page.goto(`${process.env.LANDING_TEST_URL}/#pilihan-paket`);
    for (const [id, days, checkout] of [['monthly', 30, response.checkout], ['quarterly', 90, env.LYNK_TEST_CHECKOUT_URL_3_MONTHS], ['yearly', 365, env.LYNK_TEST_CHECKOUT_URL_1_YEAR]]) {
      const plan = page.locator(`[data-plan="${id}"]`);
      const link = plan.getByRole('link', { name: 'Beli melalui Lynk.id' });
      await link.waitFor();
      assert.equal(await link.getAttribute('href'), checkout);
      assert((await plan.innerText()).includes(`${days} hari`));
      if (id !== 'monthly') assert((await plan.locator('.landing-plan-price').innerText()).includes('Rp0'));
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.landing-plan-grid').screenshot({ path: `dist/landing-qa/plans-${width}.png` });
    response = quote('ID', { ...env, LYNK_TEST_PRODUCT_UUID_3_MONTHS: '', LYNK_TEST_PRODUCT_UUID_1_YEAR: '' });
    await page.reload();
    await page.locator('[data-plan="yearly"]').getByText('Checkout belum tersedia.').waitFor();
    assert.equal(await page.locator('[data-plan="yearly"]').getByRole('button', { name: 'Beli melalui Lynk.id' }).isDisabled(), true);
    response = quote();
    response.plans[1].accessDays = 9999;
    await page.reload();
    await page.locator('[data-plan="monthly"]').getByText('Harga belum tersedia').waitFor();
    assert.equal(await page.getByRole('link', { name: 'Beli melalui Lynk.id' }).count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}px: three plans, correct checkout links/durations, no overflow, missing config disabled, tampered quote rejected.`);
  }
} finally { await browser.close(); }
