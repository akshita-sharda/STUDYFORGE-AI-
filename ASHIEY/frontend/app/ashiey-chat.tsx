"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Emblem } from "./workspace-header";
import MessageContent from "./message-content";
import { studyApi } from "./study-api";
const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
type Message = { incomplete?: boolean; role: "user" | "assistant"; content: string; sources?: { page: number; excerpt: string }[]; mode?: string };
export default function AshieyChat({ token, initialDocumentId, initialQuestion="", initialMode="explain", initialConversationId="" }: { token: string; initialDocumentId: string; initialQuestion?: string; initialMode?: string; initialConversationId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState(initialQuestion);
  const [busy, setBusy] = useState(false);
  const [replyStatus, setReplyStatus] = useState("");
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [documents, setDocuments] = useState<{ id: string; filename: string }[]>([]);
  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [studyMode, setStudyMode] = useState(initialMode);
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [taskStatus, setTaskStatus] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  async function saveQuestionTask() {
    if (!question.trim() || savingTask) return;
    setSavingTask(true); setTaskStatus("");
    try { await studyApi(token, "/tasks", "POST", { title: question.trim(), kind: "question" }); setTaskStatus("Question saved in My Planner."); } catch(e) { setTaskStatus(e instanceof Error ? e.message : "Could not save question."); } finally { setSavingTask(false); }
  }
  async function uploadMaterial(file?: File) {
    if (!file || pending.current) return;
    if (file.size > 20 * 1024 * 1024) { setError("Please choose a PDF smaller than 20 MB."); return; }
    pending.current = true; setBusy(true); setUploading(true); setError("");
    try { const form = new FormData(); form.append("file", file); const r = await fetch(`${API}/api/documents/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }); const d = await r.json(); if (!r.ok) throw new Error(typeof d.detail === "string" ? d.detail : "Upload failed."); setDocuments(current => [{ id: d.document_id, filename: d.filename }, ...current]); setDocumentId(d.document_id); setStudyMode("solve"); await save([]); setQuestion("Identify the topics and numbered questions in this document, then help me solve them one at a time. Flag unreadable pages."); } catch(e) { setError(e instanceof Error ? e.message : "Upload failed."); } finally { pending.current = false; setBusy(false); setUploading(false); }
  }
  const end = useRef<HTMLDivElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const [awayFromLatest,setAwayFromLatest] = useState(false);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const storageKey = `ashiey-chat:${token}`;
  useEffect(() => {
    studyApi(token, "/conversations").then(setConversations).catch(e => setError(e.message));
    fetch(`${API}/api/chat/status`).then(r => r.json()).then(d => setConfigured(d.configured)).catch(() => setError("Cannot connect to Ashiey. Check that the backend is running."));
    fetch(`${API}/api/documents`, { headers: { Authorization: `Bearer ${token}` } }).then(async r => { if (!r.ok) throw new Error(); return r.json(); }).then(setDocuments).catch(() => setError("Could not load your documents. Please sign in again if your session expired."));
    return () => controller.current?.abort();
  }, [token, storageKey, initialDocumentId]);
  useEffect(() => { if(followLatest.current&&transcript.current)transcript.current.scrollTop=transcript.current.scrollHeight; }, [messages, busy]);
  async function persist(next: Message[], id: string) {
    setSaveStatus("Saving conversation…");
    try {
      await studyApi(token, `/conversations/${id}`, "PUT", { title: next.find(m => m.role === "user")?.content.slice(0, 100) || "Study conversation", document_id: documentId || null, study_mode: studyMode, messages: next });
      setUnsaved(false); setSaveStatus("Conversation saved");
      void studyApi(token, "/conversations").then(setConversations).catch(() => {});
    } catch(e) { setUnsaved(true); setSaveStatus(e instanceof Error ? e.message : "Could not save conversation."); }
  }
  async function save(next: Message[]) {
    setMessages(next);
    if (!next.length) { setConversationId(""); setSaveStatus(""); setUnsaved(false); return; }
    const id = conversationId || crypto.randomUUID(); setConversationId(id); await persist(next, id);
  }
  async function openConversation(id: string) {
    if (!id || pending.current) return;
    pending.current = true;
    setBusy(true); setError("");
    try { const saved = await studyApi(token, `/conversations/${id}`); setMessages(saved.messages); setDocumentId(saved.document_id || ""); setStudyMode(saved.study_mode); setConversationId(id); setUnsaved(false); setSaveStatus("Conversation loaded"); }
    catch(e) { setError(e instanceof Error ? e.message : "Could not load conversation."); }
    finally { pending.current = false; setBusy(false); }
  }
  async function send(event: FormEvent) {
    event.preventDefault(); if (!question.trim() || pending.current || busy || unsaved) return;
    followLatest.current=true;setAwayFromLatest(false);
    const text = question.trim(); const previous = messages.filter(m => !m.incomplete);
    pending.current = true; setBusy(true); setError(""); setQuestion("");
    setMessages([...previous, { role: "user", content: text }]);
    const abort = new AbortController(); controller.current = abort;
    let partial = "";
    setReplyStatus(documentId ? "Reading your PDF…" : "Thinking…");
    const slowNotice = setTimeout(() => setReplyStatus("Still waiting for the AI service. You can stop and try again."), 15000);
    const timeout = setTimeout(() => abort.abort(), 90000);
    try {
      const response = await fetch(`${API}/api/chat/stream`, { method: "POST", signal: abort.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ question: text, study_mode: studyMode, document_id: documentId || null, history: previous.slice(-20).map(({ role, content }) => ({ role, content: content.slice(0, 12000) })) }) });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(typeof data.detail === "string" ? data.detail : "Could not send this question.");
      }
      let result: { answer: string; sources?: Message["sources"]; mode?: string } | null = null;
      // Accept JSON from older servers while the streaming endpoint rolls out.
      if (response.headers.get("content-type")?.includes("application/json")) result = await response.json();
      else {
        if (!response.body) throw new Error("The response stream is unavailable.");
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
        function consume(line: string) {
          if (!line.trim()) return;
          const data = JSON.parse(line);
          if (data.type === "error") throw new Error(data.message);
          if (data.type === "status") setReplyStatus(data.message);
          if (data.type === "delta") {
            clearTimeout(slowNotice); partial += data.text; setReplyStatus("Writing your answer…");
            setMessages([...previous, { role: "user", content: text }, { role: "assistant", content: partial }]);
          }
          if (data.type === "done") result = data;
        }
        try {
          while (true) {
            if (abort.signal.aborted) throw new DOMException("Stopped", "AbortError");
            let onAbort: () => void = () => {};
            const stopped = new Promise<never>((_, reject) => {
              onAbort = () => reject(new DOMException("Stopped", "AbortError"));
              abort.signal.addEventListener("abort", onAbort, { once: true });
            });
            const { done, value } = await Promise.race([reader.read(), stopped]).finally(() => abort.signal.removeEventListener("abort", onAbort));
            if (done) { buffer += decoder.decode(); if (buffer.trim()) consume(buffer); break; }
            buffer += decoder.decode(value, { stream: true });
            let newline;
            while (!result && (newline = buffer.indexOf("\n")) !== -1) { consume(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1); }
            if (result) break;
          }
        } finally { void reader.cancel().catch(() => {}); reader.releaseLock(); }
      }
      if (abort.signal.aborted) throw new DOMException("Stopped", "AbortError");
      if (!result || typeof result.answer !== "string" || !result.answer.trim()) throw new Error("The connection ended before the answer was complete.");
      clearTimeout(timeout); clearTimeout(slowNotice); setReplyStatus("Saving conversation…");
      await save([...previous, { role: "user", content: text }, { role: "assistant", content: result.answer, sources: result.sources, mode: result.mode }]);
    } catch (e) {
      setMessages(partial ? [...previous, { role: "user", content: text, incomplete: true }, { role: "assistant", content: partial, incomplete: true }] : previous);
      setQuestion(text);
      setError((!abort.signal.aborted && e instanceof Error && e.name !== "AbortError" ? e.message : "Request stopped or timed out.") + " Your question is ready to send again.");
    } finally { clearTimeout(timeout); clearTimeout(slowNotice); setReplyStatus(""); pending.current = false; setBusy(false); controller.current = null; }

  }
  const initialOpened = useRef(false);
  const composerForm = useRef<HTMLFormElement>(null);
  useEffect(()=>{
    if(initialOpened.current)return;initialOpened.current=true;
    if(initialConversationId) void openConversation(initialConversationId);
    else if(initialQuestion) composerForm.current?.requestSubmit();
  },[]);
  return <section className="content-card ashiey-room">
    <div className="study-row"><label className="upload-button">{uploading ? "Reading material…" : "Upload study material"}<input aria-label="Upload study material" type="file" accept="application/pdf" disabled={busy || unsaved} onChange={e => { uploadMaterial(e.target.files?.[0]); e.target.value = ""; }} /></label><small>Ask from your notes here. The selected PDF is sent to Gemini for full-page reading, including scans and diagrams. Up to 20 MB / 200 pages.</small></div>
    <div className="chat-toolbar"><div><span className="kicker">COMPUTER SCIENCE COMPANION</span><h2>Ask Ashiey</h2></div><button className="button secondary" disabled={busy || unsaved} onClick={() => { setQuestion(""); save([]); setError(""); }}>New conversation</button></div>
    <div className="study-row"><label>Saved conversations<select aria-label="Saved conversations" disabled={busy || unsaved} value={conversationId} onChange={e => openConversation(e.target.value)}><option value="">Choose a saved chat</option>{conversations.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>{conversationId && <button className="button secondary" disabled={busy} onClick={async () => { if (!window.confirm("Delete this saved conversation?")) return; setBusy(true); try { await studyApi(token, `/conversations/${conversationId}`, "DELETE"); setConversations(await studyApi(token, "/conversations")); save([]); } catch(e) { setError(e instanceof Error ? e.message : "Delete failed."); } finally { setBusy(false); } }}>Delete chat</button>}</div>
    <label>Conversation source <select disabled={busy || unsaved} value={documentId} onChange={e => { setDocumentId(e.target.value); save([]); setError(""); }}><option value="">Computer Science help</option>{documents.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}</select></label>
    <div className="mode-tabs" role="group" aria-label="Study mode">{[["explain","Explain","Concepts and examples"],["hint","Hint","A nudge forward"],["debug","Debug","Code and edge cases"],["viva","Viva","One question at a time"],["solve","Solve","Step-by-step working"],["plan","Plan","Your study roadmap"]].map(([id,label,description])=><button type="button" key={id} disabled={busy} aria-pressed={studyMode===id} onClick={()=>setStudyMode(id)}><strong>{label}</strong><small>{description}</small></button>)}</div>
    {saveStatus && <p role="status">{saveStatus} {unsaved && <button className="button secondary" disabled={busy} onClick={async () => { setBusy(true); try { await persist(messages, conversationId); } finally { setBusy(false); } }}>Retry save</button>}</p>}
    {configured === false && <p className="chat-status">AI replies need a configured API key. Regular chat can use Groq; full-PDF reading requires Gemini.</p>}
    <div ref={transcript} onScroll={()=>{const el=transcript.current;if(el){followLatest.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;setAwayFromLatest(!followLatest.current)}}} className="chat-transcript" role="log" aria-label="Conversation" aria-live="polite">
      {!messages.length && <div className="chat-empty"><h3>What are you studying this semester?</h3><p>Understand a concept, debug code or prepare for a CS viva. Select your notes for source-based answers.</p>{["Explain time complexity with a worked example", "Explain SQL joins with a small example", "Quiz me on operating systems, one question at a time", "Explain TCP and UDP with an example"].map(p => <button className="button secondary" key={p} onClick={() => setQuestion(p)}>{p}</button>)}</div>}
      {messages.map((m, i) => <article className={`chat-message ${m.role}`} key={i}><strong className="message-author">{m.role === "assistant" && <Emblem/>}{m.role === "user" ? "You" : "ASHIEY"}</strong><div><MessageContent content={m.content} /></div>{m.incomplete && m.role === "assistant" && <small>Incomplete reply · retry your question to get a complete answer.</small>}{m.mode === "source-only" && <small>Source excerpts · AI not configured</small>}{!!m.sources?.length && <details><summary>Study sources ({m.sources.length})</summary>{m.sources.map((s, j) => <blockquote key={j}><b>Page {s.page}</b><p>{s.excerpt}</p></blockquote>)}</details>}</article>)}
      {busy && <p role="status">{uploading ? "Reading material…" : replyStatus || "Loading…"}</p>}<div ref={end} />
    </div>
    {awayFromLatest&&<button className="button secondary" onClick={()=>{followLatest.current=true;setAwayFromLatest(false);if(transcript.current)transcript.current.scrollTop=transcript.current.scrollHeight}}>Jump to latest ↓</button>}
    {error && <p className="error" role="alert">{error}</p>}
    <div className="study-row"><button type="button" className="button secondary" disabled={busy || savingTask || !question.trim() || question.trim().length > 300} onClick={saveQuestionTask}>Save question for later</button><small>{question.trim().length > 300 ? "Use a short task title (up to 300 characters) in My Planner." : "Keep a question in My Planner without sending it to AI."}</small></div>
    {taskStatus && <p role="status">{taskStatus}</p>}
    <form ref={composerForm} className="chat-composer" onSubmit={send}><label htmlFor="chat-question">Your message</label><textarea id="chat-question" value={question} maxLength={2000} disabled={busy} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Ask about code, algorithms or a CS concept…" /><div className="chat-toolbar"><small>Enter to send · Shift + Enter for a new line</small>{busy ? <button className="button secondary" type="button" onClick={e => { e.preventDefault(); controller.current?.abort(); }}>Stop</button> : <button className="button" disabled={!question.trim() || unsaved}>Send message</button>}</div></form>
  </section>;
}
