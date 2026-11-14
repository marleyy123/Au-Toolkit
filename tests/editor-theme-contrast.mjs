import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium,webkit} from 'playwright-core';
import {createServer as createViteServer} from 'vite';

const vite=await createViteServer({server:{port:0},logLevel:'silent'});
let server;
try{
  await vite.listen();
  const css=await(await fetch(vite.resolvedUrls.local[0]+'src/index.css?direct')).text();
  const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
    import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
    import {FormRegistry} from './src/export/FormRegistry';
    import {getInitialTabData,ALL_PLATFORM_TABS} from './src/features/workspace/workspaceStorage';
    import {ThemeContext} from './src/context/ThemeContext';import {LanguageContext} from './src/context/LanguageContext';
    const params=new URLSearchParams(location.search);const tab=params.get('tab')||'whatsapp-chat';
    const dark=params.get('theme')==='dark';document.documentElement.classList.toggle('dark',dark);
    function App(){const [data,setData]=useState(()=>getInitialTabData(tab));window.tabs=ALL_PLATFORM_TABS;
      return <ThemeContext.Provider value={{isDark:dark,uiTheme:dark?'dark':'light',setUiTheme:()=>{},toggleTheme:()=>{}}}>
      <LanguageContext.Provider value={{language:'en',isId:false,t:key=>key,setLanguage:()=>{}}}>
        <div className={'au-editor'+(dark?' dark':'')} style={{padding:20}}>
          <div id="customization-panel" style={{width:520,maxWidth:'100%'}}>
            <FormRegistry activeTab={tab} data={data} onChange={setData} characters={[]} onSaveCharacter={()=>{}} onSelectCharacter={()=>{}} />
          </div>
          <div id="preview-panel"><div data-preview-canvas="true" style={{background:'#fff'}}><span id="preview-probe" className="text-slate-900 dark:text-white" style={{background:'#fff'}}>Preview text</span></div></div>
        </div>
      </LanguageContext.Provider></ThemeContext.Provider>;
    }createRoot(document.getElementById('root')).render(<App/>);
  `},bundle:true,write:false,format:'iife',loader:{'.css':'empty'},plugins:[{name:'mock-auth',setup(builder){
    builder.onLoad({filter:/[\\/]firebase\.ts$/},()=>({contents:'export const auth={currentUser:null};export const getStoredAuthUser=()=>null;',loader:'ts'}));
    builder.onLoad({filter:/[\\/]storageService\.ts$/},()=>({contents:'export const uploadMediaAsset=async()=>{throw new Error("Uploads disabled in theme test");};',loader:'ts'}));
  }}]});
  server=createServer((req,res)=>{
    res.setHeader('content-type',req.url==='/app.js'?'text/javascript':req.url==='/app.css'?'text/css':'text/html');
    res.end(req.url==='/app.js'?bundle.outputFiles[0].text:req.url==='/app.css'?css:'<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script>');
  });await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const findings=[];
  for(const engine of process.argv.includes('--survey')?['chrome']:['chrome','webkit']){
    const browser=await(engine==='chrome'?chromium.launch({channel:'msedge',headless:true}):webkit.launch({headless:true}));
    try{
      const page=await browser.newPage({viewport:{width:1100,height:900}});
      await page.route('https://**/*',route=>route.abort());
      await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.tabs&&document.querySelector('#customization-panel')?.textContent.trim());
      const tabs=await page.evaluate(()=>window.tabs);
      for(const system of ['light','dark']){
        await page.emulateMedia({colorScheme:system});
        for(const theme of ['light','dark'])for(const tab of tabs){
          await page.goto('http://127.0.0.1:'+server.address().port+'/?tab='+tab+'&theme='+theme,{waitUntil:'domcontentloaded'});
          await page.waitForFunction(()=>window.tabs&&document.querySelector('#customization-panel')?.textContent.trim());
          if(tab==='whatsapp-chat'){
            for(const label of ['Date Divider','Unread Divider','System Notice'])await page.getByRole('button',{name:label,exact:true}).click();
          }
          const result=await page.evaluate(()=>{
            const context=document.createElement('canvas').getContext('2d',{willReadFrequently:true});
            function rgba(color){context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].map((value,index)=>index===3?value/255:value/255);}
            const mix=(top,bottom)=>[0,1,2].map(index=>top[index]*top[3]+bottom[index]*(1-top[3]));
            const lum=color=>color.slice(0,3).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
            const bad=[];
            for(const element of document.querySelectorAll('#customization-panel *')){
              const text=[...element.childNodes].filter(node=>node.nodeType===3).map(node=>node.textContent).join('').trim();
              if(!text||element.closest('svg, [data-preview-canvas], button:disabled, [aria-disabled="true"]'))continue;
              const rect=element.getBoundingClientRect();const style=getComputedStyle(element);
              if(rect.width<1||rect.height<1||style.visibility==='hidden'||style.display==='none')continue;
              const chain=[];let node=element;while(node){chain.unshift(node);node=node.parentElement;}
              let background=[1,1,1];let opacity=1;let gradient=false;
              for(const parent of chain){const css=getComputedStyle(parent);background=mix(rgba(css.backgroundColor),background);opacity*=Number(css.opacity);gradient ||= css.backgroundImage!=='none';}
              if(opacity<.5||gradient)continue;
              const foreground=rgba(style.color);foreground[3]*=opacity;
              const a=lum(mix(foreground,background)),b=lum(background);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
              if(ratio<2.2)bad.push({text:text.slice(0,75),className:element.className,color:style.color,ratio:Number(ratio.toFixed(2))});
            }
            return {bad,previewColor:getComputedStyle(document.getElementById('preview-probe')).color};
          });
          if(result.bad.length)findings.push({engine,system,theme,tab,...result});
          if(!process.argv.includes('--survey'))assert.notEqual(result.previewColor,'rgb(255, 255, 255)','Editor theme must not recolor the preview');
          if(tab==='whatsapp-chat'&&system==='light')await page.screenshot({path:join(tmpdir(),'au-editor-theme-'+engine+'-'+theme+'.png'),fullPage:true});
        }
      }
      await page.close();
    }finally{await browser.close();}
  }
  await writeFile(join(tmpdir(),'au-editor-theme-findings.json'),JSON.stringify(findings,null,2));
  console.log(JSON.stringify({failingCases:findings.length,samples:findings.slice(0,8)},null,2));
  if(!process.argv.includes('--survey'))assert.equal(findings.length,0,'Editor text loses contrast after theme changes; see au-editor-theme-findings.json');
}finally{if(server)await new Promise(done=>server.close(done));await vite.close();}
