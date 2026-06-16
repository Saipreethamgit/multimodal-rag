"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import clsx from "clsx";
import SourceBadge from "./SourceBadge";
import type { SourceRef } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationId, topK: 5 }),
      });
      const data = await res.json();

      if (data.conversationId) setConversationId(data.conversationId);

      const assistantMsg: ChatMessage = {
        id: data.messageId ?? crypto.randomUUID(),
        role: "assistant",
        content: data.ok ? data.answer : `Error: ${data.error}`,
        sources: data.sources ?? [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-10 h-10 text-accent mb-3 opacity-60" />
            <p className="text-sm text-muted max-w-xs">
              Upload a document in the sidebar, then ask a question about it.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-3 max-w-3xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div
              className={clsx(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5",
                msg.role === "user" ? "bg-accent" : "bg-border"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5 text-white" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-accent" />
              )}
            </div>

            {/* Bubble */}
            <div className="flex flex-col gap-2 min-w-0">
              <div
                className={clsx(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent text-white rounded-tr-sm"
                    : "bg-panel border border-border text-ink rounded-tl-sm prose-dark"
                )}
                dangerouslySetInnerHTML={
                  msg.role === "assistant"
                    ? { __html: simpleMarkdown(msg.content) }
                    : undefined
                }
              >
                {msg.role === "user" ? msg.content : undefined}
              </div>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {msg.sources.map((src, i) => (
                    <SourceBadge key={i} source={src} index={i + 1} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-panel border border-border px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-panel px-4 py-4">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents…"
            rows={1}
            className="flex-1 resize-none bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-accent/60 transition-colors max-h-40 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-muted text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/** Minimal markdown renderer – bold, italic, code, line breaks */
function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}
