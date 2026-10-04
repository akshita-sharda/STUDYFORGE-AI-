"use client";

import { FormEvent, useState } from 'react';

export type User = {
  name: string;
  email: string;
  subjects: string[];
  study_goal: string;
  explanation_style: string;
  difficulty: string;
  theme: string;
};
export type Card = { question: string; answer: string; source_page?: number };
export type Question = { id: string; question: string; options: string[] };
export type Message = {
  role: "user" | "assistant";
  text: string;
  grounded?: boolean;
  sources?: { page: number; excerpt: string; filename?: string; source_url?: string | null }[];
};
export type ProgressData = { xp: number; level: number; quizzes_completed: number; correct_answers: number };
export type StudyDocument = { id: string; filename: string; source_url?: string | null; created_at?: string };
export type QuizResult = {
  score: number;
  total: number;
  xp_earned: number;
  review: { id: string; correct_answer: string; explanation: string; is_correct: boolean }[];
};
export function Landing(p: any) {
  return (
    <div className="landing" data-theme={p.theme || "light"}>
      <nav className="landing-nav">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>
            StudyForge <i>AI</i>
          </span>
        </div>
        <div className="landing-links">
          <a href="#features">Features</a>
          <a href="#process">How it works</a>
          <a href="#tools">AI tools</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={p.toggleTheme} aria-pressed={p.theme === "dark"}>
            <span aria-hidden="true">{p.theme === "dark" ? "☼" : "☾"}</span>{p.theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            className="link-button"
            onClick={() => {
              p.setMode("login");
              p.setShowAuth(true);
            }}
          >
            Log in
          </button>
          <button
            className="button"
            onClick={() => {
              p.setMode("signup");
              p.setShowAuth(true);
            }}
          >
            Get started
          </button>
        </div>
      </nav>
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="eyebrow">AI-POWERED LEARNING, BUILT AROUND YOU</span>
          <h1>
            Turn studying
            <br />
            <em>into progress.</em>
          </h1>
          <p>
            StudyForge AI transforms your notes, PDFs, subjects, and goals into
            personalized learning experiences.
          </p>
          <div className="hero-actions">
            <button
              className="button"
              onClick={() => {
                p.setMode("signup");
                p.setShowAuth(true);
              }}
            >
              Start learning →
            </button>
            <a className="text-link" href="#tools">
              Explore AI tools ↗
            </a>
          </div>
          <div className="trust-row">
            <span>✦ Personalized learning</span>
            <span>◌ Grounded in your notes</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-window">
            <div className="visual-top">
              <span>ASHIEY · YOUR AI TUTOR</span>
              <b>● online</b>
            </div>
            <div className="visual-message">What are you working on today?</div>
            <div className="visual-card visual-card-one">
              <span>FLASHCARD</span>
              <strong>What is supervised learning?</strong>
              <small>from your notes · 92% match</small>
            </div>
            <div className="visual-card visual-card-two">
              <span>WEEKLY PROGRESS</span>
              <strong>
                +18% <small>this week</small>
              </strong>
              <div className="mini-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="visual-orbit orbit-a">✦</div>
            <div className="visual-orbit orbit-b">◌</div>
          </div>
        </div>
      </section>
      <section className="metric-strip">
        <div>
          <strong>01</strong>
          <span>Upload your material</span>
        </div>
        <div>
          <strong>02</strong>
          <span>Learn with ASHIEY</span>
        </div>
        <div>
          <strong>03</strong>
          <span>Track real progress</span>
        </div>
      </section>
      <section id="features" className="landing-section">
        <span className="eyebrow">THE STUDYFORGE METHOD</span>
        <h2>A smarter way to stay in motion.</h2>
        <div className="feature-grid">
          <article>
            <span>01</span>
            <h3>Bring your context</h3>
            <p>
              Upload notes, PDFs, and assignments. Your material becomes the
              source of every session.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Learn your way</h3>
            <p>
              Ask for an explanation, generate flashcards, or test yourself with
              a focused quiz.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>See your momentum</h3>
            <p>
              Build consistency with visible progress and feedback that helps
              you choose what to do next.
            </p>
          </article>
        </div>
      </section>
      <section id="tools" className="landing-section tools-section">
        <span className="eyebrow">AI STUDY TOOLS</span>
        <h2>Everything you need to make a concept stick.</h2>
        <div className="tool-grid">
          <Tool
            icon="✦"
            title="AI Notes"
            text="Turn long material into concise revision notes."
          />
          <Tool
            icon="?"
            title="Quiz Generator"
            text="Test understanding with questions from your source."
          />
          <Tool
            icon="◇"
            title="Flashcards"
            text="Convert chapters into active-recall practice."
          />
          <Tool
            icon="◉"
            title="AI Tutor"
            text="Ask ASHIEY and learn conversationally."
          />
        </div>
      </section>
      <footer>
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>
            StudyForge <i>AI</i>
          </span>
        </div>
        <span>Your AI-powered learning companion.</span>
        <small>© 2026 StudyForge AI</small>
      </footer>
      {p.showAuth && (
        <div className="modal-backdrop" onClick={() => p.setShowAuth(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => p.setShowAuth(false)}
            >
              ×
            </button>
            <div className="brand">
              <span className="brand-mark">S</span>
              <span>
                StudyForge <i>AI</i>
              </span>
            </div>
            <h2>
              {p.mode === "signup"
                ? "Start your learning space"
                : "Welcome back"}
            </h2>
            <p>Let ASHIEY adapt to the way you learn.</p>
            <form className="form" onSubmit={p.auth}>
              {p.mode === "signup" && (
                <label>
                  Name
                  <input
                    value={p.name}
                    onChange={(e) => p.setName(e.target.value)}
                    required
                  />
                </label>
              )}
              <label>
                Email
                <input
                  type="email"
                  value={p.email}
                  onChange={(e) => p.setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={p.password}
                  onChange={(e) => p.setPassword(e.target.value)}
                  required
                />
              </label>
              <button className="button">
                {p.mode === "signup" ? "Create account" : "Sign in"}
              </button>
              {p.error && <small className="error">{p.error}</small>}
            </form>
            <button
              className="switch"
              onClick={() =>
                p.setMode(p.mode === "signup" ? "login" : "signup")
              }
            >
              {p.mode === "signup"
                ? "Already have an account? Sign in"
                : "New to StudyForge? Create an account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function Tool({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <article className="tool-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <a href="#features">Learn more →</a>
    </article>
  );
}
export function Setup(p: any) {
  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <span className="eyebrow">PERSONALIZE ASHIEY</span>
        <h1>Make your study space yours.</h1>
        <p>Tell us what you are working toward.</p>
        <form className="form" onSubmit={p.save}>
          <label>
            Subjects
            <input
              value={p.subjects}
              onChange={(e) => p.setSubjects(e.target.value)}
              placeholder="Data Science, Python"
            />
          </label>
          <label>
            Goal
            <textarea
              value={p.goal}
              onChange={(e) => p.setGoal(e.target.value)}
              placeholder="Prepare for my exams..."
            />
          </label>
          <button className="button">Enter workspace →</button>
          {p.error && <small className="error">{p.error}</small>}
        </form>
      </div>
    </div>
  );
}
export function Profile({ user, theme, onSave, notice }: { user: User; theme: string; onSave: (values: { name: string; subjects: string[]; study_goal: string; explanation_style: string; difficulty: string }) => Promise<void>; notice: string }) {
  const [name, setName] = useState(user.name);
  const [subjects, setSubjects] = useState(user.subjects.join(", "));
  const [goal, setGoal] = useState(user.study_goal);
  const [style, setStyle] = useState(user.explanation_style);
  const [difficulty, setDifficulty] = useState(user.difficulty);
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({ name: name.trim(), subjects: subjects.split(",").map((item) => item.trim()).filter(Boolean), study_goal: goal.trim(), explanation_style: style, difficulty });
    } finally { setSaving(false); }
  }
  return <section className="content-page profile-page">
    <div className="page-heading" style={{ display: "block", maxWidth: 820, margin: "0 auto 24px" }}><span className="eyebrow">YOUR LEARNING, YOUR WAY</span><h1>My study profile</h1><p>Set up ASHIEY to match your subjects, goals, and the way you like to learn.</p></div>
    <form className="profile-form" onSubmit={submit}>
      <div className="profile-identity"><div className="profile-avatar">{name.trim().slice(0, 1).toUpperCase() || "S"}</div><div><strong>{name || "Student"}</strong><span>{user.email}</span></div><span className="profile-appearance">{theme === "dark" ? "☾ Dark pastel" : "☼ Light pastel"}</span></div>
      <div className="profile-fields">
        <label>Display name<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Subjects <small>Separate subjects with commas</small><input value={subjects} onChange={(event) => setSubjects(event.target.value)} placeholder="Biology, Data Science" /></label>
        <label className="profile-wide">Study goal<textarea maxLength={500} rows={3} value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Prepare for my biology exam in three weeks" /></label>
        <label>Explanation style<select value={style} onChange={(event) => setStyle(event.target.value)}><option value="simple">Simple and clear</option><option value="detailed">Detailed explanations</option><option value="example-based">Teach me with examples</option></select></label>
        <label>Practice difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="easy">Gentle warm-up</option><option value="medium">Steady challenge</option><option value="hard">Exam-level challenge</option></select></label>
      </div>
      <div className="profile-footer"><p>{notice || "Your profile is private to your account. Appearance can be changed from the top bar."}</p><button className="button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save my profile"}</button></div>
    </form>
  </section>;
}

export function Overview({ user, progress, notice, upload, setPage, generate, documents, selectedDocumentId, selectDocument, addWebsite, clearNotice }: any) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [addingWebsite, setAddingWebsite] = useState(false);
  async function submitWebsite(event: FormEvent) {
    event.preventDefault();
    setAddingWebsite(true);
    try { if (await addWebsite(websiteUrl.trim())) setWebsiteUrl(""); }
    finally { setAddingWebsite(false); }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STUDY OVERVIEW</span>
          <h1>Good evening, {user.name}.</h1>
          <p>Ready to make some progress?</p>
        </div>
        <span className="status-pill">● Workspace ready</span>
      </div>
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">NEXT UP</span>
          <h2>
            Build your understanding
            <br />
            <em>one idea at a time.</em>
          </h2>
          <p>
            Upload your notes and let ASHIEY turn them into a personal study
            path.
          </p>
          <div className="hero-actions">
            <label className="button upload-button">
              Upload material
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <button className="button quest-button" onClick={() => setPage("practice")}>Play a study quest</button>
          </div>
          <form className="website-source-form" onSubmit={submitWebsite}>
            <label htmlFor="website-source-url">Or add a public website</label>
            <div><input id="website-source-url" type="url" required maxLength={2048} placeholder="https://example.com/study-topic" value={websiteUrl} onChange={(event) => { setWebsiteUrl(event.target.value); clearNotice(); }} /><button className="button quest-button" type="submit" disabled={addingWebsite}>{addingWebsite ? "Reading page…" : "Add link →"}</button></div>
            <small>ASHIEY indexes readable page text. Private, sign-in-only, and video pages aren’t supported.</small>
          </form>
          {documents.length > 0 && <label className="document-picker">Current material<select value={selectedDocumentId} onChange={(event) => selectDocument(event.target.value)}>{documents.map((document: StudyDocument) => <option key={document.id} value={document.id}>{document.filename}</option>)}</select></label>}
          {notice && <small className="notice">{notice}</small>}
        </div>
        <div className="study-scene" role="img" aria-label="A three-dimensional study desk with a laptop, books, plant, and the ASHIEY tutor">
          <div className="scene-window"><span className="scene-moon" /><span className="scene-window-cross" /></div>
          <div className="scene-shelf" />
          <div className="scene-desk">
            <div className="scene-laptop">
              <div className="laptop-screen"><span>A</span><i /><i /><i /></div>
              <div className="laptop-base" />
            </div>
            <div className="scene-book book-one" />
            <div className="scene-book book-two" />
            <div className="scene-cup"><span /></div>
            <div className="scene-plant"><i /><i /><i /><i /><span /></div>
          </div>
          <div className="ashiey-bot" aria-hidden="true"><i className="bot-antenna" /><div className="bot-head"><span /><span /><i /></div><i className="bot-ear" /></div>
          <div className="scene-caption"><span /> ASHIEY <i>YOUR STUDY COMPANION</i></div>
        </div>
      </section>
      <section className="section-block">
        <div className="section-title">
          <span className="eyebrow">QUEST BOARD</span>
          <h2>Choose your next quest.</h2>
        </div>
        <div className="dashboard-tools">
          <Action
            icon="◉"
            title="Ask ASHIEY"
            text="Understand your material in conversation."
            action="Open tutor"
            onClick={() => setPage("chat")}
          />
          <Action
            icon="◇"
            title="Flashcards"
            text="Turn notes into active recall."
            action="Generate cards"
            onClick={() => generate("cards")}
          />
          <Action
            icon="?"
            title="Quiz lab"
            text="Check what you know."
            action="Start quiz"
            onClick={() => generate("quiz")}
          />
          <Action
            icon="↗"
            title="Practice"
            text="Reinforce concepts quickly."
            action="Open practice"
            onClick={() => generate("practice")}
          />
        </div>
      </section>
      <section className="lower-grid">
        <div className="progress-card">
          <span className="eyebrow">YOUR PROGRESS</span>
          <h3>Every small session counts.</h3>
          <div className="snapshot-grid">
            <div><strong>{progress.level}</strong><span>Level</span></div>
            <div><strong>{progress.xp}</strong><span>XP earned</span></div>
            <div><strong>{progress.quizzes_completed}</strong><span>Quizzes</span></div>
            <div><strong>{progress.correct_answers}</strong><span>Correct</span></div>
          </div>
          <button className="quiet-link" onClick={() => setPage("progress")}>View all progress →</button>
        </div>
        <div className="recommendation">
          <span className="eyebrow">ASHIEY RECOMMENDS</span>
          <h3>Start with one focused question.</h3>
          <p>Ask for a simple explanation or an exam tip.</p>
          <button onClick={() => setPage("chat")}>Open AI Tutor →</button>
        </div>
      </section>
    </>
  );
}
function Action({ icon, title, text, action, onClick }: any) {
  return (
    <article className="action-card">
      <span className="action-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <button onClick={onClick}>{action} →</button>
    </article>
  );
}
export function Chat({ question, setQuestion, ask, messages, notice }: any) {
  return (
    <section className="tutor-layout">
      <aside className="tutor-context">
        <span className="eyebrow">AI TUTOR</span>
        <h1>Learn with context.</h1>
        <p>
          ASHIEY explains concepts using your uploaded material and remembers
          the flow of this conversation.
        </p>
        <div className="context-note">
          <strong>Source grounded</strong>
          <small>Upload a PDF from Overview to activate retrieval.</small>
        </div>
      </aside>
      <div className="chat-panel">
        <div className="chat-header">
          <span className="avatar-small">A</span>
          <div>
            <strong>ASHIEY</strong>
            <small>Study companion · ready</small>
          </div>
          <span className="chat-status">●</span>
        </div>
        <div className="message-list">
          {!messages.length && (
            <div className="chat-empty">
              <strong>Hi, I’m ASHIEY.</strong>
              <p>
                Ask me to explain a concept, make an analogy, or help you
                prepare.
              </p>
              <button
                onClick={() => setQuestion("Explain this concept simply")}
              >
                Explain simply
              </button>
              <button onClick={() => setQuestion("Give me an exam tip")}>
                Exam tip
              </button>
            </div>
          )}
          {messages.map((m: Message, i: number) => (
            <div
              className={
                m.role === "user"
                  ? "message user-message"
                  : "message assistant-message"
              }
              key={i}
            >
              <span className="message-label">
                {m.role === "user" ? "YOU" : "ASHIEY"}
              </span>
              <p>{m.text}</p>
              {m.grounded && <small>Source grounded</small>}
              {m.sources?.length ? (
                <details className="message-sources">
                  <summary>
                    Sources - {m.sources.map((source) => source.filename || `page ${source.page}`).join(", ")}
                  </summary>
                  {m.sources.map((source, sourceIndex) => (
                    <p key={`${source.page}-${sourceIndex}`}>
                      <strong>{source.filename || `Page ${source.page}`}</strong>{source.source_url && <> - <a href={source.source_url} target="_blank" rel="noreferrer">Open original page ↗</a></>}<br />{source.excerpt}
                    </p>
                  ))}
                </details>
              ) : null}
            </div>
          ))}
        </div>
        <div className="chat-composer">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            placeholder="Ask ASHIEY anything..."
          />
          <button className="button" onClick={ask}>
            Send
          </button>
        </div>
        {notice && <small className="notice">{notice}</small>}
      </div>
      <aside className="insight-panel">
        <span className="eyebrow">LEARNING INSIGHTS</span>
        <h3>Make the next idea stick.</h3>
        <div>
          <strong>Simple explanation</strong>
          <small>Break a difficult idea into clear steps.</small>
        </div>
        <div>
          <strong>Real-world example</strong>
          <small>Connect theory to something familiar.</small>
        </div>
        <div>
          <strong>Practice question</strong>
          <small>Check your understanding immediately.</small>
        </div>
      </aside>
    </section>
  );
}
export function Cards({ cards, generate, notice }: any) {
  return (
    <section className="content-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACTIVE RECALL</span>
          <h1>Flashcards</h1>
          <p>Review key ideas from your material.</p>
        </div>
        <button className="button" onClick={generate}>
          Generate cards
        </button>
      </div>
      <div className="card-list">
        {cards.length ? (
          cards.map((c: Card, i: number) => (
            <article className="flashcard" key={i}>
              <span>0{i + 1}</span>
              <h3>{c.question}</h3>
              <p>{c.answer}</p>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <h3>Your deck is waiting.</h3>
            <p>Upload a PDF from Overview, then generate cards.</p>
          </div>
        )}
      </div>
      {notice && <small className="notice">{notice}</small>}
    </section>
  );
}
export function Quiz({ quiz, onSubmit, result }: { quiz: Question[]; onSubmit: (answers: Record<string, string>) => void; result: QuizResult | null }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allAnswered = quiz.length > 0 && quiz.every((item) => answers[item.id]);
  return (
    <section className="content-page">
      <span className="eyebrow">KNOWLEDGE CHECK</span>
      <h1>Quiz lab</h1>
      {quiz.length ? (
        quiz.map((q: Question, i: number) => (
          <article className="quiz-item" key={q.id}>
            <span>QUESTION {i + 1}</span>
            <h3>{q.question}</h3>
            <div>
              {q.options.map((o) => (
                <button className={answers[q.id] === o ? "selected" : ""} key={o} disabled={Boolean(result)} onClick={() => setAnswers((current) => ({ ...current, [q.id]: o }))}>{o}</button>
              ))}
            </div>
            {result && <p>{result.review.find((item) => item.id === q.id)?.is_correct ? "Correct." : `Answer: ${result.review.find((item) => item.id === q.id)?.correct_answer}.`} {result.review.find((item) => item.id === q.id)?.explanation}</p>}
          </article>
        ))
      ) : (
        <div className="empty-state">
          <h3>No quiz in progress.</h3>
          <p>Generate a quiz from Overview to begin.</p>
        </div>
      )}
      {quiz.length > 0 && <button className="button" disabled={!allAnswered || Boolean(result)} onClick={() => onSubmit(answers)}>Submit answers</button>}
      {result && <div className="notice">Score: {result.score}/{result.total} · +{result.xp_earned} XP</div>}
    </section>
  );
}
export function Practice({ cards, notice }: any) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="content-page">
      <span className="eyebrow">PRACTICE MODE</span>
      <h1>Concept practice</h1>
      <p>Recall first. Reveal the explanation when ready.</p>
      <div className="practice-grid">
        {cards.map((c: Card, i: number) => (
          <button
            className="practice-card"
            key={i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>CONCEPT {i + 1}</span>
            <strong>{open === i ? c.answer : "Tap to reveal"}</strong>
          </button>
        ))}
      </div>
      {!cards.length && (
        <div className="empty-state">
          <h3>Practice follows your material.</h3>
          <p>Upload a PDF and open Practice from Overview.</p>
        </div>
      )}
      {notice && <small className="notice">{notice}</small>}
    </section>
  );
}
export function Progress({ user, progress }: { user: User; progress: ProgressData }) {
  return (
    <section className="content-page">
      <span className="eyebrow">YOUR MOMENTUM</span>
      <h1>Progress</h1>
      <p>Consistency compounds, {user.name}.</p>
      <div className="progress-summary">
        <div>
          <strong>{progress.level}</strong>
          <span>Current level</span>
        </div>
        <div>
          <strong>{progress.xp}</strong>
          <span>Total XP</span>
        </div>
        <div>
          <strong>{progress.correct_answers}</strong>
          <span>Correct answers</span>
        </div>
      </div>
    </section>
  );
}
