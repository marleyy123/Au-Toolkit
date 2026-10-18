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
      import {exportPreviewToImage} from './src/utils/exportUtils';
      import {registerExportContext} from './src/export/exportContext';
      import {WhatsAppChatForm} from './src/features/whatsapp/components/WhatsAppChatForm';
      import {WhatsAppChatPreview} from './src/features/whatsapp/components/WhatsAppChatPreview';
      import {INITIAL_WHATSAPP_CHAT_DATA} from './src/data/defaultTemplates';
      import {LanguageContext} from './src/context/LanguageContext';
      import {normalizeVoiceDuration, normalizeVoiceProgress, normalizeVoiceWaveform} from './src/features/whatsapp/voiceNote';
      window.normalized = [normalizeVoiceDuration('003:09'), normalizeVoiceDuration('3:99'), normalizeVoiceProgress(Infinity), normalizeVoiceProgress(150), normalizeVoiceWaveform([NaN]).length];
      function App() {
        const [language, setLanguage] = useState('en');
        window.setTestLanguage = setLanguage;
        const [data, setData] = useState(() => JSON.parse(localStorage.getItem('vn-test') || 'null') || {...INITIAL_WHATSAPP_CHAT_DATA, messages:[], contactName:'Naya', theme:'light'});
        const update = next => {localStorage.setItem('vn-test', JSON.stringify(next)); setData(next);};
        window.data = data; window.update = patch => update({...data, ...patch});
        window.exportPng = () => toPng(document.querySelector('[data-preview-canvas]'), {skipFonts:true, pixelRatio:1});
        window.exportContact = format => {
          const element = document.querySelector('[data-preview-canvas] #preview-target');
          registerExportContext(element, {previewKey:'whatsapp-chat',data,fontCss:'Arial'});
          return exportPreviewToImage({element,format,scale:1});
        };
        return <LanguageContext.Provider value={{language,isId:language==='id',t:key=>key,setLanguage}}>
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
  await page.getByRole('button', {name:'Date Divider',exact:true}).click();
  await page.getByRole('button', {name:'Unread Divider',exact:true}).click();
  await page.getByRole('button', {name:'System Notice',exact:true}).click();
  assert.deepEqual(await page.evaluate(() => window.data.messages.slice(-3).map(message => message.type)), ['date_divider','unread_divider','system']);
  await page.locator('.wa-date-divider-card input[type="text"]').fill('Yesterday');
  await page.locator('.wa-unread-divider-card').getByTitle('Move Up', {exact:true}).click();
  assert.equal(await page.evaluate(() => window.data.messages[3].text), 'Yesterday');
  await page.locator('.wa-unread-divider-card').getByTitle('Delete Divider', {exact:true}).click();
  assert.equal(await page.locator('.wa-unread-divider-card').count(), 0);
  await page.getByLabel('Reply Quote Box', {exact:true}).first().check();
  const quote = page.locator('[data-sync-theme]').first().getByRole('combobox').last();
  await quote.click();
  await page.getByRole('option').filter({hasText:/^#2 /}).click();
  assert.equal(await page.evaluate(() => window.data.messages[0].replyToMessageId), await page.evaluate(() => window.data.messages[1].id));
  await page.getByRole('button', {name:'Clear Quote',exact:true}).click();
  assert.equal(await page.evaluate(() => window.data.messages[0].replyToMessageId), '');
  const themeToggle = page.getByRole('switch', {name:'Enable Theme Customization'});
  if (await themeToggle.getAttribute('aria-checked') !== 'true') await themeToggle.click();
  await page.getByPlaceholder('Nama preset kustom (misal: Sunset)').fill('Refactor QA');
  await page.getByRole('button', {name:'Save Preset',exact:true}).click();
  const savedThemeId = await page.evaluate(() => window.data.activeThemePreset);
  assert(savedThemeId.startsWith('custom-'));
  await page.reload();
  await page.getByTitle('Refactor QA', {exact:true}).waitFor();
  await page.getByTitle('Refactor QA', {exact:true}).click();
  assert.equal(await page.evaluate(() => window.data.activeThemePreset), savedThemeId);
  await page.getByTitle('Refactor QA', {exact:true}).getByTitle('Hapus preset kustom', {exact:true}).click();
  assert.equal(await page.getByTitle('Refactor QA', {exact:true}).count(), 0);
  await page.evaluate(() => window.update({messages:[],theme:'light',useCustomColors:false}));
  await page.getByRole('button', {name:'Contact (Left)',exact:true}).click();
  await page.getByRole('button', {name:'Contact (Right)',exact:true}).click();
  const incomingContact = page.locator('[data-sync-theme]').first();
  const outgoingContact = page.locator('[data-sync-theme]').nth(1);
  const contactName = 'Naya ' + 'LongContactName'.repeat(5);
  await incomingContact.getByLabel('Shared contact name', {exact:true}).fill(contactName);
  await incomingContact.getByLabel('Shared contact phone', {exact:true}).fill('+62 812-3456-7890');
  await outgoingContact.getByLabel('Shared contact name', {exact:true}).fill('Maya');
  await outgoingContact.getByRole('combobox', {name:'Contact type',exact:true}).click();
  await page.getByRole('option', {name:'Not registered on WhatsApp',exact:true}).click();
  await page.evaluate(() => {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
    canvas.getContext('2d').fillRect(0,0,32,32);
    window.update({messages:window.data.messages.map((message,index)=>index===0?{...message,sharedContactAvatar:canvas.toDataURL()}:message)});
  });
  assert.equal(await page.locator('[data-contact-card]').count(),2);
  assert((await page.locator('[data-contact-card]').first().textContent()).includes('+62 812-3456-7890'));
  assert.equal(await page.locator('[data-contact-actions]').first().getByText('Save Contact', {exact:true}).count(),1);
  assert.equal(await page.locator('[data-contact-actions]').last().getByText('Invite to WhatsApp', {exact:true}).count(),1);
  await incomingContact.getByLabel('Show contact avatar', {exact:true}).uncheck();
  assert.equal(await page.locator('[data-contact-card]').first().locator('[data-contact-avatar]').count(),0);
  await incomingContact.getByLabel('Show contact avatar', {exact:true}).check();
  await incomingContact.getByTitle('Recall / Delete Message', {exact:true}).click();
  assert.equal(await page.locator('[data-contact-card]').count(),1);
  await incomingContact.getByTitle('Restore Message', {exact:true}).click();
  assert.equal(await page.locator('[data-contact-card]').count(),2);
  await outgoingContact.getByTitle('Recalled / Deleted', {exact:true}).click();
  assert.equal(await page.locator('[data-contact-card]').count(),1);
  await outgoingContact.getByTitle('Read (Double blue check)', {exact:true}).click();
  assert.equal(await page.locator('[data-contact-card]').count(),2);
  await page.reload();
  await page.locator('[data-contact-card]').first().waitFor();
  assert.equal(await incomingContact.getByLabel('Shared contact name', {exact:true}).inputValue(),contactName);
  assert((await outgoingContact.getByRole('combobox', {name:'Contact type',exact:true}).textContent()).includes('Not registered on WhatsApp'));
  assert((await page.evaluate(() => window.data.messages[0].sharedContactAvatar)).startsWith('data:image/png'));
  await page.getByRole('button', {name:'Me (Right)',exact:true}).click();
  const replyEditor = page.locator('[data-sync-theme]').last();
  await replyEditor.getByLabel('Reply Quote Box', {exact:true}).check();
  await replyEditor.getByRole('combobox').last().click();
  await page.getByRole('option').filter({hasText:/^#1 /}).click();
  assert.equal(await page.evaluate(() => window.data.messages.at(-1).replyToText),contactName);
  for (const theme of ['light','dark']) {
    await page.evaluate(theme => window.update({theme}),theme);
    for (const width of [1000,390]) {
      await page.setViewportSize({width,height:900});
      for (const card of await page.locator('[data-contact-card]').all()) {
        assert.equal(await card.evaluate(element=>element.scrollWidth<=element.clientWidth+1),true,'Contact content must fit');
      }
      await page.locator('[data-preview-canvas]').screenshot({path:join(tmpdir(),'au-contact-'+theme+'-'+width+'.png')});
    }
  }
  await page.evaluate(() => window.setTestLanguage('id'));
  await page.locator('[data-contact-actions]').first().getByText('Simpan Kontak', {exact:true}).waitFor();
  assert.equal(await page.locator('[data-contact-actions]').last().getByText('Undang ke WhatsApp', {exact:true}).count(),1);
  for (const format of ['png','jpeg']) {
    const contactExport = await page.evaluate(format => window.exportContact(format),format);
    assert(contactExport.success && contactExport.dataUrl.startsWith('data:image/'+format), 'Contact '+format+' export must succeed');
  }
  await page.evaluate(() => window.setTestLanguage('en'));
  await replyEditor.getByRole('group',{name:'Reply type',exact:true}).getByRole('button',{name:'Status',exact:true}).click();
  await replyEditor.getByLabel('Status owner name',{exact:true}).fill('You');
  await replyEditor.getByLabel('Status caption',{exact:true}).fill('contoh');
  await replyEditor.getByLabel('Show photo icon',{exact:true}).check();
  await page.evaluate(() => {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const context=canvas.getContext('2d');context.fillStyle='#de329b';context.fillRect(0,0,64,64);
    context.fillStyle='#fff';context.fillRect(10,10,44,12);
    window.update({messages:window.data.messages.map((message,index)=>index===2?{...message,statusReplyImage:canvas.toDataURL()}:message)});
  });
  const statusQuote=page.locator('[data-status-reply]');
  assert.equal(await statusQuote.count(),1);
  assert((await statusQuote.textContent()).includes('You'));
  assert((await statusQuote.textContent()).includes('contoh'));
  assert.equal(await statusQuote.locator('[data-status-thumbnail]').count(),1);
  assert.equal(await statusQuote.locator('[data-status-media-icon]').count(),1);
  await replyEditor.getByRole('group',{name:'Reply type',exact:true}).getByRole('button',{name:'Message',exact:true}).click();
  assert.equal(await statusQuote.count(),0);
  assert.equal(await page.evaluate(()=>window.data.messages.at(-1).replyToText),contactName);
  await replyEditor.getByRole('group',{name:'Reply type',exact:true}).getByRole('button',{name:'Status',exact:true}).click();
  await page.reload();await statusQuote.waitFor();
  assert.equal(await replyEditor.getByLabel('Status caption',{exact:true}).inputValue(),'contoh');
  const savedStatus=await page.evaluate(()=>window.data.messages.at(-1));
  await replyEditor.getByRole('button',{name:'Clear Quote',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>{
    const message=window.data.messages.at(-1);
    return [message.replyType,message.statusReplyName,message.statusReplyCaption,message.statusReplyImage,message.replyToMessageId,message.showMediaIndicator];
  }),['message','','','','',false]);
  assert.equal(await statusQuote.count(),0);
  await page.evaluate(savedStatus=>window.update({messages:window.data.messages.map((message,index)=>index===2?savedStatus:message)}),savedStatus);
  await replyEditor.getByLabel('Reply Quote Box',{exact:true}).uncheck();
  assert.equal(await statusQuote.count(),0);
  assert.equal(await page.evaluate(()=>window.data.messages.at(-1).statusReplyImage),'');
  await page.evaluate(savedStatus=>window.update({messages:[
    {...savedStatus,id:'status-incoming',sender:'incoming',text:'Received message',replyToText:'',replyToSender:''},
    {...savedStatus,id:'status-outgoing',sender:'outgoing',text:'Reply to status',replyToText:'',replyToSender:'',statusReplyName:'Long status owner '.repeat(8),statusReplyCaption:'Long caption '.repeat(20)},
  ]}),savedStatus);
  for(const theme of ['light','dark']){
    await page.evaluate(theme=>window.update({theme}),theme);
    for(const width of [1000,390,320]){
      await page.setViewportSize({width,height:900});
      assert.equal(await statusQuote.count(),2);
      for(const element of await statusQuote.all()){
        assert.equal(await element.evaluate(element=>element.scrollWidth<=element.clientWidth+1),true,'Status quote must fit its bubble');
        const thumbnail=await element.locator('[data-status-thumbnail]').boundingBox();
        assert.equal(thumbnail.width,48);assert.equal(thumbnail.height,48);
      }
      await page.locator('[data-preview-canvas]').screenshot({path:join(tmpdir(),'au-status-reply-'+theme+'-'+width+'.png')});
    }
  }
  await page.evaluate(()=>window.update({messages:window.data.messages.map(message=>({...message,statusReplyImage:'',showMediaIndicator:false}))}));
  assert.equal(await statusQuote.locator('[data-status-thumbnail]').count(),0);
  assert.equal(await statusQuote.locator('[data-status-media-icon]').count(),0);
  await page.evaluate(()=>window.setTestLanguage('id'));
  assert.equal(await page.getByLabel('Nama pemilik status',{exact:true}).count(),2);
  for(const format of ['png','jpeg']){
    const exported=await page.evaluate(format=>window.exportContact(format),format);
    assert(exported.success&&exported.dataUrl.startsWith('data:image/'+format),'Status reply '+format+' export must succeed');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS WhatsApp form: VN controls/persistence/export, light/dark/mobile, divider add/reorder/delete, system notice, reply selection/clear, custom theme save/reload/delete');
  console.log(`Screenshots: ${join(tmpdir(),'au-vn-light.png')}, ${join(tmpdir(),'au-vn-dark.png')}, ${join(tmpdir(),'au-vn-mobile.png')}`);
  console.log('PASS contact cards: incoming/outgoing, name/phone/avatar, registered/invite, recall/restore, reload, quote, ID/EN, light/dark/mobile, PNG/JPEG export');
  console.log('PASS status replies: message/status switching, owner/caption/thumbnail/icon, drafts/reload, clear/disable, incoming/outgoing, long text, light/dark/320px, ID/EN, PNG/JPEG export');
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await vite.close();
}
