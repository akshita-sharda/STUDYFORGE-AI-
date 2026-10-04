"use client";
import { useEffect, useState } from "react";
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem("studyforge-color-mode"); } catch {}
      const next = saved === "dark" || (saved !== "light" && media.matches);
      document.documentElement.dataset.theme = next ? "dark" : "light";
      setDark(next);
    };
    sync(); media.addEventListener("change", sync); window.addEventListener("storage", sync);
    return () => { media.removeEventListener("change", sync); window.removeEventListener("storage", sync); };
  }, []);
  function toggle() {
    const next = !dark; setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("studyforge-color-mode", next ? "dark" : "light"); } catch {}
  }
  return <button type="button" className="theme-toggle" aria-label="Dark mode" aria-pressed={dark} onClick={toggle}><span aria-hidden="true">{dark ? "☀" : "☾"}</span>{dark ? "Light mode" : "Dark mode"}</button>;
}
