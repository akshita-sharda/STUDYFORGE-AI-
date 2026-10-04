const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const c=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce'});
await c.addInitScript(()=>localStorage.setItem('studyforge_token','mock'));
await c.route('**/api/**',r=>r.fulfill({json:new URL(r.request().url()).pathname==='/api/auth/me'?{user:{name:'Ada',email:'ada@example.test',subjects:['DSA'],study_goal:'Exams',explanation_style:'simple',difficulty:'medium',theme:'pastel'}}:[]}));
const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000');await p.getByRole('button',{name:'Open Profile Setup'}).waitFor();
const toggle=p.getByRole('button',{name:'Dark mode',exact:true});await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(21, 19, 29)');
await p.screenshot({path:path.join(__dirname,'../data/dark-dashboard.png'),fullPage:true});
await p.reload();await p.getByRole('button',{name:'Open Profile Setup'}).click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');await p.screenshot({path:path.join(__dirname,'../data/dark-profile.png'),fullPage:true});
await toggle.click();await p.reload();assert.equal(await toggle.getAttribute('aria-pressed'),'false');assert.deepEqual(errors,[]);
const sys=await browser.newContext({colorScheme:'dark'});const q=await sys.newPage();await q.goto('http://localhost:3000');await q.waitForFunction(()=>document.documentElement.dataset.theme==='dark');await sys.close();
const blocked=await browser.newContext({colorScheme:'dark'});await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')};});const b=await blocked.newPage();await b.goto('http://localhost:3000');await b.getByRole('button',{name:'Dark mode',exact:true}).click();await b.waitForFunction(()=>document.documentElement.dataset.theme==='light');
console.log('PASS: toggle, reload persistence, OS default, blocked-storage fallback, desktop screenshots, no client errors.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
