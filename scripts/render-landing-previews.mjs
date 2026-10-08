import { createServer } from 'node:http';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const bundle = await build({
  stdin: { contents: `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {LanguageProvider} from './src/context/LanguageContext';
    import {WhatsAppChatPreview} from './src/features/whatsapp/components/WhatsAppChatPreview';
    import {LineChatPreview} from './src/features/line/components/LineChatPreview';
    import {InstagramDMPreview} from './src/features/instagram/components/InstagramDMPreview';
    import {whatsappDemo,lineDemo,instagramDemo} from './src/features/landing/data/demoData';
    const format=new URLSearchParams(location.search).get('format');
    const preview=format==='line'?<LineChatPreview data={lineDemo}/>:format==='instagram'?<InstagramDMPreview data={instagramDemo}/>:<WhatsAppChatPreview data={whatsappDemo}/>;
    createRoot(document.getElementById('root')).render(<LanguageProvider>{preview}</LanguageProvider>);
  `, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' },
});
const assets = await readdir('dist/assets');
const styles = await Promise.all(assets.filter(file => file.endsWith('.css') && !file.startsWith('LandingPage')).map(file => readFile('dist/assets/' + file, 'utf8')));
const css = styles.join('\n').replace(/@import[^;]+;/g, '');
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><style>html,body,#root{margin:0;width:380px;height:475px;overflow:hidden}</style><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  await mkdir('public/landing', { recursive: true });
  for (const format of ['whatsapp', 'line', 'instagram']) {
    const page = await browser.newPage({ viewport: { width: 380, height: 475 }, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${server.address().port}/?format=${format}`);
    await page.locator('#preview-target').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `public/landing/${format}.png` });
    await page.close();
    console.log(`Rendered ${format}`);
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
