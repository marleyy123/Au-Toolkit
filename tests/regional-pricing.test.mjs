import assert from 'node:assert/strict';
import { createHandler } from '../api/regional-pricing.js';
import { chromium, webkit } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const domestic = 'https://lynk.id/sempiternal/l755mjy6y4v5/checkout';
const international = 'https://lynk.id/sempiternal/6qnn7x36v3xq/checkout';
function call(country, env = { VERCEL: '1' }, method = 'GET') {
  let data;
  const headers = {};
  const res = { statusCode: 0, setHeader(key, value) { headers[key] = value; }, end(value) { data = JSON.parse(value); } };
  createHandler({ env })({ method, headers: { 'x-vercel-ip-country': country }, query: { country: 'ID', amount: 1 }, body: { country: 'ID' } }, res);
  assert.equal(headers['Cache-Control'], 'private, no-store');
  assert.equal(headers['Vercel-CDN-Cache-Control'], 'no-store');
  return { status: res.statusCode, ...data };
}
assert.equal(call('ID').amount, 15000);
assert.equal(call('ID').checkout, domestic);
for (const country of ['PH', 'MY', 'US']) {
  assert.equal(call(country).amount, 30000);
  assert.equal(call(country).checkout, international);
  assert.notEqual(call(country).checkout, domestic);
  assert.equal(call(country, { VERCEL: '1', LYNK_INTERNATIONAL_CHECKOUT_URL: 'https://lynk.id/test/override/checkout' }).checkout, 'https://lynk.id/test/override/checkout');
}
assert.equal(call('my').country, 'MY');
for (const country of [undefined, 'XX', 'ZZ', 'Indonesia', ['ID']]) assert.equal(call(country).status, 503);
assert.equal(call('ID', {}).status, 503);
assert.equal(call('ID', { VERCEL: '1' }, 'POST').status, 405);
for (const url of ['http://lynk.id/test/checkout', 'https://evil.test/checkout', 'https://lynk.id/test', 'https://u:p@lynk.id/test/checkout']) {
  assert.equal(call('PH', { VERCEL: '1', LYNK_INTERNATIONAL_CHECKOUT_URL: url }).status, 503);
}
console.log('PASS server regional prices: ID/PH/MY, unknown region, method, URL validation, no client override and no shared caching');

await mkdir('dist/landing-qa', { recursive: true });
const baseUrl = process.env.LANDING_TEST_URL || 'http://127.0.0.1:5174';
for (const engine of ['chrome', 'webkit']) {
  const browser = await (engine === 'chrome' ? chromium.launch({ channel: 'chrome', headless: true }) : webkit.launch({ headless: true }));
  try {
    for (const width of [1440, 390, 320]) {
      for (const country of ['ID', 'PH', 'MY', 'unknown']) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        let unknown = country === 'unknown';
        await page.route('**/api/regional-pricing', async route => {
          const quote = unknown ? call(undefined) : call(country === 'unknown' ? 'ID' : country);
          await route.fulfill({ status: quote.status, json: quote });
        });
        await page.goto(baseUrl);
        const plan = page.locator('.landing-plan-active');
        if (unknown) {
          await plan.getByRole('button', { name: 'Coba lagi deteksi region' }).waitFor();
          assert.equal(await plan.getByRole('link', { name: 'Beli melalui Lynk.id' }).count(), 0);
          assert.equal(await plan.getByRole('button', { name: 'Beli melalui Lynk.id' }).isDisabled(), true);
          await plan.screenshot({ path: `dist/landing-qa/geo-${engine}-${width}-error.png` });
          unknown = false;
          await plan.getByRole('button', { name: 'Coba lagi deteksi region' }).click();
          await plan.getByRole('link', { name: 'Beli melalui Lynk.id' }).waitFor();
        } else {
          await page.waitForFunction(() => /Rp(?:15|30)\.000/.test(document.querySelector('.landing-plan-price')?.textContent || ''));
        }
        assert.equal(await plan.getByRole('radio').count(), 0);
        const expectedPrice = country === 'PH' || country === 'MY' ? 'Rp30.000' : 'Rp15.000';
        assert((await plan.locator('.landing-plan-price').textContent()).includes(expectedPrice));
        assert.equal(await plan.getByRole('link', { name: 'Beli melalui Lynk.id' }).getAttribute('href'), country === 'PH' || country === 'MY' ? international : domestic);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.evaluate(() => document.fonts.ready);
        await plan.screenshot({ path: `dist/landing-qa/geo-${engine}-${width}-${country}.png` });
        await page.close();
      }
      // Verify the international link is used when configured, never the domestic fallback.
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.route('**/api/regional-pricing', route => route.fulfill({ json: call('PH', { VERCEL: '1', LYNK_INTERNATIONAL_CHECKOUT_URL: international }) }));
      await page.goto(baseUrl);
      const link = page.getByRole('link', { name: 'Beli melalui Lynk.id' });
      await link.waitFor();
      assert.equal(await link.getAttribute('href'), international);
      await page.route('**/api/regional-pricing', route => route.fulfill({ json: { ...call('PH'), checkout: null } }));
      await page.reload();
      await page.waitForFunction(() => document.querySelector('.landing-checkout-status')?.textContent === 'Checkout International belum tersedia.');
      assert.equal(await page.locator('[data-plan="monthly"]').getByRole('button', { name: 'Beli melalui Lynk.id' }).isDisabled(), true);
      assert.equal(await page.getByRole('link', { name: 'Beli melalui Lynk.id' }).count(), 0);
      await page.close();
      console.log(`PASS ${engine} ${width}: IP region quote, missing checkout, detection error/retry and no manual selector`);
    }
  } finally { await browser.close(); }
}
