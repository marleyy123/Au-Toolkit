import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let pricingRequests = 0;
  await page.route('**/api/regional-pricing', route => {
    pricingRequests++;
    return route.fulfill({ json: { success: true, country: 'ID', region: 'indonesia', amount: 15000, currency: 'IDR', checkout: null } });
  });
  await page.goto(process.env.LANDING_URL || 'http://localhost:3000');
  const language = { selectOption: async locale => {
    await page.locator('.landing-language-trigger').click();
    await page.getByRole('menuitemradio', { name: locale === 'id' ? 'Bahasa Indonesia ID' : 'English EN' }).click();
  }, inputValue: async () => (await page.locator('.landing-language-trigger').innerText()).trim().toLowerCase() };
  await language.selectOption('id');
  await page.getByLabel('Nama penerima').fill('My character');
  await page.locator('#landing-dialogue').fill('My custom dialogue');
  await language.selectOption('en');
  await page.getByRole('heading', { name: 'Frequently asked questions.' }).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.match(await page.title(), /Visual Editor/);
  assert.equal(await page.getByLabel('Recipient name').inputValue(), 'My character');
  assert.equal(await page.locator('#landing-dialogue').inputValue(), 'My custom dialogue');
  await page.getByRole('button', { name: 'Add dialogue', exact: true }).click();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  assert.equal(await page.getByLabel('Recipient name').inputValue(), 'Naya Anandita');
  assert.match(await page.locator('#landing-dialogue').inputValue(), /cafe lobby/);
  await page.locator('.landing-plan-price').first().filter({ hasText: 'IDR 15,000' }).waitFor();
  const requestsBeforeSwitch = pricingRequests;
  await language.selectOption('id');
  await page.locator('.landing-plan-price').first().filter({ hasText: 'Rp15.000' }).waitFor();
  await language.selectOption('en');
  assert.equal(pricingRequests, requestsBeforeSwitch, 'Language must not change the regional quote');
  await page.reload();
  await page.getByRole('heading', { name: 'Frequently asked questions.' }).waitFor();
  assert.equal(await language.inputValue(), 'en', 'Language persists after reload');
  const trigger = page.locator('.landing-language-trigger');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.getByRole('menuitemradio', { name: 'English EN' }).waitFor();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  assert.equal(await language.inputValue(), 'id', 'Keyboard selection works');
  await trigger.click();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('menu').count(), 0);
  assert.equal(await trigger.evaluate(node => node === document.activeElement), true, 'Escape restores focus');
  await trigger.click();
  await page.locator('h1').click();
  assert.equal(await page.getByRole('menu').count(), 0, 'Outside click dismisses the menu');
  for (const width of [1912, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['id', 'en']) {
      await language.selectOption(locale);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${locale} layout at ${width}px`);
    }
    if (width === 1912 || width === 390) await page.screenshot({ path: `${process.env.TEMP}/au-landing-language-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.locator('#landing-mobile-nav').getByRole('link', { name: 'Plans' }).click();
  assert.equal(await page.locator('#landing-mobile-nav').count(), 0);
  assert.equal(new URL(page.url()).hash, '#pilihan-paket');
  assert.deepEqual(errors, []);
  for (const scenario of [
    { country: 'ID', expected: 'id' },
    { country: 'PH', expected: 'en' },
    { country: 'MY', expected: 'en' },
    { country: 'US', saved: 'id', expected: 'id' },
    { country: 'ID', saved: 'en', expected: 'en' },
    { country: 'XX', error: true, expected: 'en' },
    { country: 'XX', error: true, saved: 'id', expected: 'id' },
    { country: 'ID', manual: 'en', expected: 'en' },
  ]) {
    const visitor = await browser.newPage();
    try {
      if (scenario.saved) await visitor.addInitScript(locale => localStorage.setItem('au_app_language', locale), scenario.saved);
      let release;
      const gate = scenario.manual ? new Promise(resolve => { release = resolve; }) : Promise.resolve();
      await visitor.route('**/api/regional-pricing', async route => {
        await gate;
        return scenario.error ? route.fulfill({ status: 503, json: { success: false, reason: 'REGION_UNAVAILABLE' } })
          : route.fulfill({ json: { success: true, country: scenario.country, region: scenario.country === 'ID' ? 'indonesia' : 'international',
            amount: scenario.country === 'ID' ? 15000 : 30000, currency: 'IDR', checkout: null } });
      });
      await visitor.goto(process.env.LANDING_URL || 'http://localhost:3000');
      if (scenario.manual) {
        await visitor.locator('.landing-language-trigger').click();
        await visitor.getByRole('menuitemradio', { name: 'English EN' }).click();
        release();
      }
      await visitor.locator('.landing-plan-price').first().filter({ hasText: scenario.error ? /unavailable|belum tersedia/ : /15[,.]000|30[,.]000/ }).waitFor();
      await visitor.waitForFunction(locale => document.documentElement.lang === locale, scenario.expected);
      assert.equal((await visitor.locator('.landing-language-trigger').innerText()).trim().toLowerCase(), scenario.expected);
      assert.equal(await visitor.evaluate(() => localStorage.getItem('au_app_language')), scenario.saved || scenario.manual || null,
        'Automatic detection must not overwrite a manual preference');
    } finally { await visitor.close(); }
  }
  console.log('PASS landing language: ID/EN content, persistence, demo edits, regional prices, responsive menu, IP country defaults, saved/manual override, unavailable region.');
} finally {
  await browser.close();
}
