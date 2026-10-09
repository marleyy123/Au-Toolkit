import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const bundle = await build({
  stdin: { loader: 'tsx', resolveDir: process.cwd(), contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { AccessGuard } from './src/features/auth/components/AccessGuard';
    import { PricingSection } from './src/features/landing/components/PricingSection';
    createRoot(document.getElementById('root')).render(window.location.pathname === '/editor'
      ? <AccessGuard email="buyer@example.com" status="EXPIRED" statusAccount="Expired" onLogout={() => {}} />
      : <PricingSection />);
  ` },
  bundle: true, write: false, format: 'iife',
});
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text
    : '<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  for (const width of [1440, 390]) {
    for (const country of ['ID', 'US']) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const checkout = `https://lynk.id/test/${country.toLowerCase()}/checkout`;
      await context.route('**/api/regional-pricing', route => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, country, region: country === 'ID' ? 'indonesia' : 'international',
          amount: country === 'ID' ? 15000 : 30000, currency: 'IDR', checkout }),
      }));
      await context.route('https://lynk.id/**', route => route.fulfill({ body: 'Mock checkout' }));
      const page = await context.newPage();
      await page.goto(`${origin}/editor`);
      const renew = page.getByRole('link', { name: 'Perpanjang Akses Sekarang' });
      assert.equal(await renew.getAttribute('href'), '/#pilihan-paket');
      const pricingPromise = page.waitForEvent('popup');
      await renew.click();
      const pricing = await pricingPromise;
      await pricing.waitForLoadState();
      assert.equal(pricing.url(), `${origin}/#pilihan-paket`);
      assert.equal(page.url(), `${origin}/editor`);
      const purchase = pricing.getByRole('link', { name: 'Beli melalui Lynk.id' });
      await purchase.waitFor();
      assert.equal(await purchase.getAttribute('href'), checkout);
      assert.match(await pricing.locator('.landing-plan-price').innerText(), country === 'ID' ? /15\.000/ : /30\.000/);
      const checkoutPromise = pricing.waitForEvent('popup');
      await purchase.click();
      const payment = await checkoutPromise;
      await payment.waitForLoadState();
      assert.equal(payment.url(), checkout);
      await context.close();
    }
  }
  console.log('PASS expired access -> pricing -> regional Lynk checkout, desktop/mobile and ID/international; original expired tab preserved.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
