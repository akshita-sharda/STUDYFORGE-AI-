"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="auth-screen"><section className="auth-panel"><span className="kicker">STUDYFORGE</span><h1>Let’s reload your study space.</h1><p>The page could not finish loading. Your notes and account are still saved.</p><div className="form"><button className="button" onClick={() => window.location.reload()}>Reload page</button><button className="button secondary" onClick={reset}>Try again</button></div></section></main>;
}
