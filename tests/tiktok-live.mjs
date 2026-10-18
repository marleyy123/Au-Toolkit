import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import { chromium, webkit } from 'playwright-core';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const vite = await createViteServer({ server: { port: 0 }, logLevel: 'silent' });
let server;
try {
  await vite.listen();
  const css = await (await fetch(vite.resolvedUrls.local[0] + 'src/index.css?direct')).text();
  const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React,{useState,useRef,useLayoutEffect} from 'react';import {createRoot} from 'react-dom/client';
    import {FormRegistry} from './src/export/FormRegistry';import {PreviewRegistry} from './src/export/PreviewRegistry';
    import {getInitialTabData,getPlatformAndSubFeature,ALL_PLATFORM_TABS} from './src/features/workspace/workspaceStorage';
    import {isTabLive} from './src/config/featureFlags';
    import {LanguageContext} from './src/context/LanguageContext';import {ThemeContext} from './src/context/ThemeContext';
    import {installPersistentLocalImageResolver,persistLocalImageBlob} from './src/utils/imageManager';
    import {registerExportContext} from './src/export/exportContext';import {exportPreviewToImage} from './src/utils/exportUtils';
    import {prepareNativeExportRequest} from './src/export/exportPayload';
    localStorage.setItem('au_auth_user',JSON.stringify({uid:'tiktok-live-test'}));installPersistentLocalImageResolver();
    const initial=()=>getInitialTabData('tiktok-live');
    window.registration={included:ALL_PLATFORM_TABS.includes('tiktok-live'),live:isTabLive('tiktok-live'),metadata:getPlatformAndSubFeature('tiktok-live')};
    function App(){
      const ref=useRef(null);const [language,setLanguage]=useState('en'),[dark,setDark]=useState(false),[active,setActive]=useState('folder-1');
      const [folders,setFolders]=useState(()=>JSON.parse(localStorage.getItem('live-fixture')||'null')||{'folder-1':initial(),'folder-2':initial()});
      const data=folders[active];const change=next=>setFolders(previous=>{const updated={...previous,[active]:next};localStorage.setItem('live-fixture',JSON.stringify(updated));return updated;});
      window.data=data;window.patch=patch=>change({...data,...patch});window.switchFolder=setActive;window.setLanguage=setLanguage;window.setDark=setDark;
      window.injectImage=async()=>{const canvas=document.createElement('canvas');canvas.width=380;canvas.height=676;const ctx=canvas.getContext('2d');ctx.fillStyle='#526b79';ctx.fillRect(0,0,380,676);ctx.fillStyle='#c8b48a';ctx.fillRect(90,120,200,300);const blob=await new Promise(done=>canvas.toBlob(done));const media=await persistLocalImageBlob('tiktok-live-test',blob,'live-fixture');change({...data,liveMediaType:'image',liveMediaUrl:media});};
      window.recordVideo=async()=>{const canvas=document.createElement('canvas');canvas.width=190;canvas.height=338;canvas.getContext('2d').fillRect(0,0,190,338);const stream=canvas.captureStream(10),chunks=[];const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});const done=new Promise(resolve=>recorder.onstop=resolve);recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();let frame=0;const ticker=setInterval(()=>{const ctx=canvas.getContext('2d');ctx.fillStyle=frame++%2?'red':'green';ctx.fillRect(0,0,190,338);},50);await new Promise(resolve=>setTimeout(resolve,1000));clearInterval(ticker);recorder.stop();await done;stream.getTracks().forEach(track=>track.stop());const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());return btoa(String.fromCharCode(...bytes));};
      useLayoutEffect(()=>{registerExportContext(ref.current,{previewKey:'tiktok-live',data,fontCss:'Arial'});window.capture=format=>exportPreviewToImage({element:ref.current,scale:1,format});window.prepare=()=>prepareNativeExportRequest({previewKey:'tiktok-live',data,fontCss:'Arial',canonicalWidth:380,canonicalHeight:676,scale:1,format:'png',quality:1,backgroundColor:'#000'});},[data]);
      return <LanguageContext.Provider value={{language,isId:language==='id',t:key=>key,setLanguage}}><ThemeContext.Provider value={{isDark:dark,uiTheme:dark?'dark':'light'}}>
        <div className={'au-editor'+(dark?' dark':'')} style={{display:'flex',flexWrap:'wrap',alignItems:'flex-start',gap:16}}>
          <div id="customization-panel" style={{width:500,maxWidth:'100%'}}><FormRegistry activeTab="tiktok-live" data={data} onChange={change} characters={[{id:'folder-1',name:'Folder 1'},{id:'folder-2',name:'Folder 2'}]} activeCharacterId={active} onSaveCharacter={()=>{}} onSelectCharacter={folder=>setActive(folder.id)}/></div>
          <div data-preview-canvas style={{width:380}}><PreviewRegistry previewKey="tiktok-live" data={data} previewRef={ref} fontCss="Arial" handlers={{onChange:change}}/></div>
        </div></ThemeContext.Provider></LanguageContext.Provider>;
    }createRoot(document.getElementById('root')).render(<App/>);
  ` }, bundle: true, write: false, format: 'iife', loader: { '.css': 'empty' }, plugins: [{ name: 'mock-auth', setup(builder) {
    builder.onLoad({ filter: /[\\/]firebase\.ts$/ }, () => ({ contents: 'export const auth={currentUser:null};export const db=null;export const getUserDocumentId=value=>value;export const isFirestoreQuotaExhausted=()=>false;export const getStoredAuthUser=()=>null;', loader: 'ts' }));
    builder.onLoad({ filter: /[\\/]storageService\.ts$/ }, () => ({ contents: 'export const uploadMediaAsset=async()=>{throw new Error("No remote uploads in test");};', loader: 'ts' }));
  } }] });
  server = createServer((req, res) => {
    res.setHeader('content-type', req.url === '/app.js' ? 'text/javascript' : req.url === '/app.css' ? 'text/css' : 'text/html');
    res.end(req.url === '/app.js' ? bundle.outputFiles[0].text : req.url === '/app.css' ? css : '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script>');
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  for (const engine of ['edge', 'webkit']) {
    const browser = await (engine === 'edge' ? chromium.launch({ channel: 'msedge', headless: true }) : webkit.launch());
    try {
      const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.route('https://**/*', route => route.abort());
      await page.goto('http://127.0.0.1:' + server.address().port);
      await page.locator('[data-tiktok-live-preview]').waitFor();
      assert.deepEqual(await page.evaluate(() => window.registration), { included: true, live: true, metadata: { platform: 'tiktok', subFeature: 'live' } });
      const form = page.locator('#customization-panel');
      const preview = page.locator('[data-tiktok-live-preview]');
      await form.getByPlaceholder('username', { exact: true }).first().fill('khalifa_user');
      assert((await preview.innerText()).includes('khalifa_user'), 'User input must never be silently replaced by placeholder filtering');
      await form.getByRole('button', { name: 'Add Top Viewer', exact: true }).click();
      await page.waitForFunction(() => window.data.viewers.length === 1);
      await form.getByTitle('Delete Viewer #1', { exact: true }).click();
      await page.waitForFunction(() => window.data.viewers.length === 0);
      await form.getByRole('button', { name: 'Comment', exact: true }).click();
      await form.getByPlaceholder('username', { exact: true }).last().fill('user123');
      await form.getByPlaceholder('Hello! ✨', { exact: true }).fill('Halo kak ✨');
      await form.getByRole('button', { name: 'Joined', exact: true }).click();
      await form.getByPlaceholder('username', { exact: true }).last().fill('new_viewer');
      await form.getByRole('button', { name: 'Liked', exact: true }).click();
      assert((await preview.innerText()).includes('Halo kak'));
      assert.equal(await page.evaluate(() => window.data.comments.length), 3);
      await form.getByRole('checkbox', { name: 'Show Yellow Cart', exact: true }).check();
      await form.getByRole('button', { name: 'Add Product', exact: true }).click();
      await form.getByPlaceholder('Kaos Polos Motif Bergaris New Lo...').fill('Novel AU');
      await form.getByPlaceholder('Rp16.476').fill('Rp25.000');
      await form.getByPlaceholder('-17%').fill('Voucher LIVE');
      assert((await preview.innerText()).includes('Novel AU'));
      await preview.getByTitle('Lihat diskon & voucher').first().click();
      assert.equal(await page.evaluate(() => window.data.showVoucherModal), true);
      await preview.getByRole('button', { name: 'Klaim', exact: true }).click();
      assert.equal(await page.evaluate(() => window.data.voucherClaimed), true);
      await preview.getByRole('button', { name: 'Gunakan Sekarang', exact: true }).click();
      await page.evaluate(() => window.injectImage());
      await page.waitForFunction(() => document.querySelector('img[alt="LIVE broadcast"]')?.naturalWidth === 380);
      await page.evaluate(() => window.switchFolder('folder-2'));
      await page.waitForFunction(() => window.data.comments.length === 0);
      assert.equal(await page.evaluate(() => window.data.comments.length), 0);
      await page.evaluate(() => window.switchFolder('folder-1'));
      await page.waitForFunction(() => window.data.comments.length === 3);
      assert.equal(await page.evaluate(() => window.data.comments.length), 3);
      await page.reload();
      await page.waitForFunction(() => document.querySelector('img[alt="LIVE broadcast"]')?.naturalWidth === 380);
      assert.equal(await form.getByPlaceholder('username', { exact: true }).first().inputValue(), 'khalifa_user');
      assert.equal(await form.getByPlaceholder('username', { exact: true }).nth(1).inputValue(), 'user123');
      for (const width of [1100, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const dark of [false, true]) {
          await page.evaluate(dark => window.setDark(dark), dark);
          assert.equal(await form.evaluate(element => element.scrollWidth <= element.clientWidth + 1), true, 'Form must fit on mobile');
          assert.equal(await preview.evaluate(element => Math.round(element.getBoundingClientRect().width)), 380);
          await preview.screenshot({ path: join(tmpdir(), 'au-tiktok-live-' + engine + '-' + width + '-' + dark + '.png') });
        }
      }
      for (const format of ['png', 'jpeg']) {
        const result = await page.evaluate(async format => { const shot = await window.capture(format); const img = new Image(); img.src = shot.dataUrl; await img.decode(); return { success: shot.success, width: img.width, height: img.height }; }, format);
        assert.equal(result.success, true); assert.equal(result.width, 380); assert.equal(result.height, 676);
      }
      const mediaCount = await page.evaluate(async () => (await window.prepare()).formData.getAll('media').length);
      assert.equal(mediaCount, 1, 'Native exports include the account-local background');
      if (engine === 'edge') {
        const video = Buffer.from(await page.evaluate(() => window.recordVideo()), 'base64');
        await form.locator('input[accept="video/mp4,video/webm"]').setInputFiles({ name: 'live.webm', mimeType: 'video/webm', buffer: video });
        await page.waitForFunction(() => window.data.liveMediaType === 'video' && document.querySelector('video')?.readyState >= 2).catch(async error => { console.log(await page.evaluate(()=>({type:window.data.liveMediaType,video:document.querySelector('video')?.outerHTML,error:document.querySelector('video')?.error?.message,alert:document.querySelector('[role=alert]')?.textContent})));throw error; });
        const frozen = await page.evaluate(async () => { const request = await window.prepare(); return { type: request.payload.data.liveMediaType, count: request.formData.getAll('media').length }; });
        assert.deepEqual(frozen, { type: 'image', count: 1 });
        const frameExport = await page.evaluate(async () => { const shot = await window.capture('png'); return shot.success; });
        assert.equal(frameExport, true, 'The video background must also export through the image pipeline');
        await page.reload();
        await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
      }
      await page.evaluate(() => window.setLanguage('id'));
      await form.getByRole('button', { name: 'Komentar', exact: true }).waitFor();
      assert.deepEqual(errors, []);
      console.log('PASS ' + engine + ': LIVE registration, edits, activities, products/voucher, folder isolation/reload, local media, mobile/themes, PNG/JPEG, native export' + (engine === 'edge' ? ', video upload/reload/frame capture' : ''));
    } finally { await browser.close(); }
  }
} finally { if (server) await new Promise(done => server.close(done)); await vite.close(); }
