const {chromium}=require('playwright');
const http=require('node:http');const assert=require('node:assert/strict');
(async()=>{
 let mode='success',ended=false,requests=[];
 const server=http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','authorization,content-type');res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  let body='';req.on('data',x=>body+=x);req.on('end',()=>{
   requests.push(JSON.parse(body));ended=false;
   res.writeHead(200,{'Content-Type':'application/x-ndjson'});
   res.write(JSON.stringify({type:'delta',text:'First visible chunk.'})+'\n');
   const timer=setTimeout(()=>{
    ended=true;
    if(mode==='error') res.end(JSON.stringify({type:'error',message:'Gemini is busy.'})+'\n');
    else if(mode==='donehang') res.write(JSON.stringify({type:'done',answer:'Complete without waiting for connection close.',sources:[],mode:'ai'})+'\n');
    else res.end(JSON.stringify({type:'delta',text:' Final answer.'})+'\n'+JSON.stringify({type:'done',answer:'First visible chunk. Final answer.',sources:[],mode:'ai'})+'\n');
   },mode==='stop'?10000:2000);
   res.on('close',()=>clearTimeout(timer));
  });
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:1280,height:900}});await context.addInitScript(()=>localStorage.setItem('studyforge_token','mock'));
 let saved=[];const chats={};let failList=false;
 await context.route('**/api/**',async r=>{
  const p=new URL(r.request().url()).pathname;
  if(p==='/api/chat/stream')return r.continue({url:`http://127.0.0.1:${server.address().port}${p}`});
  if(p==='/api/study/conversations'&&failList)return r.fulfill({status:503,json:{detail:'List unavailable'}});
  let data=[];
  if(p==='/api/auth/me')data={user:{name:'Student',email:'s@example.test',subjects:[],study_goal:'',difficulty:'medium',theme:'pastel',explanation_style:'simple'}};
  else if(p==='/api/study/summary')data={tasks:[],conversations:[],documents:0,subjects:0,topics:[]};
  else if(p==='/api/chat/status')data={configured:true};
  else if(p.startsWith('/api/study/conversations/')){if(r.request().method()==='PUT'){saved.push(r.request().postDataJSON());data={saved:true};}}
  await r.fulfill({json:data});
 });
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:3000');await p.getByRole('button',{name:/Ask ASHIEY/}).click();
 async function send(text){await p.getByLabel('Your message').fill(text);await p.getByRole('button',{name:'Send message',exact:true}).click();}
 await send('What is a stack?');
 await p.locator('.chat-message.assistant').filter({hasText:'First visible chunk.'}).waitFor();assert.equal(ended,false,'Text must appear before stream ends');
 await p.getByRole('button',{name:'Send message',exact:true}).waitFor();assert.equal(saved.length,1);
 mode='error';await send('Explain further');await p.getByRole('alert').filter({hasText:'Gemini is busy.'}).waitFor();assert.equal(await p.getByLabel('Your message').inputValue(),'Explain further');assert.equal(saved.length,1);await p.getByText('Incomplete reply · retry your question to get a complete answer.').waitFor();
 mode='stop';await send('Try once more');await p.locator('.chat-message.assistant').last().filter({hasText:'First visible chunk.'}).waitFor();await p.getByRole('button',{name:'Stop',exact:true}).click();await p.locator('p.error').waitFor();  assert.match(await p.locator('p.error').innerText(),/Request stopped/);
 assert.equal(requests[2].history.length,2,'Interrupted turns must not be resent as completed history');
 assert.equal(saved.length,1);assert.equal(requests.length,3,'Stop must not accidentally submit again');assert.deepEqual(errors,[]);
 mode='donehang';failList=true;await send('Finish without closing');await p.getByRole('button',{name:'Send message',exact:true}).waitFor();assert.equal(saved.length,2);await p.getByText('Conversation saved',{exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:'Retry save'}).count(),0);
 console.log('PASS: completion marker without EOF, independent save/list handling, incremental display before completion, saved complete replies, partial error, cancellation, and clean retry history.');
 } finally {await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
