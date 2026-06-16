"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, FileSearch, Zap } from "lucide-react";
import SourceBadge from "./SourceBadge";
import type { SourceRef } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
}

const SUGGESTIONS = [
  "Summarize the key points in my document",
  "What are the main topics covered?",
  "Extract all important dates and numbers",
  "What conclusions does this document reach?",
];

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, conversationId, topK: 5 }),
      });
      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((prev) => [...prev, {
        id: data.messageId ?? crypto.randomUUID(),
        role: "assistant",
        content: data.ok ? data.answer : `Error: ${data.error}`,
        sources: data.sources ?? [],
      }]);
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--panel)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileSearch size={16} color="var(--accent)" />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>Document Chat</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
          <span style={{ fontSize: "12px", color: "var(--text2)" }}>GPT-4o</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(108,142,245,0.15), rgba(139,108,246,0.15))", border: "1px solid rgba(108,142,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 0 32px rgba(108,142,245,0.1)" }}>
              <Sparkles size={28} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", marginBottom: "8px", letterSpacing: "-0.5px" }}>Ask your documents anything</h2>
            <p style={{ fontSize: "14px", color: "var(--text2)", maxWidth: "380px", lineHeight: 1.7, marginBottom: "32px" }}>
              Upload a PDF or image in the sidebar, then ask questions. I'll find the relevant sections and answer with citations.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "480px" }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  style={{ background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "11px 16px", fontSize: "13px", color: "var(--text2)", cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = "var(--accent)"; b.style.color = "var(--text)"; b.style.background = "rgba(108,142,245,0.05)"; }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "var(--border)"; b.style.color = "var(--text2)"; b.style.background = "var(--panel2)"; }}
                >
                  <span>{s}</span>
                  <Zap size={13} color="var(--accent)" style={{ opacity: 0.6, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: "12px", maxWidth: "800px", alignSelf: msg.role === "user" ? "flex-end" : "flex-start", width: msg.role === "user" ? "auto" : "100%", animation: "fade-up 0.3s ease forwards" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0, background: msg.role === "user" ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--panel2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px" }}>
              {msg.role === "user" ? <User size={13} color="#fff" /> : <Sparkles size={13} color="var(--accent)" />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: msg.role === "assistant" ? 1 : undefined }}>
              <div
                style={{ padding: msg.role === "user" ? "10px 14px" : "14px 16px", borderRadius: msg.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px", background: msg.role === "user" ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--panel2)", border: msg.role === "user" ? "none" : "1px solid var(--border)", fontSize: "14px", lineHeight: 1.75, color: msg.role === "user" ? "#fff" : "var(--text)", maxWidth: msg.role === "user" ? "480px" : undefined, boxShadow: msg.role === "user" ? "0 2px 12px rgba(108,142,245,0.25)" : "none" }}
                className={msg.role === "assistant" ? "prose" : ""}
                dangerouslySetInnerHTML={msg.role === "assistant" ? { __html: renderMarkdown(msg.content) } : undefined}
              >
                {msg.role === "user" ? msg.content : undefined}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "2px" }}>
                  {msg.sources.map((src, j) => <SourceBadge key={j} source={src} index={j + 1} />)}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: "12px", maxWidth: "800px", alignSelf: "flex-start" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0, background: "var(--panel2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={13} color="var(--accent)" />
            </div>
            <div style={{ padding: "14px 18px", borderRadius: "4px 14px 14px 14px", background: "var(--panel2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "16px 24px 20px", borderTop: "1px solid var(--border)", background: "var(--panel)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", maxWidth: "800px", margin: "0 auto", background: "var(--panel2)", border: "1px solid var(--border2)", borderRadius: "14px", padding: "10px 10px 10px 16px", transition: "border-color 0.2s, box-shadow 0.2s" }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(108,142,245,0.1)"; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents…" rows={1}
            style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontSize: "14px", color: "var(--text)", fontFamily: "inherit", lineHeight: 1.6, minHeight: "24px", maxHeight: "160px", overflowY: "auto" }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width: "36px", height: "36px", borderRadius: "9px", border: "none", background: input.trim() && !loading ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--border)", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", boxShadow: input.trim() && !loading ? "0 2px 8px rgba(108,142,245,0.3)" : "none" }}
          >
            <Send size={15} color={input.trim() && !loading ? "#fff" : "var(--text3)"} />
          </button>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text3)", textAlign: "center", marginTop: "10px" }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>").replace(/$/, "</p>");
}
