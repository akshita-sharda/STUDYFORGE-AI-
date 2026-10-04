"use client";
import { FormEvent, useState } from "react";

type Profile = { name: string; email: string; branch?: string; semester?: number; subjects: string[]; study_goal: string; explanation_style: string; difficulty: string; theme: string };
const branches = ["Computer Science & Engineering", "Information Technology", "AI & Data Science", "Computer Science (Cybersecurity)", "Computer Science (AI & ML)"];
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function BTechProfile({ token, user, onSaved }: { token: string; user: Profile; onSaved: (profile: Profile) => void }) {
  const [editing, setEditing] = useState(false);
  const [branch, setBranch] = useState(branches.includes(user.branch || "") ? user.branch! : branches[0]);
  const [semester, setSemester] = useState(user.semester || 1);
  const [subjects, setSubjects] = useState(user.subjects.join(", "));
  const [goal, setGoal] = useState(user.study_goal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${API}/api/profile/preferences`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ branch, semester, subjects: subjects.split(",").map(s => s.trim()).filter(Boolean), study_goal: goal, explanation_style: user.explanation_style, difficulty: user.difficulty, theme: user.theme }) });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Please enter up to 12 subjects and a goal under 500 characters.");
      onSaved(data.user); setEditing(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your semester. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="content-card" style={{ marginBottom: 20 }} aria-label="BTech study profile">
    <div className="chat-toolbar"><div><span className="kicker" style={{ marginTop: 0 }}>MY SEMESTER</span><h2>{user.branch ? `${user.branch} · Semester ${user.semester}` : "Set up your CS semester"}</h2></div><button type="button" className="button secondary" disabled={busy} onClick={() => setEditing(!editing)}>{editing ? "Close" : "Edit"}</button></div>
    {editing ? <form className="form" onSubmit={save}>
      <label>CS programme<select value={branch} onChange={e => setBranch(e.target.value)}>{user.branch && !branches.includes(user.branch) && <option value={user.branch}>{user.branch} (saved)</option>}{branches.map(b => <option key={b}>{b}</option>)}</select></label>
      <label>Current semester<select value={semester} onChange={e => setSemester(Number(e.target.value))}>{Array.from({ length: 8 }, (_, i) => <option value={i + 1} key={i}>Semester {i + 1}</option>)}</select></label>
      <label>Current subjects (separated by commas)<input value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="DSA, DBMS, Operating Systems" /></label>
      <label>Semester goal<textarea value={goal} maxLength={500} onChange={e => setGoal(e.target.value)} placeholder="Prepare for internals, revise unit 3, or practise lab viva" /></label>
      <small>Use your university syllabus for the exact subjects and units. </small>
      <button className="button" disabled={busy}>{busy ? "Saving…" : "Save my semester"}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form> : <><p>{user.subjects.length ? user.subjects.join(" · ") : "Add your current subjects to organise your semester."}</p>{user.study_goal && <p>Goal: {user.study_goal}</p>}</>}
  </section>;
}
