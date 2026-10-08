import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from 'playwright-core';

const url = process.env.LANDING_TEST_URL || 'http://127.0.0.1:5174';
await mkdir('dist/landing-qa', { recursive: true });
for (const engine of ['chrome', 'webkit']) {
  const browser = await (engine === 'chrome' ? chromium.launch({ channel: 'chrome', headless: true }) : webkit.launch({ headless: true }));
  try {
    for (const [width, height] of [[1440, 1000], [768, 1024], [390, 844], [375, 667], [320, 640]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/regional-pricing', route => route.fulfill({ json: {
        success: true, country: 'ID', region: 'indonesia', amount: 15000, currency: 'IDR',
        checkout: 'https://lynk.id/sempiternal/l755mjy6y4v5/checkout',
      } }));
      await page.goto(url);
      await page.locator('.landing-studio #preview-target').waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (const image of await page.locator('.landing-gallery img').all()) await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.landing-gallery img')].every(image => image.complete && image.naturalWidth > 0));
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow ${engine} ${width}`);
      const checkout = page.getByRole('link', { name: 'Beli melalui Lynk.id' });
      assert.equal(await checkout.getAttribute('href'), 'https://lynk.id/sempiternal/l755mjy6y4v5/checkout');
      assert.equal(await checkout.getAttribute('target'), '_blank');
      assert(await page.locator('body').textContent().then(text => text.includes('Rp15.000')));
      const activePlan = page.locator('.landing-plan-active');
      assert.equal(await activePlan.getByRole('radio').count(), 0);
      assert((await activePlan.locator('.landing-plan-price').textContent()).includes('Rp15.000'));
      assert.equal(await checkout.getAttribute('href'), 'https://lynk.id/sempiternal/l755mjy6y4v5/checkout');
      const support = page.getByRole('link', { name: 'Bantuan WhatsApp' });
      assert.equal(await support.getAttribute('href'), 'https://wa.me/6285179615352');
      assert.equal(await support.getAttribute('target'), '_blank');
      await page.screenshot({ path: `dist/landing-qa/${engine}-${width}.png`, fullPage: true });
      if (width <= 650) {
        await page.getByRole('button', { name: 'Buka menu' }).click();
        assert.equal(await page.getByRole('navigation', { name: 'Navigasi seluler' }).isVisible(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.getByRole('button', { name: 'Buka menu' }).getAttribute('aria-expanded'), 'false');
        await page.getByRole('tab', { name: 'Pengaturan', exact: true }).click();
      }
      await page.getByLabel('Nama penerima').fill('Naya QA');
      await page.getByLabel('Dialog berikutnya').fill('Dialog baru untuk pengujian.');
      await page.getByRole('button', { name: 'Tambah dialog' }).click();
      if (width <= 650) await page.getByRole('tab', { name: 'Pratinjau', exact: true }).click();
      assert((await page.locator('.landing-studio #preview-target').textContent()).includes('Naya QA'));
      assert((await page.locator('.landing-studio #preview-target').textContent()).includes('Dialog baru untuk pengujian.'));
      const faq = page.locator('details').nth(1);
      await faq.locator('summary').click();
      assert.equal(await faq.getAttribute('open'), '');
      assert.deepEqual(errors, []);
      console.log(`PASS ${engine} ${width}x${height}: assets, layout, menu, demo, FAQ, pricing`);
      await page.close();
    }
  } finally { await browser.close(); }
}
