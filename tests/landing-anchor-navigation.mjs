import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const origin = process.env.LANDING_TEST_URL || 'http://127.0.0.1:5174';
await mkdir('dist/landing-qa', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/LandingPage-*.js', async route => {
      await new Promise(resolve => setTimeout(resolve, 400));
      await route.continue();
    });
    await page.route('**/api/regional-pricing', route => route.fulfill({ json: {
      success: true, country: 'ID', region: 'indonesia', amount: 15000, currency: 'IDR',
      checkout: 'https://lynk.id/test/renew/checkout',
    } }));
    const assertPricingPosition = async () => {
      await page.waitForFunction(() => {
        const section = document.getElementById('pilihan-paket');
        if (!section) return false;
        const top = section.getBoundingClientRect().top;
        return window.scrollY > 500 && top >= 0 && top <= 200;
      });
      await page.evaluate(() => document.fonts.ready);
      const top = await page.locator('#pilihan-paket').evaluate(section => section.getBoundingClientRect().top);
      assert(top >= 0 && top <= 200, `Pricing must be in view after fonts load: ${top}`);
    };
    await page.goto(`${origin}/#pilihan-paket`);
    await assertPricingPosition();
    await page.screenshot({ path: `dist/landing-qa/renew-anchor-${width}.png` });
    await page.reload();
    await assertPricingPosition();
    await page.goto(origin);
    await page.locator('#pilihan-paket').waitFor({ state: 'attached' });
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    await page.evaluate(() => { window.location.hash = 'pilihan-paket'; });
    await assertPricingPosition();
    await page.evaluate(() => { window.location.hash = '%invalid'; });
    await page.waitForTimeout(100);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: delayed landing mount, direct renewal anchor, reload, hash navigation, no-hash hero, malformed fragment.`);
    await page.close();
  }
} finally {
  await browser.close();
}
