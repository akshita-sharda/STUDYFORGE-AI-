"use client";

import { FormEvent, useEffect, useState } from "react";
import { Cards, Chat, Landing, Overview, Practice, Progress, Quiz, Setup, type Card, type Message, type ProgressData, type Question, type QuizResult, type StudyDocument, type User } from "./screens";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
function errorText(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item?.msg === "string" ? item.msg : "Invalid input"))
      .join(" ");
  }
  return fallback;
}
const nav = [
  ["overview", "Overview"],
  ["chat", "ASHIEY chat"],
  ["cards", "Flashcards"],
  ["quiz", "Quizzes"],
  ["practice", "Practice"],
  ["progress", "Progress"],
];

export default function Home() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjects, setSubjects] = useState("");
  const [goal, setGoal] = useState("");
  const [setup, setSetup] = useState(false);
  const [page, setPage] = useState("overview");
  const [documentId, setDocumentId] = useState("");
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState("");
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [progressData, setProgressData] = useState<ProgressData>({ xp: 0, level: 1, quizzes_completed: 0, correct_answers: 0 });
  const [gameCards, setGameCards] = useState<Card[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("studyforge_token");
    if (!saved) return;
    setToken(saved);
    fetch(API + "/api/auth/me", {
      headers: { Authorization: "Bearer " + saved },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Session expired");
        const d = await r.json();
        setUser(d.user);
        await Promise.all([loadProgress(saved), loadDocuments(saved)]);
      })
      .catch(() => {
        localStorage.removeItem("studyforge_token");
        setToken("");
      });
  }, []);
  async function loadProgress(authToken: string) {
    const r = await fetch(API + "/api/progress", {
      headers: { Authorization: "Bearer " + authToken },
    });
    if (r.ok) setProgressData(await r.json());
  }
  async function loadDocuments(authToken: string) {
    const r = await fetch(API + "/api/documents", {
      headers: { Authorization: "Bearer " + authToken },
    });
    if (!r.ok) return;
    const savedDocuments: StudyDocument[] = await r.json();
    setDocuments(savedDocuments);
    setDocumentId((current) => current || savedDocuments[0]?.id || "");
  }
  async function auth(e: FormEvent) {
    e.preventDefault();
    setError("");
    const endpoint = mode === "signup" ? "signup" : "login";
    const body =
      mode === "signup" ? { name, email, password } : { email, password };
    try {
      const r = await fetch(API + "/api/auth/" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(errorText(d.detail, "Unable to continue"));
        return;
      }
      localStorage.setItem("studyforge_token", d.token);
      setToken(d.token);
      setUser(d.user);
      void loadProgress(d.token);
      void loadDocuments(d.token);
      setSetup(mode === "signup");
    } catch {
      setError("Could not reach ASHIEY. Check that the backend is running, then try again.");
    }
  }
  async function saveSetup(e: FormEvent) {
    e.preventDefault();
    const r = await fetch(API + "/api/profile/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        subjects: subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        study_goal: goal,
        explanation_style: "simple",
        difficulty: "medium",
        theme: "brown",
      }),
    });
    const d = await r.json();
    if (r.ok) {
      setUser(d.user);
      setSetup(false);
      void loadProgress(token);
    } else setError(errorText(d.detail, "Could not save preferences"));
  }
  async function upload(file?: File) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setNotice("Indexing your material...");
    const r = await fetch(API + "/api/documents/upload", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: form,
    });
    const d = await r.json();
    if (r.ok) {
      setDocumentId(d.document_id);
      setDocuments((current) => [
        { id: d.document_id, filename: d.filename },
        ...current.filter((item) => item.id !== d.document_id),
      ]);
      setNotice(d.filename + " is ready. " + d.chunks + " sections indexed.");
    } else setNotice(d.detail || "Upload failed");
  }
  async function ask() {
    const text = question.trim();
    if (!text) return;
    setQuestion("");
    setMessages((items) => [...items, { role: "user", text }]);
    setNotice("ASHIEY is thinking...");
    const r = await fetch(API + "/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ question: text, document_id: documentId || null }),
    });
    const d = await r.json();
    const reply = d.answer || "I could not find an answer yet.";
    setMessages((items) => [
      ...items,
      { role: "assistant", text: reply, grounded: Boolean(d.grounded) },
    ]);
    setNotice(
      d.grounded
        ? "Grounded in your material."
        : "Upload a PDF for grounded answers.",
    );
  }
  async function generate(kind: "cards" | "quiz" | "practice") {
    if (!documentId) {
      setNotice("Upload a PDF first.");
      setPage("overview");
      return;
    }
    const endpoint =
      kind === "cards" ? "/api/flashcards/generate" : "/api/quizzes/generate";
    if (kind === "practice") {
      const r = await fetch(
        API + "/api/games/challenge/" + documentId + "?count=5",
        { headers: { Authorization: "Bearer " + token } },
      );
      const d = await r.json();
      setGameCards(d.cards || []);
      setPage("practice");
      return;
    }
    const r = await fetch(API + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ document_id: documentId, count: 5 }),
    });
    const d = await r.json();
    if (kind === "cards") {
      setCards(d.flashcards || []);
      setPage("cards");
    } else {
      setQuiz(d.questions || []);
      setQuizId(d.quiz_id || "");
      setQuizResult(null);
      setPage("quiz");
    }
  }
  async function submitQuiz(answers: Record<string, string>) {
    const r = await fetch(API + "/api/quizzes/" + quizId + "/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ answers }),
    });
    const d = await r.json();
    if (!r.ok) {
      setNotice(errorText(d.detail, "Could not submit your quiz."));
      return;
    }
    setQuizResult(d);
    setProgressData(d.progress);
  }
  if (!user)
    return (
      <Landing
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        mode={mode}
        setMode={setMode}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        auth={auth}
        error={error}
      />
    );
  if (setup)
    return (
      <Setup
        subjects={subjects}
        setSubjects={setSubjects}
        goal={goal}
        setGoal={setGoal}
        save={saveSetup}
        error={error}
      />
    );
  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          className="brand brand-button"
          onClick={() => setPage("overview")}
        >
          <span className="brand-mark">S</span>
          <span>
            StudyForge <i>AI</i>
          </span>
        </button>
        <nav>
          {nav.map(([id, label]) => (
            <button
              key={id}
              className={page === id ? "top-link active" : "top-link"}
              onClick={() => setPage(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <span className="user-avatar">{user.name[0].toUpperCase()}</span>
      </header>
      <main className="workspace">
        {page === "overview" && (
          <Overview
            user={user}
            notice={notice}
            upload={upload}
            setPage={setPage}
            generate={generate}
            documents={documents}
            selectedDocumentId={documentId}
            selectDocument={setDocumentId}
          />
        )}
        {page === "chat" && (
          <Chat
            question={question}
            setQuestion={setQuestion}
            ask={ask}
            messages={messages}
            notice={notice}
          />
        )}
        {page === "cards" && (
          <Cards
            cards={cards}
            generate={() => generate("cards")}
            notice={notice}
          />
        )}
        {page === "quiz" && <Quiz key={quizId} quiz={quiz} onSubmit={submitQuiz} result={quizResult} />}
        {page === "practice" && <Practice cards={gameCards} notice={notice} />}
        {page === "progress" && <Progress user={user} progress={progressData} />}
      </main>
    </div>
  );
}
