const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, permissions: ['clipboard-read','clipboard-write'] });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let subjects = [], docs = [], topics = [], tasks = [], chats = {}, lastMode = '';
  const user = {name:'UI Test', email:'test@example.test', subjects:[], study_goal:'', branch:'Computer Science & Engineering', semester:4, explanation_style:'simple', difficulty:'medium', theme:'pastel'};
  await context.addInitScript(() => localStorage.setItem('studyforge_token','browser-mock'));
  // Every API call is intercepted: this test does not modify the real database or call Gemini.
  await context.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname, method = req.method();
    const data = req.headers()['content-type']?.includes('application/json') && req.postData() ? req.postDataJSON() : {};
    let result = {};
    if (path === '/api/auth/me') result = { user };
    else if (path === '/api/study/tasks' && method === 'GET') result=tasks;
    else if (path === '/api/study/tasks') {result={id:'task'+(tasks.length+1),status:'pending',...data};tasks.push(result);}
    else if (path.startsWith('/api/study/tasks/')) {const id=path.split('/').pop();if(method==='DELETE')tasks=tasks.filter(t=>t.id!==id);else tasks=tasks.map(t=>t.id===id?{...t,...data}:t);result={saved:true};}
    else if (path === '/api/study/library') result = {subjects, documents:docs};
    else if (path === '/api/study/subjects') { result = {id:'s'+(subjects.length+1), name:data.name}; subjects.push(result); }
    else if (path === '/api/documents/upload') { docs.push({id:'d1',filename:'notes.pdf',subject_id:null}); result={document_id:'d1',filename:'notes.pdf',chunks:1}; }
    else if (/\/api\/study\/documents\/.+\/subject/.test(path)) { docs[0].subject_id=data.subject_id; result={saved:true}; }
    else if (path === '/api/documents') result=docs;
    else if (path === '/api/study/topics' && method === 'GET') result=topics;
    else if (path === '/api/study/topics') {result={id:'t1',status:'learning',...data}; topics.push(result);}
    else if (path.startsWith('/api/study/topics/')) {topics[0].status=data.status;result={saved:true};}
    else if (path === '/api/chat/status') result={configured:true};
    else if (path === '/api/chat/stream') {lastMode=data.study_mode;result={answer:'A small example:\n```python\nprint("hello")\n```',sources:[],mode:'ai'};}
    else if (path === '/api/study/conversations') result=Object.entries(chats).map(([id,c])=>({id,title:c.title}));
    else if (path.startsWith('/api/study/conversations/')) {const id=path.split('/').pop(); if(method==='PUT'){chats[id]=data;result={saved:true};}else if(method==='DELETE'){delete chats[id];result={deleted:true};}else result=chats[id];}
    else throw new Error('Unexpected API call: '+method+' '+path);
    await route.fulfill({json:result});
  });
  await page.goto('http://localhost:3000');
  await page.getByRole('button',{name:'Subject Library'}).click();
  await page.getByLabel('New subject').fill('DSA'); await page.getByRole('button',{name:'Add subject',exact:true}).click();
  await page.getByLabel('Filter subject').selectOption('s1');
  await page.locator('input[type=file]').setInputFiles({name:'notes.pdf',mimeType:'application/pdf',buffer:Buffer.from('browser fixture')});
  await page.getByRole('button',{name:'Study these notes'}).waitFor();
  await page.waitForFunction(() => document.querySelector('[aria-label="Subject for notes.pdf"]')?.value === 's1');
  await page.getByRole('button',{name:'Study these notes'}).click();
  await page.getByText('Studying: notes.pdf').waitFor();
  await page.getByRole('button',{name:'My Planner'}).click();
  await page.getByLabel('Task',{exact:true}).fill('SQL assignment');
  await page.getByLabel('Due date (optional)').fill('2026-10-10');
  await page.getByRole('button',{name:'Add task',exact:true}).click();
  await page.getByRole('heading',{name:'SQL assignment'}).waitFor();
  await page.getByRole('button',{name:'Mark done',exact:true}).click();
  await page.getByLabel('Task filter').selectOption('done');
  await page.getByRole('heading',{name:'SQL assignment'}).waitFor();
  await page.getByRole('button',{name:'Reopen',exact:true}).click();
  await page.getByLabel('Task filter').selectOption('pending');
  await page.getByRole('heading',{name:'SQL assignment'}).waitFor();
  await page.getByRole('button',{name:'Revision Tracker'}).click();
  await page.getByLabel('New topic').fill('Binary search');await page.getByRole('button',{name:'Add topic',exact:true}).click();
  await page.getByLabel('Status for Binary search').selectOption('confident');
  await page.waitForFunction(() => document.querySelector('[aria-label="Status for Binary search"]')?.value === 'confident');
  await page.getByRole('button',{name:'Ask Ashiey',exact:false}).first().click();
  await page.getByLabel('Upload study material',{exact:true}).setInputFiles({name:'notes.pdf',mimeType:'application/pdf',buffer:Buffer.from('browser fixture')});
  await page.waitForFunction(() => document.querySelector('#chat-question')?.value.includes('numbered questions'));
  await page.getByLabel('Your message').fill('Solve binary search question 5');
  await page.getByRole('button',{name:'Save question for later'}).click();
  await page.getByText('Question saved in My Planner.',{exact:true}).waitFor();
  assert.equal(tasks.length,2);
  await page.getByLabel('Study mode',{exact:true}).selectOption('solve');
  await page.getByRole('button',{name:'Send message'}).click();
  await page.getByText('Conversation saved',{exact:true}).waitFor();assert.equal(lastMode,'solve');
  await page.getByRole('button',{name:'New conversation'}).click();
  await page.getByLabel('Study mode',{exact:true}).selectOption('hint');await page.getByLabel('Your message').fill('Help with Python');await page.getByRole('button',{name:'Send message'}).click();
  await page.getByText('Conversation saved',{exact:true}).waitFor(); assert.equal(lastMode,'hint');
  await page.getByRole('button',{name:'Copy code',exact:true}).click();await page.getByText('Copied',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()), 'print("hello")');
  const id = Object.keys(chats).find(id=>chats[id].study_mode==='hint'); assert.ok(id);
  await page.reload();await page.getByRole('button',{name:'Ask Ashiey',exact:false}).first().click();
  await page.getByLabel('Saved conversations',{exact:true}).selectOption(id);
  await page.getByText('Conversation loaded',{exact:true}).waitFor();assert.equal(await page.getByLabel('Study mode',{exact:true}).inputValue(),'hint');
  await page.getByRole('button',{name:'Copy code',exact:true}).waitFor();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.screenshot({path:path.join(__dirname,'../data/study-chat-desktop.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors,[]);
  console.log('PASS: planner create/complete/reopen, direct chat upload, save question locally, solve mode, library, revision, saved chats, code copy, layout, no client exceptions.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
