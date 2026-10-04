"use client";
import { useEffect, useState } from "react";
import { studyApi, Subject } from "./study-api";
type Topic = { id: string; subject_id: string; name: string; status: string };
const states = [["learning", "Learning"], ["revision", "Needs revision"], ["confident", "Confident"]];
export default function Revision({ token }: { token: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([]); const [topics, setTopics] = useState<Topic[]>([]); const [subject, setSubject] = useState(""); const [name, setName] = useState(""); const [filter, setFilter] = useState("all"); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function load() { const [lib, rows] = await Promise.all([studyApi(token, "/library"), studyApi(token, "/topics")]); setSubjects(lib.subjects); setTopics(rows); setSubject(s => s || lib.subjects[0]?.id || ""); }
  useEffect(() => { load().catch(e => setError(e.message)); }, [token]);
  async function run(action: () => Promise<unknown>) { setBusy(true); setError(""); try { await action(); await load(); } catch(e) { setError(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); } }
  return <section className="content-card"><span className="kicker">REVISION TRACKER</span><h2>Know what needs another look.</h2><p>Track your confidence topic by topic. These are your own assessments.</p>
    <div className="study-row">{states.map(([id, label]) => <span className="topic-count" key={id}>{label}: <b>{topics.filter(t => t.status === id).length}</b></span>)}</div>
    {subjects.length ? <form className="study-row" onSubmit={e => { e.preventDefault(); run(async () => { await studyApi(token, "/topics", "POST", { name, subject_id: subject }); setName(""); }); }}><select aria-label="Topic subject" value={subject} onChange={e => setSubject(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><input aria-label="New topic" placeholder="e.g. Binary search trees" value={name} maxLength={120} onChange={e => setName(e.target.value)} required /><button className="button" disabled={busy || !name.trim()}>Add topic</button></form> : <p className="empty">Add a subject in the Library to start tracking topics.</p>}
    <div className="study-row"><label>Show <select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All topics</option>{states.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
    {error && <p className="error" role="alert">{error}</p>}
    {topics.filter(t => filter === "all" || t.status === filter).map(t => <article className="study-item" key={t.id}><small>{subjects.find(s => s.id === t.subject_id)?.name}</small><h3>{t.name}</h3><div className="study-row"><select aria-label={`Status for ${t.name}`} value={t.status} disabled={busy} onChange={e => run(() => studyApi(token, `/topics/${t.id}`, "PATCH", { status: e.target.value }))}>{states.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select><button className="button secondary" disabled={busy} onClick={() => { if (window.confirm(`Remove topic "${t.name}"?`)) run(() => studyApi(token, `/topics/${t.id}`, "DELETE")); }}>Remove</button></div></article>)}
    {!topics.length && <p>No topics yet. Start with one concept you are learning.</p>}
  </section>;
}
