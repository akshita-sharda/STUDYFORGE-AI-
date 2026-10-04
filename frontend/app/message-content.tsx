"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [status, setStatus] = useState("");
  async function copy() { try { await navigator.clipboard.writeText(code); setStatus("Copied"); } catch { setStatus("Select the code below to copy manually."); } }
  const parts = code.split(/(\/\/[^\n]*|#[^\n]*|--[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:const|let|var|function|return|if|else|for|while|class|import|from|def|print|async|await|SELECT|FROM|WHERE|JOIN|ON|INSERT|UPDATE|CREATE|TABLE|int|void|public|static|new|true|false|True|False|None|null)\b|\b\d+(?:\.\d+)?\b)/g);
  return <div className="code-block"><div className="code-heading"><span>{language || "code"}</span><button type="button" onClick={copy}>Copy code</button></div><pre><code>{parts.map((part, i) => <span key={i} className={/^(\/\/|#|--)/.test(part) ? "syntax-comment" : /^["']/.test(part) ? "syntax-string" : /^\d/.test(part) ? "syntax-number" : /^(const|let|var|function|return|if|else|for|while|class|import|from|def|print|async|await|SELECT|FROM|WHERE|JOIN|ON|INSERT|UPDATE|CREATE|TABLE|int|void|public|static|new|true|false|True|False|None|null)$/.test(part) ? "syntax-keyword" : undefined}>{part}</span>)}</code></pre>{status && <small role="status">{status}</small>}</div>;
}
export default function MessageContent({ content }: { content: string }) {
 return <div className="message-prose"><ReactMarkdown remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[rehypeKatex]} components={{pre:({children})=><>{children}</>,code:({className,children,...props})=>{const code=String(children).replace(/\n$/,"");return className?.startsWith("language-")||String(children).includes("\n")?<CodeBlock language={className?.replace("language-","")||"code"} code={code}/>:<code {...props}>{children}</code>},a:({children,href})=><a href={href} target="_blank" rel="noopener noreferrer">{children}</a>}}>{content}</ReactMarkdown></div>;
}
