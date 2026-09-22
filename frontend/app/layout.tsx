import type { Metadata } from "next";
import "./rebuild.css";
import "./brown-overrides.css";
import "./chat-polish.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyForge AI | ASHIEY",
  description: "A friendly AI study companion for students.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
