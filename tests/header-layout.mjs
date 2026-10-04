import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';

const bundle = await build({stdin: {contents: `
  import React from 'react';
  import {createRoot} from 'react-dom/client';
  import {AppHeader} from './src/features/workspace/components/AppHeader';
  const noop=()=>{};
  const params=new URLSearchParams(location.search);
  createRoot(document.getElementById('root')).render(<AppHeader
    uiTheme={params.get('theme')} language={params.get('language')}
    activeCategory="whatsapp" activeTab="whatsapp-chat" mobileView="editor"
    authUser={{displayName:'A very long account display name',email:'test@example.com'}}
    isLoggingOut={params.has('loading')} isMobileFloatingPreviewOpen={false}
    toggleLanguage={noop} handleToggleTheme={noop} handleLogout={()=>window.loggedOut=true}
    setActiveCategory={noop} setActiveTab={noop} setMobileView={noop}
    setMobileFloatingPreviewOpen={noop} setIsPasswordModalOpen={noop} setIsResetConfirmOpen={noop}
  />);
`, resolveDir: process.cwd(), loader: 'tsx'}, bundle:true, write:false, format:'iife'});
const assets=await readdir('dist/assets');
const css=(await readFile('dist/assets/'+assets.find(f=>f.endsWith('.css')), 'utf8')).replace(/@import[^;]+;/g,'');
const server=createServer((req,res)=>{
  res.setHeader('Content-Type',req.url==='/bundle.js'?'application/javascript':req.url==='/style.css'?'text/css':'text/html');
  res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:req.url==='/style.css'?css:
    '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const width of [320,390,640,800,1024,1280,1366,1920]) {
    for(const language of ['en','id']) {
      for(const loading of [false,true]) {
        const page=await browser.newPage({viewport:{width,height:900}});
        await page.goto(`http://127.0.0.1:${server.address().port}/?theme=${language==='en'?'light':'dark'}&language=${language}${loading?'&loading=1':''}`);
        const logout=page.locator('#btn-account-logout');
        await logout.waitFor();
        const box=await logout.boundingBox();
        assert(box.x>=0 && box.x+box.width<=width, `Logout clipped: ${width}/${language}/${loading}`);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `Page overflow: ${width}`);
        if(!loading) {
          await logout.click();
          assert(await page.evaluate(()=>window.loggedOut), 'Logout callback missing');
        }
        if(language==='en' && !loading && [390,1024,1366].includes(width)) {
          await page.screenshot({path:`dist/header-${width}.png`});
        }
        await page.close();
      }
    }
  }
  console.log('Header: 32 viewport/language/loading cases passed; logout visible and clickable.');
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
