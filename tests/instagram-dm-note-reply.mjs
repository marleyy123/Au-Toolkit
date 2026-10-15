import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const vite = await createViteServer({ server: { port: 0 }, logLevel: 'silent' });
let server;
try {
  await vite.listen();
  const css = await (await fetch(vite.resolvedUrls.local[0] + 'src/index.css?direct')).text();
  const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React,{useState,useRef,useLayoutEffect} from 'react';
    import {createRoot} from 'react-dom/client';
    import {InstagramDMForm} from './src/features/instagram/components/dm/InstagramDMForm';
    import {InstagramDMPreview} from './src/features/instagram/components/dm/InstagramDMPreview';
    import {INITIAL_INSTAGRAM_DM_DATA} from './src/data/defaultTemplates';
    import {LanguageContext} from './src/context/LanguageContext';
    import {ThemeContext} from './src/context/ThemeContext';
    import {registerExportContext} from './src/export/exportContext';
    import {exportPreviewToImage} from './src/utils/exportUtils';
    const params=new URLSearchParams(location.search),dark=params.get('theme')!=='light';
    const avatar='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#12c987"/></svg>');
    function App(){const ref=useRef(null);const [data,setData]=useState(()=>JSON.parse(localStorage.getItem('note-fixture')||'null')||{
      ...INITIAL_INSTAGRAM_DM_DATA,theme:dark?'dark':'light',avatar,name:'Other Person',aspectRatio:'9:16',showProfileCard:false,
      useCustomTheme:params.has('custom'),customIncomingBg:'#123456',customTextColor:'#ffffff',customSecondaryTextColor:'#cccccc',customOutgoingBg:'#bb2222',
      messages:[{id:'note-test',sender:params.get('sender')||'outgoing',text:'Send a message'}]});
      const change=next=>{setData(next);localStorage.setItem('note-fixture',JSON.stringify(next));};
      window.data=data;window.setData=change;
      useLayoutEffect(()=>{registerExportContext(ref.current,{previewKey:'instagram-dm',data,fontCss:'Arial'});window.capture=format=>exportPreviewToImage({element:ref.current,scale:1,format});},[data]);
      return <LanguageContext.Provider value={{language:'en',isId:false,t:key=>key,setLanguage:()=>{}}}>
      <ThemeContext.Provider value={{isDark:dark,uiTheme:dark?'dark':'light',setUiTheme:()=>{},toggleTheme:()=>{}}}>
      <div className={'au-editor'+(dark?' dark':'')}><div id="customization-panel" style={{width:500,maxWidth:'100%'}}><InstagramDMForm data={data} onChange={change}/></div>
      <div data-preview-canvas style={{width:380}}><InstagramDMPreview previewRef={ref} data={data} onChange={change}/></div></div>
      </ThemeContext.Provider></LanguageContext.Provider>;
    }createRoot(document.getElementById('root')).render(<App/>);
  ` }, bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' }, plugins: [{ name: 'mock-auth', setup(builder) {
    builder.onLoad({ filter: /[\\/]firebase\.ts$/ }, () => ({ contents: 'export const auth={currentUser:null};export const getStoredAuthUser=()=>null;', loader: 'ts' }));
    builder.onLoad({ filter: /[\\/]storageService\.ts$/ }, () => ({ contents: 'export const uploadMediaAsset=async()=>{throw new Error("No remote uploads in test");};', loader: 'ts' }));
  } }] });
  server = createServer((req, res) => {
    res.setHeader('content-type', req.url === '/app.js' ? 'text/javascript' : req.url === '/app.css' ? 'text/css' : 'text/html');
    res.end(req.url === '/app.js' ? bundle.outputFiles[0].text : req.url === '/app.css' ? css : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script>');
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  for (const engine of ['chrome', 'webkit']) {
    const browser = await (engine === 'chrome' ? chromium.launch({ channel: 'msedge', headless: true }) : webkit.launch());
    try {
      for (const width of [1100, 390]) for (const theme of ['light', 'dark', 'custom']) for (const sender of ['incoming', 'outgoing']) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.route('https://**/*', route => route.abort());
        await page.goto('http://127.0.0.1:' + server.address().port + '/?theme=' + theme + '&sender=' + sender + (theme === 'custom' ? '&custom=1' : ''), { waitUntil: 'domcontentloaded' });
        const editor = page.locator('[data-note-reply-editor]');
        await editor.getByRole('checkbox').check();
        await editor.getByLabel('Note Text', { exact: true }).fill('Note');
        await page.locator('[data-note-reply-preview]').waitFor();
        assert.equal((await page.locator('[data-note-reply-preview]').innerText()).trim(), (sender === 'outgoing' ? 'You replied to their note' : 'Replied to your note') + '\nNote' + (sender === 'incoming' ? '\nY' : ''));
        const avatarSrc = await page.locator('[data-note-reply-preview] img').count();
        assert.equal(avatarSrc, sender === 'outgoing' ? 1 : 0, 'Avatar fallback must match note ownership');
        await editor.getByLabel('Song Title', { exact: true }).fill('A very long song title to verify truncation');
        await editor.getByLabel('Artist Name', { exact: true }).fill('Artist');
        await editor.getByLabel('Note Text', { exact: true }).fill('LongUnbrokenNote'.repeat(8) + '\nSecond line');
        assert.equal(await editor.getByLabel('Note Owner Name', { exact: true }).count(), 0);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('[data-note-reply-preview]').waitFor();
        assert.equal(await editor.getByLabel('Artist Name', { exact: true }).inputValue(), 'Artist');
        const bounds = await page.locator('[data-note-reply-preview]').evaluate(node => {
          const canvas = document.querySelector('#preview-target').getBoundingClientRect();
          return [...node.querySelectorAll('*')].filter(child => {
            // Text deliberately clipped by a song-title ellipsis is not visible overflow.
            if (child.parentElement.closest('.truncate')) return false;
            const r = child.getBoundingClientRect(); return r.left < canvas.left - 1 || r.right > canvas.right + 1;
          }).map(child => ({ tag: child.tagName, className: child.className, text: child.textContent }));
        });
        assert.deepEqual(bounds, [], 'Note content must stay inside the preview');
        if (theme === 'custom') assert.equal(await page.locator('[data-note-pill]').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(18, 52, 86)');
        if (engine === 'chrome' && width === 1100 && sender === 'outgoing') {
          await editor.getByLabel('Note Text', { exact: true }).fill('Note');
          await editor.getByLabel('Song Title', { exact: true }).fill('');
          await editor.getByLabel('Artist Name', { exact: true }).fill('');
          await page.locator('#preview-target').screenshot({ path: join(tmpdir(), 'au-instagram-note-' + theme + '.png') });
          for (const format of ['png', 'jpeg']) {
            const result = await page.evaluate(async format => {const shot=await window.capture(format);const img=new Image();img.src=shot.dataUrl;await img.decode();return {url:shot.dataUrl,width:img.width,height:img.height};}, format);
            assert(result.url.startsWith('data:image/'));
            assert.equal(result.width, 380);
            assert(result.height > 600);
          }
        }
        await editor.getByRole('button', { name: 'Clear Note', exact: true }).click();
        assert.equal(await page.locator('[data-note-reply-preview]').count(), 0);
        const cleared = await page.evaluate(() => window.data.messages[0]);
        assert.equal(cleared.noteOwnerName, '');
        assert.equal(cleared.noteOwnerAvatar, '');
        assert.equal(cleared.text, 'Send a message');
        await page.close();
        console.log(`PASS ${engine} ${width}px ${theme} ${sender}`);
      }
    } finally { await browser.close(); }
  }
  console.log('PASS Instagram DM Notes: 24 browser/viewport/theme/sender cases, form edits, reload, clear, avatar fallback, long text, PNG/JPEG export.');
} finally {
  if (server) await new Promise(done => server.close(done));
  await vite.close();
}
