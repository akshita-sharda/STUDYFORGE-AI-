const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 let user={name:'Ada',email:'ada@example.test',branch:'Computer Science',semester:5,subjects:['Python'],study_goal:'Exams',explanation_style:'simple',difficulty:'medium',theme:'pastel'};
 let reject=false;
 await context.addInitScript(()=>localStorage.setItem('studyforge_token','mock'));
 await context.route('**/api/**',async r=>{
  if(r.request().method()==='PUT'){
   if(reject) return r.fulfill({status:503,json:{detail:'Please try again.'}});
   user={...user,...r.request().postDataJSON()};
  }
  await r.fulfill({json:{user,token:'mock'}});
 });
 const p=await context.newPage();let errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:3000');
 await p.getByRole('button',{name:'Open Profile Setup'}).click();
 await p.getByLabel('Student name *').fill('Ada Lovelace');
 await p.getByLabel('College / university').fill('Engineering College');
 await p.getByLabel('mint background').click();
 await p.getByRole('combobox',{name:/Hair/}).selectOption('curly');
 await p.getByLabel('Add glasses').check();
 await p.getByRole('button',{name:'Save profile',exact:true}).click();
 await p.getByRole('status').filter({hasText:'Profile saved.'}).waitFor();
 assert.equal(user.avatar.glasses,true);assert.equal(user.avatar.color,'mint');
 await p.reload();await p.getByRole('button',{name:'Open Profile Setup'}).click();
 assert.equal(await p.getByLabel('Student name *').inputValue(),'Ada Lovelace');
 assert.equal(await p.getByLabel('Add glasses').isChecked(),true);
 assert.equal(await p.getByLabel('Current subjects *').inputValue(),'Python');
 reject=true;await p.getByRole('button',{name:'Save profile',exact:true}).click();await p.getByRole('alert').filter({hasText:'Please try again.'}).waitFor();
 reject=false;await p.getByRole('button',{name:'Save profile',exact:true}).click();
 await p.getByRole('status').filter({hasText:'Profile saved.'}).waitFor();
 await p.screenshot({path:path.join(__dirname,'../data/profile-setup.png'),fullPage:true});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.getByRole('button',{name:'Overview'}).click();
 assert.equal(await p.getByText('Set up your CS semester').count(),0);
 assert.equal(await p.getByRole('button',{name:'Pause animations'}).count(),0);
 assert.deepEqual(errors,[]);
 // New students use the same complete setup after signup.
 await context.clearCookies();await p.evaluate(()=>localStorage.clear());
 await context.close();
 const fresh=await browser.newContext();await fresh.route('**/api/**',r=>r.fulfill({json:{user,token:'mock'}}));
 const q=await fresh.newPage();await q.goto('http://localhost:3000');
 await q.getByRole('button',{name:'Create a student account'}).click();
 await q.getByLabel('Student name').fill('New Student');await q.getByLabel('Email',{exact:true}).fill('new@example.test');await q.getByLabel('Password').fill('test-password');
 await q.getByRole('button',{name:'Create account',exact:true}).click();
 await q.getByRole('heading',{name:'Create your avatar'}).waitFor();
 await q.getByRole('button',{name:'Save & start studying'}).click();
 await q.getByRole('button',{name:'Open Profile Setup'}).waitFor();
 await browser.close();console.log('PASS: profile save, reload, avatar, failure recovery, onboarding, dashboard removal and desktop layout.');
})().catch(e=>{console.error(e);process.exit(1)});
