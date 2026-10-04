"use client";

import AshieyChat from "./ashiey-chat";
import ProfileSetup, { StudentAvatar, type Student as User } from "./profile-setup";
import WorkspaceHeader, { pages } from "./workspace-header";
import WorkspaceHome, { WorkspaceProgress } from "./workspace-home";
import AvatarCreator from "./avatar-creator-3d";
import Library from "./library";
import Revision from "./revision";
import Planner from "./planner";

import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const nav = [["hub", "Overview", "✦"], ["planner", "My Planner", "▦"], ["library", "Subject Library", "▤"], ["revision", "Revision Tracker", "✓"], ["chat", "Ask Ashiey", "◉"], ["cards", "Flashcards", "◇"], ["quiz", "Quizzes", "⚡"], ["games", "Recall", "✹"], ["progress", "Progress", "↗"]];
type Progress = { xp: number; level: number; quizzes_completed: number; correct_answers: number };
type Card = { question: string; answer: string; source_page?: number; focus?: string };
type Question = { id: string; question: string; options: string[]; explanation?: string; source_page?: number; focus?: string };

function Button({ children, onClick, secondary = false }: { children: React.ReactNode; onClick?: () => void; secondary?: boolean }) { return <button className={secondary ? "button secondary" : "button"} onClick={onClick}>{children}</button>; }

