import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium, webkit } from 'playwright-core';
import { createServer as createViteServer } from 'vite';

const vite = await createViteServer({ server: { port: 0 }, logLevel: 'silent' });
let server;
try {
  await vite.listen();
  const css = await (await fetch(`${vite.resolvedUrls.local[0]}src/index.css?direct`)).text();
  const bundle = await build({stdin: {resolveDir:process.cwd(),loader:'tsx',contents:`
    import React,{useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {Select} from './src/components/ui/Select';
    import {ThemeContext} from './src/context/ThemeContext';
    function App(){
      const [value,setValue]=useState('');
      const [dark,setDark]=useState(false);
      window.value=value;
      const options=Array.from({length:35},(_,index)=><option key={index} value={'font-'+index}>Font {index}: A long font name for dropdown sizing</option>);
      return <ThemeContext.Provider value={{isDark:dark,uiTheme:dark?'dark':'light',setUiTheme:()=>{},toggleTheme:()=>setDark(!dark)}}>
        <div className={'au-editor'+(dark?' dark':'')} style={{padding:16,minHeight:'100vh',background:dark?'#18171c':'#f8f8fa',color:dark?'white':'black'}}>
          <button id="theme" onClick={()=>setDark(!dark)}>Theme</button><button id="outside">Outside</button>
          <div id="customization-panel" style={{width:280,maxWidth:'100%',marginTop:16,height:100,overflow:'hidden'}}>
            <label style={{display:'block',fontSize:12,marginBottom:5}}>Font family</label>
            <Select className="px-3 py-2 text-xs" value={value} onValueChange={setValue}>
              <option value="">System default</option>
              <optgroup label="Standard fonts"><option value="inter">Inter</option><option value="poppins">Poppins</option><option value="blocked" disabled>Unavailable</option></optgroup>
              <optgroup label="Disabled group" disabled><option value="group-blocked">Blocked font</option></optgroup>
              <optgroup label="Custom fonts">{options}</optgroup>
            </Select>
          </div>
          <label style={{display:'block',marginTop:20}}>Waveform
            <Select className="px-3 py-2 text-xs" value="" onValueChange={()=>{}}>
              <option value="" disabled hidden>Choose waveform</option><option value="natural">Natural</option>
            </Select>
          </label>
          <Select aria-label="Disabled selector" disabled value="" onValueChange={()=>{}}><option value="">Disabled</option></Select>
        </div>
      </ThemeContext.Provider>;
    }
    createRoot(document.getElementById('root')).render(<App/>);
  `},bundle:true,write:false,format:'iife'});
  server=createServer((req,res)=>{
    res.setHeader('content-type',req.url==='/app.js'?'text/javascript':req.url==='/app.css'?'text/css':'text/html');
    res.end(req.url==='/app.js'?bundle.outputFiles[0].text:req.url==='/app.css'?css:'<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  for(const engine of ['chrome','webkit']){
    const browser=await(engine==='chrome'?chromium.launch({channel:'msedge',headless:true}):webkit.launch({headless:true}));
    try{
      for(const width of [1000,390,320]){
        const page=await browser.newPage({viewport:{width,height:700}});
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.goto('http://127.0.0.1:'+server.address().port);
        const trigger=page.getByRole('combobox',{name:'Font family',exact:true});
        await trigger.focus();await trigger.press('ArrowDown');
        await page.getByRole('listbox').waitFor();
        assert.equal(await page.getByRole('option',{name:'Unavailable',exact:true}).getAttribute('aria-disabled'),'true');
        assert.equal(await page.getByRole('option',{name:'Blocked font',exact:true}).getAttribute('aria-disabled'),'true');
        await page.getByRole('option',{name:'Inter',exact:true}).click();
        assert.equal(await page.evaluate(()=>window.value),'inter');
        assert.equal(await trigger.evaluate(element=>element===document.activeElement),true);
        await trigger.click();await page.getByRole('listbox').press('p');
        await page.waitForFunction(()=>document.activeElement?.textContent==='Poppins');
        await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(()=>window.value),'poppins');
        await trigger.click();await page.getByRole('option',{name:'System default',exact:true}).click();
        assert.equal(await page.evaluate(()=>window.value),'');
        await trigger.click();await page.keyboard.press('Escape');
        assert.equal(await page.getByRole('listbox').count(),0);
        await page.getByRole('combobox',{name:'Waveform',exact:true}).click();
        assert.equal(await page.getByRole('option',{name:'Choose waveform',exact:true}).count(),0);
        await page.keyboard.press('Escape');
        assert.equal(await page.getByRole('combobox',{name:'Disabled selector',exact:true}).isDisabled(),true);
        for(const dark of [false,true]){
          if(dark)await page.locator('#theme').click();
          await trigger.click();
          const menu=page.getByRole('listbox');
          const box=await menu.boundingBox();
          assert(box.x>=0&&box.x+box.width<=width+1&&box.y+box.height<=701,'Menu fits viewport');
          assert.equal(await menu.evaluate(element=>element.getAttribute('data-theme')),dark?'dark':'light');
          assert.equal(await menu.evaluate(element=>element.scrollWidth<=element.clientWidth+1),true);
          await page.screenshot({path:join(tmpdir(),
            'au-select-'+engine+'-'+width+'-'+(dark?'dark':'light')+'.png')});
          await page.keyboard.press('End');await page.keyboard.press('Enter');
          assert.equal(await page.evaluate(()=>window.value),'font-34');
        }
        assert.deepEqual(errors,[]);
        console.log('PASS',engine,width,'dropdown: groups, empty/hidden/disabled, typeahead, keyboard/focus, light/dark, viewport, portal');
        await page.close();
      }
    }finally{await browser.close();}
  }
}finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  await vite.close();
}
