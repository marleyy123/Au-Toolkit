import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer as createViteServer } from 'vite';

const vite = await createViteServer({ server: { port: 0 }, logLevel: 'silent' });
let browser;
let server;
try {
  await vite.listen();
  const css = await (await fetch(`${vite.resolvedUrls.local[0]}src/index.css?direct`)).text();
  const bundle = await build({
    stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
      import React, {useState} from 'react';
      import {createRoot} from 'react-dom/client';
      import {toPng} from 'html-to-image';
      import {WhatsAppChatForm} from './src/features/whatsapp/components/WhatsAppChatForm';
      import {WhatsAppChatPreview} from './src/features/whatsapp/components/WhatsAppChatPreview';
      import {INITIAL_WHATSAPP_CHAT_DATA} from './src/data/defaultTemplates';
      import {LanguageContext} from './src/context/LanguageContext';
      import {normalizeVoiceDuration, normalizeVoiceProgress, normalizeVoiceWaveform} from './src/features/whatsapp/voiceNote';
      window.normalized = [normalizeVoiceDuration('003:09'), normalizeVoiceDuration('3:99'), normalizeVoiceProgress(Infinity), normalizeVoiceProgress(150), normalizeVoiceWaveform([NaN]).length];
      function App() {
        const [data, setData] = useState(() => JSON.parse(localStorage.getItem('vn-test') || 'null') || {...INITIAL_WHATSAPP_CHAT_DATA, messages:[], contactName:'Naya', theme:'light'});
        const update = next => {localStorage.setItem('vn-test', JSON.stringify(next)); setData(next);};
        window.data = data; window.update = patch => update({...data, ...patch});
        window.exportPng = () => toPng(document.querySelector('[data-preview-canvas]'), {skipFonts:true, pixelRatio:1});
        return <LanguageContext.Provider value={{language:'en',isId:false,t:key=>key,setLanguage:()=>{}}}>
          <div className="au-editor dark" style={{display:'flex',flexWrap:'wrap',gap:24,padding:16,alignItems:'flex-start'}}>
            <div id="customization-panel" style={{width:420,maxWidth:'100%'}}><WhatsAppChatForm data={data} onChange={update} characters={[]} onSaveCharacter={()=>{}} onSelectCharacter={()=>{}} /></div>
            <div id="preview-panel"><div data-preview-canvas="true" style={{width:380}}><WhatsAppChatPreview data={data} onChange={update}/><div id="css-probe" className="bg-white text-gray-900 rounded-xl shadow-sm">preview</div></div></div>
          </div>
        </LanguageContext.Provider>;
      }
      createRoot(document.getElementById('root')).render(<App/>);
    ` }, bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' }, plugins: [{ name: 'mock-auth', setup(build) {
      build.onResolve({ filter: /\/firebase$/ }, () => ({ path: 'auth', namespace: 'mock' }));
      build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const auth={currentUser:null}; export const getStoredAuthUser=()=>null;' }));
    } }],
  });
  server = createServer((req, res) => {
    if (req.url === '/app.js') {res.setHeader('content-type', 'text/javascript'); res.end(bundle.outputFiles[0].text);}
    else if (req.url === '/app.css') {res.setHeader('content-type', 'text/css'); res.end(css);}
    else {res.setHeader('content-type', 'text/html'); res.end('<link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script>');}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole('button', {name:'Voice Note (Left)',exact:true}).click();
  await page.getByRole('button', {name:'Voice Note (Right)',exact:true}).click();
  assert.equal(await page.locator('[data-voice-note]').count(), 2);
  assert.deepEqual(await page.evaluate(() => window.normalized), ['3:09','0:15',0,100,22]);
  const duration = page.getByRole('textbox', {name:'Voice note duration'}).first();
  await duration.fill('2:34'); await duration.blur();
  await page.getByLabel('Listened', {exact:true}).first().check();
  await page.locator('[data-voice-note]').first().getByRole('button', {name:'Play voice note',exact:true}).click();
  await page.getByRole('button', {name:'Voice note speed',exact:true}).click();
  assert.equal(await page.evaluate(() => window.data.messages[0].voiceSpeed), '1.5x');
  const seek = page.locator('[data-voice-note]').first().getByRole('slider');
  await seek.focus(); await seek.press('End');
  assert.equal(await page.evaluate(() => window.data.messages[0].voiceProgress), 100);
  await page.reload();
  await page.locator('[data-voice-note]').first().waitFor();
  assert.equal(await page.evaluate(() => window.data.messages[0].voiceDuration), '2:34');
  assert.equal(await page.evaluate(() => window.data.messages[0].isVoicePlaying), true);
  await page.getByRole('button', {name:'Pause voice note',exact:true}).click();
  await page.getByTitle('Recall / Delete Message', {exact:true}).first().click();
  assert.equal(await page.locator('[data-voice-note]').count(), 1);
  await page.getByTitle('Restore Message', {exact:true}).click();
  assert.equal(await page.locator('[data-voice-note]').count(), 2);
  assert.equal(await page.evaluate(() => window.data.messages[0].voiceDuration), '2:34');
  const probe = await page.locator('#css-probe').evaluate(el => ({bg:getComputedStyle(el).backgroundColor, color:getComputedStyle(el).color, radius:getComputedStyle(el).borderRadius}));
  assert.equal(probe.bg, 'rgb(255, 255, 255)'); assert.notEqual(probe.color, 'rgb(255, 255, 255)'); assert.notEqual(probe.radius,'8px');
  await page.locator('[data-preview-canvas]').screenshot({path:join(tmpdir(),'au-vn-light.png')});
  for (const theme of ['dark','light']) {
    await page.evaluate(theme => window.update({theme}), theme);
    assert.equal(await page.locator('[data-voice-note]').count(),2);
  }
  await page.evaluate(() => window.update({theme:'dark'}));
  await page.locator('[data-preview-canvas]').screenshot({path:join(tmpdir(),'au-vn-dark.png')});
  const png = await page.evaluate(() => window.exportPng());
  assert(png.startsWith('data:image/png;base64,') && png.length > 10000, 'Export includes rendered voice notes');
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-preview-canvas]').scrollIntoViewIfNeeded();
  for (const note of await page.locator('[data-voice-note]').all()) {
    const rect = await note.boundingBox(); assert(rect.width > 100 && rect.width <= 268);
    assert.equal(await note.evaluate(el => el.scrollWidth <= el.clientWidth + 1),true,'VN content must fit');
  }
  await page.locator('[data-preview-canvas]').screenshot({path:join(tmpdir(),'au-vn-mobile.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS VN: add left/right, controls, seek, play/pause/speed, persistence, recall/restore, CSS isolation, light/dark/mobile, PNG export');
  console.log(`Screenshots: ${join(tmpdir(),'au-vn-light.png')}, ${join(tmpdir(),'au-vn-dark.png')}, ${join(tmpdir(),'au-vn-mobile.png')}`);
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await vite.close();
}
