import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const ids = ['16NKN_XpFDeSR396xMHMC77rLlWZ7ZJ1SfPzp5TncK6k',
  '1pnOVwfeAnuOJzcByPR18tlTaJdL4xgVmFjXyuy6gE6A',
  '1ez3-ilO4rAXXWaXRBn2Dsl6IN6zXW5wb8JACIQbByTs'];
const source = await readFile('apps-script/au-toolkit-access-staging.gs', 'utf8');
assert(!source.includes('1nNzq6PVrbJQmLbcDMTTgXChaZO44tVjafSWDYwbTc88'));
let sequence = 1;
class Sheet {
  constructor(parent, name='Sheet1') {this.parent=parent; this.name=name; this.rows=[]; this.id=sequence++;}
  getName() {return this.name;}
  setName(name) {this.name=name; return this;}
  getSheetId() {return this.id;}
  getParent() {return this.parent;}
  getMaxRows() {return 1000;}
  getLastRow() {return this.rows.length;}
  getLastColumn() {return Math.max(0,...this.rows.map(row=>row.length));}
  setFrozenRows() {return this;}
  setColumnWidths() {return this;}
  setColumnWidth() {return this;}
  getRange(row, column, height=1, width=1) {
    const sheet=this;
    const range={
      getValues:()=>Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>sheet.rows[row-1+r]?.[column-1+c]??'')),
      getDisplayValues:()=>range.getValues().map(row=>row.map(String)),
      getValue:()=>range.getValues()[0][0],
      getDisplayValue:()=>String(range.getValue()),
      setValues(values) {
        assert.equal(values.length,height); values.forEach((values,r)=>{
          assert.equal(values.length,width);
          while(sheet.rows.length<row+r) sheet.rows.push([]);
          values.forEach((value,c)=>{sheet.rows[row-1+r][column-1+c]=value;});
        }); return range;
      },
      setValue:value=>range.setValues([[value]]),
      setNumberFormat:()=>range, setFontWeight:()=>range, setBackground:()=>range, setWrap:()=>range,
    };
    return range;
  }
}
const books=new Map(ids.map(id=>{
  const book={timezone:'Asia/Jakarta',getSheets(){return this.sheets;},getSheetByName(name){return this.sheets.find(s=>s.name===name);},
    insertSheet(name){const s=new Sheet(this,name);this.sheets.push(s);return s;},
    setSpreadsheetTimeZone(value){this.timezone=value;},getSpreadsheetTimeZone(){return this.timezone;}};
  book.sheets=[new Sheet(book)];return [id,book];
}));
const properties=new Map();
const opened=[];
const context=vm.createContext({Date,console:{log(){},error:console.error},
  SpreadsheetApp:{openById(id){opened.push(id); assert(ids.includes(id),'Only staging IDs allowed');return books.get(id);},flush(){}},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties.get(key)||null,setProperty:(key,value)=>properties.set(key,value)})},
  Utilities:{getUuid:()=> '01234567-89ab-cdef-0123-456789abcdef',formatDate(date,timezone,pattern){
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
    return pattern==='yyyy-MM-dd'?`${p.year}-${p.month}-${p.day}`:`${p.day}-${p.month}-${p.year}${pattern.includes('HH:mm')?` ${p.hour}:${p.minute}`:''}`;
  }},
  ContentService:{MimeType:{JSON:'application/json'},createTextOutput:value=>({setMimeType(){return this;},getContent:()=>value})},
});
vm.runInContext(source,context);
context.setupStagingSpreadsheets();
const regular=books.get(ids[0]).sheets[0], fast=books.get(ids[1]).sheets[0], access=books.get(ids[2]).sheets[0];
assert.equal(regular.name,'AU Toolkit PRO'); assert.equal(fast.name,'Fast Track'); assert.equal(access.name,'AU Access');
for(const sheet of [regular,fast]) {
  assert.equal(sheet.rows[0].length,26);
  for(const [i,value] of [[14,'Tanggal'],[15,'Status'],[16,'Buyer Email'],[17,'Buyer Name'],[25,'Ref']]) assert.equal(sheet.rows[0][i],value);
}
assert.equal(access.rows[0].length,12);
assert.equal(properties.get('API_SHARED_SECRET').length,64);
context.setupStagingSpreadsheets();
assert.equal(books.get(ids[0]).sheets.length,1,'Setup must reuse empty default tab');
assert.equal(context.seedStagingTestBuyers().added,4);
assert.equal(access.getLastRow(),4,'Only successful orders are imported');
assert.equal(context.seedStagingTestBuyers().added,0,'Seeding is idempotent');
assert.equal(access.getLastRow(),4);
const transactions=JSON.stringify([regular.rows,fast.rows]);
assert.equal(context.checkBuyerEmail({email:'regular.test@example.com'}).reason,'BUYER_EMAIL_OK');
assert.equal(context.checkBuyerEmail({email:'fasttrack.test@example.com'}).reason,'BUYER_EMAIL_OK');
assert.equal(context.checkBuyerEmail({email:'expired.test@example.com'}).reason,'ACCOUNT_EXPIRED');
assert.equal(context.checkBuyerEmail({email:'pending.test@example.com'}).reason,'ORDER_NOT_SUCCESS');
assert.equal(context.checkBuyerEmail({email:'missing.test@example.com'}).reason,'BUYER_NOT_FOUND');
const payload={email:'regular.test@example.com',deviceType:'desktop',deviceId:'dev_desktop_staging_12345678',deviceLabel:'Testing Laptop'};
assert.equal(context.validateAccess(payload).reason,'ACCESS_GRANTED');
assert.equal(context.validateAccess({...payload,deviceId:'dev_desktop_staging_87654321'}).reason,'DEVICE_MISMATCH');
const record=access.rows.find(row=>row[0]===payload.email);record[5]='Inactive';
assert.equal(context.validateAccess(payload).reason,'ACCOUNT_INACTIVE');
assert.equal(JSON.stringify([regular.rows,fast.rows]),transactions,'Normal access validation must not write transaction sources');
assert.equal(JSON.parse(context.doPost({postData:{contents:JSON.stringify(payload)}}).getContent()).reason,'UNAUTHORIZED');
assert.equal(JSON.parse(context.doGet().getContent()).environment,'staging');
properties.set('LYNK_TEST_PRODUCT_UUID','test-product-uuid');
const webhookTransaction={ref:'LYNK-TEST-001',email:'webhook.test@example.com',name:'Webhook Tester',purchasedAt:new Date().toISOString(),productId:'test-product-uuid'};
const webhookPayload={action:'ingestLynkPurchase',serverSecret:properties.get('API_SHARED_SECRET'),transaction:webhookTransaction};
const webhookCall=payload=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(payload)}}).getContent());
const priorTransactions=regular.getLastRow();
assert.equal(webhookCall({...webhookPayload,serverSecret:'wrong'}).reason,'UNAUTHORIZED');
assert.equal(regular.getLastRow(),priorTransactions);
assert.equal(webhookCall({...webhookPayload,transaction:{...webhookTransaction,productId:'other'}}).reason,'WEBHOOK_PRODUCT_NOT_ALLOWED');
assert.equal(webhookCall(webhookPayload).status,'PURCHASE_SYNCED');
assert.equal(regular.getLastRow(),priorTransactions+1);
const webhookAccess=access.rows.find(row=>row[0]===webhookTransaction.email);
assert(webhookAccess,'Webhook sync must create AU Access without a scheduled trigger');
webhookAccess[8]='saved-phone-device';
assert.equal(webhookCall(webhookPayload).duplicate,true);
assert.equal(regular.getLastRow(),priorTransactions+1);
assert.equal(webhookAccess[8],'saved-phone-device');
assert.equal(webhookCall({...webhookPayload,transaction:{...webhookTransaction,email:'other@example.com'}}).reason,'TRANSACTION_CONFLICT');
assert.equal(webhookCall({...webhookPayload,transaction:{...webhookTransaction,ref:'=formula'}}).reason,'INVALID_WEBHOOK_PURCHASE');
assert.equal(webhookCall({...webhookPayload,transaction:{...webhookTransaction,ref:'bad-date',purchasedAt:'2026-02-30T00:00:00.000Z'}}).reason,'INVALID_WEBHOOK_DATE');
const originalEnsure=context.ensureSubscriptionData;
context.ensureSubscriptionData=()=>{throw new Error('simulated sync interruption');};
const interrupted={...webhookPayload,transaction:{...webhookTransaction,ref:'LYNK-RETRY-001'}};
assert.equal(webhookCall(interrupted).reason,'BACKEND_ERROR');
const afterInterruption=regular.getLastRow();
context.ensureSubscriptionData=originalEnsure;
assert.equal(webhookCall(interrupted).duplicate,true);
assert.equal(regular.getLastRow(),afterInterruption,'Retry heals access without another transaction');
regular.rows[0][14]='Wrong header';
assert.throws(()=>context.setupStagingSpreadsheets(),/Setup tidak akan menimpa/);
assert.equal(regular.rows[0][14],'Wrong header');
regular.rows[0][14]='Tanggal';
vm.runInContext("CONFIG.SPREADSHEET_ID='production-project-id';",context);
const before=opened.length;
assert.throws(()=>context.setupStagingSpreadsheets(),/STAGING_ONLY/);
assert.throws(()=>context.checkBuyerEmail({email:payload.email}),/STAGING_ONLY/);
assert.equal(opened.length,before,'Guard must reject before opening any spreadsheet');
console.log('PASS staging setup: schema, idempotence, secret, dummy subscriptions, device lock, inactive/expired/pending, read-only transactions and production isolation');
