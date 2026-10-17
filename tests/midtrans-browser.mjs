import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { midtransPlans } from '../lib/midtrans-plans.js';

const base = process.env.MIDTRANS_TEST_URL || 'http://localhost:5190';
await mkdir('dist/midtrans-qa', { recursive: true });
for (const engine of ['edge', 'webkit']) {
  const browser = await (engine === 'edge' ? chromium.launch({ channel: 'msedge', headless: true }) : webkit.launch({ headless: true }));
  try {
    for (const width of [1100, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      let ready = true, paid = false, simulateFailure = false, createCount = 0, checks = 0;
      const order = { success: true, orderId: 'au_sb_' + 'a'.repeat(32), statusToken: 'b'.repeat(64),
        snapToken: 'snap-token-test', clientKey: width === 390 ? 'SB-Mid-client-test' : 'Mid-client-test', sandbox: true, amount: 15000 };
      await page.route('**/api/regional-pricing', route => route.fulfill({ json: {
        success: true, country: 'ID', region: 'indonesia', amount: 15000, currency: 'IDR', checkout: null,
        provider: 'midtrans', sandbox: true, ready, reason: ready ? null : 'SANDBOX_KEYS_REQUIRED',
        plans: midtransPlans('ID'),
      } }));
      await page.route('**/api/midtrans', async route => {
        const body = route.request().postDataJSON();
        if (body.action === 'create') {
          createCount++; assert.equal(body.email, 'buyer@example.com'); assert.equal(body.planId, 'monthly');
          if (simulateFailure) return route.fulfill({ status: 503, json: { success: false, reason: 'PAYMENT_PROVIDER_ERROR' } });
          return route.fulfill({ json: order });
        }
        checks++; assert.equal(body.orderId, order.orderId); assert.equal(body.statusToken, order.statusToken);
        return route.fulfill({ json: { success: true, status: paid ? 'paid' : 'pending', accessActivated: paid } });
      });
      await page.route('https://app.sandbox.midtrans.com/snap/snap.js', route => route.fulfill({ contentType: 'text/javascript',
        body: `window.snap={pay(token, callbacks){window.__snapToken=token;window.__snapCallbacks=callbacks;callbacks.onClose();}};` }));
      await page.goto(base);
      await page.locator('[data-plan="monthly"]').getByRole('button', { name: 'Bayar melalui Midtrans' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await dialog.getByLabel('Email akun Google untuk akses').fill('buyer@example.com');
      simulateFailure = true;
      await dialog.getByRole('button', { name: 'Pilih metode pembayaran' }).click();
      await dialog.getByRole('status').filter({ hasText: 'Pembayaran belum dapat diproses' }).waitFor();
      simulateFailure = false;
      await dialog.getByRole('button', { name: 'Pilih metode pembayaran' }).click();
      await dialog.getByRole('button', { name: 'Lanjutkan pembayaran' }).waitFor();
      assert.equal(await page.evaluate(() => window.__snapToken), order.snapToken);
      assert.equal(await page.locator('#au-midtrans-snap').getAttribute('data-client-key'), order.clientKey);
      await dialog.getByRole('button', { name: 'Periksa status pembayaran' }).click();
      await dialog.getByRole('status').filter({ hasText: 'Belum ada pembayaran terverifikasi' }).waitFor();
      assert.equal(await dialog.getByRole('link', { name: 'Masuk ke akun' }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const bounds = await dialog.boundingBox(); assert(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
      await dialog.screenshot({ path: `dist/midtrans-qa/${engine}-${width}-pending.png` });
      await page.reload();
      await page.locator('[data-plan="monthly"]').getByRole('button', { name: 'Bayar melalui Midtrans' }).click();
      await dialog.getByRole('button', { name: 'Lanjutkan pembayaran' }).click();
      await page.waitForFunction(() => Boolean(window.__snapCallbacks));
      assert.equal(createCount, 2, 'Reload/resume must reuse the original order');
      // Callback claims success, but the backend still reports pending.
      await page.evaluate(() => window.__snapCallbacks.onSuccess());
      await dialog.getByRole('status').filter({ hasText: 'Belum ada pembayaran terverifikasi' }).waitFor();
      assert.equal(await dialog.getByRole('link', { name: 'Masuk ke akun' }).count(), 0);
      paid = true;
      await dialog.getByRole('button', { name: 'Periksa status pembayaran' }).click();
      await dialog.getByRole('link', { name: 'Masuk ke akun' }).waitFor();
      assert.equal(await dialog.getByRole('link', { name: 'Masuk ke akun' }).getAttribute('href'), '/editor');
      assert.equal(await page.evaluate(() => sessionStorage.getItem('au-midtrans-sandbox-order')), null);
      assert(checks >= 3);
      await dialog.screenshot({ path: `dist/midtrans-qa/${engine}-${width}-paid.png` });
      ready = false;
      await page.reload();
      await page.locator('[data-plan="monthly"]').getByRole('button', { name: 'Bayar melalui Midtrans' }).click();
      await dialog.getByRole('alert').filter({ hasText: 'Key Midtrans sandbox belum sesuai' }).waitFor();
      assert(await dialog.getByRole('button', { name: 'Pilih metode pembayaran' }).isDisabled());
      await dialog.getByRole('button', { name: 'Tutup' }).click();
      assert.equal(await dialog.isVisible(), false);
      await page.close();
      console.log(`PASS ${engine} ${width}: error/retry, email, Snap, pending, resume after reload, verified payment and invalid key feedback`);
    }
  } finally { await browser.close(); }
}
