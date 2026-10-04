"use client";
import { useEffect, useState } from "react";
import { studyApi } from "./study-api";
import { Emblem } from "./workspace-header";
import type { Student } from "./profile-setup";
export type Summary={tasks:{id:string;title:string;kind:string;status:string;due_date:string|null}[];conversations:{id:string;title:string;updated_at:string}[];documents:number;subjects:number;topics:{status:string;count:number}[]};
export default function WorkspaceHome({token,user,navigate,ask,upload,busy,notice,documentName}:{token:string;user:Student;navigate:(p:string)=>void;ask:(q:string,mode?:string,id?:string)=>void;upload:(f?:File)=>void;busy:boolean;notice:string;documentName:string}){
 const [query,setQuery]=useState('');const [data,setData]=useState<Summary|null>(null);const [error,setError]=useState('');
 useEffect(()=>{studyApi(token,'/summary').then(setData).catch(e=>setError(e.message));},[token]);
 const pending=data?.tasks.filter(t=>t.status==='pending')||[];
 return <div className="workspace-home">
  <section className="welcome">
   <div className="hero-orbit" aria-hidden="true"><i/><i/><i/></div>
   <span className="semester-pill">Semester {user.semester||1} · {user.branch||'BTech Computer Science'}</span>
   <p className="hello-note">hello, {user.name.split(' ')[0].toLowerCase()} ✦</p>
   <h1>Turn the <em>“I don’t get it”</em><br/>into the moment it clicks.</h1>
   <p className="lead">A thoughtful corner for notes, code, revision and all the questions in between.</p>
   <div className="hero-scribble" aria-hidden="true">made for curious minds ↗</div>
  </section>
  <section className="home-compose">
   <span className="paper-label">ASK ASHIEY / 01</span>
   <form onSubmit={e=>{e.preventDefault();if(query.trim())ask(query)}}>
    <div className="composer-input"><Emblem/><textarea aria-label="Academic query" maxLength={2000} placeholder="What feels confusing today? Drop a concept, a code bug, or a question here…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();e.currentTarget.form?.requestSubmit()}}}/></div>
    <div className="composer-bottom"><label className="attach-pill">＋ Add your notes<input type="file" accept="application/pdf" disabled={busy} onChange={e=>{upload(e.target.files?.[0]);e.target.value=''}}/></label><small>{documentName||'PDF, question, or half-formed thought — all welcome'}</small><button className="button" disabled={busy||!query.trim()}>{busy?'Preparing…':'Ask Ashiey ↗'}</button></div>
   </form>{notice&&<p className="home-notice" role="status">{notice}</p>}<p className="composer-hint">PDFs up to 20 MB / 200 pages <span>Ctrl + Enter to send</span></p>
   <div className="suggestions">{[['Explain a concept','explain','Explain virtual memory with a small example.','01'],['Debug my code','debug','Help me debug my code. Ask me to paste it first.','02'],['Solve together','solve','Help me solve a CS question step by step.','03'],['Plan revision','plan','Help me plan my revision.','04']].map(([label,mode,q,icon])=><button key={mode} onClick={()=>ask(q,mode)}><span>{icon}</span><strong>{label}</strong><b>↗</b></button>)}</div>
  </section>
  <div className="collection-heading"><span>YOUR STUDY KIT</span><h2>Everything you need,<br/><em>within reach.</em></h2><p>Pick up where your brain left off.</p></div>
  <section className="quick-tools">{[['planner','01','My Planner',`${pending.length} pending`,'Give deadlines a home'],['library','02','Subject Library',`${data?.subjects||0} subjects`,'Notes worth returning to'],['cards','03','Flashcards','Review','Small cards, strong memory'],['quiz','04','Practice Quiz','Practise','Find what needs another look']].map(([id,icon,title,badge,subtitle])=><button key={id} onClick={()=>navigate(id)}><div><span className="tool-symbol">{icon}</span><small>{badge}</small></div><h2>{title}</h2><p>{subtitle}</p><b className="card-arrow">↗</b></button>)}</section>
  {error&&<p className="error" role="alert">{error}</p>}
  <section className="home-columns"><div><div className="section-title"><div><span className="section-index">/ KEEP GOING</span><h2>Continue studying</h2></div><button onClick={()=>navigate('chat')}>All conversations ↗</button></div>{data?.conversations.length?data.conversations.map(c=><button className="recent-card" key={c.id} onClick={()=>ask('','explain',c.id)}><span className="mini-tag">Study conversation</span><h3>{c.title}</h3><small>Open conversation →</small></button>):<div className="empty-panel"><Emblem/><h3>A fresh page for your next idea.</h3><p>Your saved conversations will appear here.</p></div>}</div><div><div className="section-title"><div><span className="section-index">/ ON YOUR DESK</span><h2>Coming up</h2></div><button onClick={()=>navigate('planner')}>Open planner ↗</button></div>{pending.length?pending.slice(0,3).map(t=><button className="recent-card task-preview" key={t.id} onClick={()=>navigate('planner')}><span className="date-block">{t.due_date?new Date(t.due_date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'}):'Anytime'}</span><span><small>{t.kind}</small><h3>{t.title}</h3></span></button>):<div className="empty-panel"><h3>Make space for what matters.</h3><p>Add your next assignment, exam or revision session.</p><button className="button secondary" onClick={()=>navigate('planner')}>Add your first task</button></div>}</div></section>
  <div className="workspace-note"><Emblem/><span>Study slowly enough to understand.<small>ASHIEY helps you reason through the hard parts, one idea at a time.</small></span><b aria-hidden="true">stay curious ✦</b></div>
 </div>;
}
export function WorkspaceProgress({token}:{token:string}){const [data,setData]=useState<Summary|null>(null);const [error,setError]=useState('');useEffect(()=>{studyApi(token,'/summary').then(setData).catch(e=>setError(e.message));},[token]);return <section className="content-card"><h2>Your study progress</h2><p>Based on your saved tasks and revision topics.</p>{error&&<p className="error">{error}</p>}{data?<><div className="quick-tools"><article><h2>{data.tasks.filter(t=>t.status==='done').length}</h2><p>Completed tasks</p></article><article><h2>{data.documents}</h2><p>Saved materials</p></article><article><h2>{data.topics.reduce((n,t)=>n+t.count,0)}</h2><p>Revision topics</p></article><article><h2>{data.topics.find(t=>t.status==='confident')?.count||0}</h2><p>Topics marked confident</p></article></div><p>Confidence is self-reported. Complete practice and revise topics to build your understanding.</p></>:<p>Loading your progress…</p>}</section>}