export default function Home() {
  const [busy, setBusy] = useState(false);
  const [chatStart, setChatStart] = useState({question:"",mode:"explain",id:"",key:0});
  const [materials, setMaterials] = useState<{id:string;filename:string}[]>([]);
  const [token, setToken] = useState(""); const [user, setUser] = useState<User | null>(null); const [authMode, setAuthMode] = useState<"login" | "signup">("login"); const [onboarding, setOnboarding] = useState(false); const [error, setError] = useState("");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [page, setPage] = useState("hub"); const [documentId, setDocumentId] = useState(""); const [documentName, setDocumentName] = useState(""); const [notice, setNotice] = useState(""); const [cards, setCards] = useState<Card[]>([]); const [quiz, setQuiz] = useState<Question[]>([]); const [quizId, setQuizId] = useState(""); const [gameCards, setGameCards] = useState<Card[]>([]); const [progress, setProgress] = useState<Progress>({ xp: 0, level: 1, quizzes_completed: 0, correct_answers: 0 });

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("studyforge_token"); } catch { return; }
    if (!saved) return;
    setToken(saved);
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${saved}` } })
      .then(async r => { if (!r.ok) throw new Error("Session expired"); return r.json(); })
      .then(d => { if (!d.user || typeof d.user.name !== "string" || !Array.isArray(d.user.subjects)) throw new Error("Invalid profile"); setUser(d.user); })
      .catch(() => { setToken(""); setUser(null); try { localStorage.removeItem("studyforge_token"); } catch { /* Storage may be unavailable. */ } });
  }, []);
  useEffect(() => {
    if (!token || !["cards","quiz","games"].includes(page)) return;
    fetch(`${API}/api/documents`, {headers:{Authorization:`Bearer ${token}`}}).then(async r=>{if(!r.ok)throw new Error("Could not load materials.");return r.json()}).then(setMaterials).catch(e=>setNotice(e.message));
  },[token,page]);
  async function auth(event: FormEvent) {
    event.preventDefault(); if(busy)return; setBusy(true); setError("");
    try { const response = await fetch(`${API}/api/auth/${authMode === "signup" ? "signup" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(authMode === "signup" ? { name, email, password } : { email, password }) });
      const data = await response.json(); if(!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Check your details and try again.");
      try { localStorage.setItem("studyforge_token", data.token); } catch {}
      setToken(data.token); setUser(data.user); setOnboarding(authMode === "signup");
    } catch(e) {setError(e instanceof Error?e.message:"Could not sign in.")} finally {setBusy(false)}
  }
  async function upload(file?: File) {
    if(!file||busy)return;setBusy(true);setNotice("");
    try {const form=new FormData();form.append("file",file);const r=await fetch(`${API}/api/documents/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Upload failed.");setDocumentId(d.document_id);setDocumentName(d.filename);setMaterials(m=>[{id:d.document_id,filename:d.filename},...m]);setNotice(`${d.filename} is ready. Ask a question or choose a study tool.`)}catch(e){setNotice(e instanceof Error?e.message:"Upload failed.")}finally{setBusy(false)}
  }
  async function generate(kind:string) {
    if(!documentId){setNotice("Choose or upload a PDF first.");return}if(busy)return;setBusy(true);setNotice("Preparing your study material…");
    try {const r=await fetch(`${API}/api/${kind}/generate`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({document_id:documentId,count:5})});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Could not generate study material.");if(kind==="flashcards")setCards(d.flashcards||[]);else{setQuiz(d.questions||[]);setQuizId(d.quiz_id)}setNotice("Ready to practise.")}catch(e){setNotice(e instanceof Error?e.message:"Request failed.")}finally{setBusy(false)}
  }
  const makeCards=()=>generate("flashcards");
  function navigate(id:string){if(document.documentElement.dataset.unsavedProfile==="true"&&!window.confirm("Discard unsaved avatar changes?"))return;setNotice("");setPage(id);window.scrollTo({top:0,behavior:"instant"})}
  function ask(question:string,mode="explain",id=""){setChatStart(c=>({question,mode,id,key:c.key+1}));setPage("chat")}
  function signOut(){try{localStorage.removeItem("studyforge_token")}catch{}setUser(null);setToken("");setPassword("");setDocumentId("");setDocumentName("");setMaterials([]);setCards([]);setQuiz([]);setPage("hub");setChatStart({question:"",mode:"explain",id:"",key:0})}

  if (!user) return <div className="auth-screen">
    <div className="auth-atmosphere" aria-hidden="true"><i/><i/><i/><span>learn · make · repeat</span></div>
    <section className="auth-story" aria-label="About StudyForge">
      <span className="auth-eyebrow">STUDYFORGE / FOR BTECH STUDENTS</span>
      <h1>A softer place for<br/><em>hard problems.</em></h1>
      <p>Bring your notes, questions and unfinished ideas. StudyForge turns the mess of engineering college into a workspace that feels like yours.</p>
      <div className="auth-notes" aria-hidden="true"><span>01 / understand</span><span>02 / practise</span><span>03 / build</span></div>
    </section>
    <div className="auth-panel"><div className="auth-brand"><span className="auth-mark">S</span><span>StudyForge<small>with ASHIEY</small></span></div><span className="kicker">{authMode === "signup" ? "START YOUR SPACE" : "WELCOME BACK"}</span><h2>{authMode === "signup" ? "Make this desk yours." : "Ready when you are."}</h2><p>Your notes and next breakthrough are waiting.</p><form onSubmit={auth} className="form">{authMode === "signup" && <label>Student name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" required /></label>}<label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required /></label><button className="button" disabled={busy}>{busy ? "Please wait…" : authMode === "signup" ? "Create my workspace" : "Enter my workspace"}</button>{error && <small className="error">{error}</small>}<button type="button" className="switch" onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}>{authMode === "signup" ? "Already have a space? Log in" : "New here? Create your student space"}</button></form></div>
  </div>;
  if (onboarding) return <main className="profile-onboarding"><ProfileSetup user={user} token={token} onboarding onSaved={u => { setUser(u); setOnboarding(false); }} /></main>;

  return <div className="workspace-shell"><WorkspaceHeader page={page} user={user} navigate={navigate} signOut={signOut}/><main className="workspace-main">{page!=="hub"&&page!=="chat"&&<div className="workspace-title"><span className="kicker">YOUR ACADEMIC WORKSPACE</span><h1>{pages[page]}</h1></div>}
    {page==="hub"&&<WorkspaceHome token={token} user={user} navigate={navigate} ask={ask} upload={upload} busy={busy} notice={notice} documentName={documentName}/>}
    {page==="profile"&&<ProfileSetup user={user} token={token} onSaved={setUser} onEditAvatar={()=>navigate("avatar")}/>}
    {page==="avatar"&&<AvatarCreator user={user} token={token} onSaved={setUser} onCancel={()=>navigate("profile")}/>}
    {page==="planner"&&<Planner token={token}/>}
    {page==="library"&&<Library token={token} onStudy={(id,name)=>{setDocumentId(id);setDocumentName(name);ask("")}}/>}
    {page==="revision"&&<Revision token={token}/>}
    {page==="chat"&&<AshieyChat key={chatStart.key} token={token} initialDocumentId={documentId} initialQuestion={chatStart.question} initialMode={chatStart.mode} initialConversationId={chatStart.id}/>}
    {["cards","quiz","games"].includes(page)&&<section className="material-picker"><label>Study material<select value={documentId} onChange={e=>{setDocumentId(e.target.value);setDocumentName(materials.find(d=>d.id===e.target.value)?.filename||"");setCards([]);setQuiz([])}}><option value="">Choose a PDF</option>{materials.map(d=><option key={d.id} value={d.id}>{d.filename}</option>)}</select></label><label className="attach-pill">Attach PDF<input type="file" accept="application/pdf" disabled={busy} onChange={e=>{upload(e.target.files?.[0]);e.target.value=""}}/></label><button className="button" disabled={busy||!documentId} onClick={()=>generate(page==="quiz"?"quizzes":"flashcards")}>{busy?"Preparing…":page==="quiz"?"Create quiz":"Create cards"}</button>{notice&&<p role="status">{notice}</p>}</section>}
    {page==="cards"&&<CardsView cards={cards} makeCards={makeCards} notice=""/>}
    {page==="quiz"&&<QuizView key={quizId} quiz={quiz} quizId={quizId} token={token} notice="" setNotice={setNotice}/>}
    {page==="games"&&<GameView cards={cards} notice=""/>}
    {page==="progress"&&<WorkspaceProgress token={token}/>}
  </main><footer className="workspace-footer">© {new Date().getFullYear()} StudyForge AI <span>Your space for thoughtful learning.</span></footer></div>;

}

function CardsView({cards}: {cards:Card[];makeCards:()=>void;notice:string}) {
 const [index,setIndex]=useState(0);const [revealed,setRevealed]=useState(false);
 useEffect(()=>{setIndex(0);setRevealed(false)},[cards]);
 if(!cards.length)return <section className="empty-panel"><h2>A little practice, a lasting idea.</h2><p>Choose your study material above and create a set of revision cards.</p></section>;
 const card=cards[Math.min(index,cards.length-1)];return <section className="content-card flashcard-view"><span className="kicker">{card.focus||"KEY CONCEPT"} · CARD {index+1} OF {cards.length}</span><h2>{card.question}</h2>{revealed?<div className="flashcard-answer">{card.answer}{card.source_page&&<small>Source page {card.source_page}</small>}</div>:<button className="button" onClick={()=>setRevealed(true)}>Reveal answer</button>}<div className="study-row"><button className="button secondary" disabled={!index} onClick={()=>{setIndex(i=>i-1);setRevealed(false)}}>Previous</button><button className="button secondary" onClick={()=>{setIndex(Math.floor(Math.random()*cards.length));setRevealed(false)}}>Shuffle</button><button className="button secondary" disabled={index===cards.length-1} onClick={()=>{setIndex(i=>i+1);setRevealed(false)}}>Next</button></div></section>;
}
function QuizView({quiz,quizId,token}:{quiz:Question[];quizId:string;token:string;notice:string;setNotice:(s:string)=>void}){
 const [answers,setAnswers]=useState<Record<string,string>>({});const [result,setResult]=useState<{score:number;total:number;results:{id:string;answer:string;explanation:string;source_page?:number}[]}|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function submit(){setBusy(true);setError('');try{const r=await fetch(`${API}/api/quizzes/${quizId}/submit`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({answers})});const d=await r.json();if(!r.ok)throw new Error(typeof d.detail==='string'?d.detail:'Could not submit quiz.');setResult(d)}catch(e){setError(e instanceof Error?e.message:'Request failed.')}finally{setBusy(false)}}
 return <section className="content-card"><h2>Check your understanding</h2>{quiz.length?<>{quiz.map((q,i)=><article className="quiz-question" key={q.id}><span>QUESTION {i+1}{q.focus&&` · ${q.focus}`}</span><h3>{q.question}</h3><div className="options">{q.options.map(o=><button disabled={busy||!!result} className={answers[q.id]===o?'option chosen':'option'} key={o} onClick={()=>setAnswers({...answers,[q.id]:o})}>{o}</button>)}</div>{result&&<p className="quiz-feedback"><strong>Answer: {result.results.find(r=>r.id===q.id)?.answer}</strong><br/>{result.results.find(r=>r.id===q.id)?.explanation}</p>}</article>)}<button className="button" disabled={busy||!!result||quiz.some(q=>!answers[q.id])} onClick={submit}>{busy?'Checking…':'Submit answers'}</button>{result&&<p role="status">You scored {result.score} / {result.total}. Your first completed attempt is saved.</p>}</>:<p className="empty">Choose your study material above, then create a practice quiz.</p>}{error&&<p className="error" role="alert">{error}</p>}</section>;
}
function GameView({ cards, notice }: { cards: Card[]; notice: string }) { const [revealed, setRevealed] = useState<number | null>(null); return <section className="content-card"><span className="kicker">CONCEPT PRACTICE</span><h2>Concept recall</h2><p>Tap a card to reveal its explanation. Can you remember the concept first?</p><div className="game-grid">{cards.map((card, i) => <button className={revealed === i ? "game-tile revealed" : "game-tile"} key={i} onClick={() => setRevealed(revealed === i ? null : i)}><b>{revealed === i ? card.answer : `Concept ${i + 1}`}</b><small>{revealed === i ? "Tap to hide" : "Tap to reveal"}</small></button>)}</div>{!cards.length && <p className="empty">Upload a PDF to start concept recall.</p>}{notice && <small>{notice}</small>}</section>; }
function ProgressView({ progress, user }: { progress: Progress; user: User }) { return <section className="content-card progress-view"><span className="kicker">YOUR JOURNEY</span><h2>{user.name}&apos;s study progress</h2><div className="journey-stats"><div><strong>{progress.level}</strong><span>Current level</span></div><div><strong>{progress.xp}</strong><span>Total XP</span></div><div><strong>{progress.correct_answers}</strong><span>Correct answers</span></div></div><div className="progress-bar"><span style={{ width: `${Math.min(progress.xp % 100, 100)}%` }} /></div><p>Keep learning to reach level {progress.level + 1}.</p></section>; }
