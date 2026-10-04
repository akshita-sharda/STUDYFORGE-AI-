import type { Metadata } from "next";
import "./minimal.css";
import "./studio.css";
import "./study.css";
import "./profile.css";
import "./dark.css";
import "katex/dist/katex.min.css";
import "./workspace.css";
import "./atelier.css";
import ThemeToggle from "./theme-toggle";
import MotionControl from "./motion-control";

export const metadata: Metadata = {
  title: "StudyForge AI | ASHIEY",
  description: "A focused study space for BTech Computer Science: programming, DSA, databases, operating systems and networks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('studyforge-color-mode');document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()` }} /></head><body>{children}<ThemeToggle /><MotionControl /></body></html>;
}
