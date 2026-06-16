"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import type { SourceRef } from "@/lib/types";

interface Props { source: SourceRef; index: number; }

export default function SourceBadge({ source, index }: Props) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(source.similarity * 100);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 9px 3px 7px", borderRadius: "20px", background: open ? "rgba(108,142,245,0.12)" : "var(--panel)", border: `1px solid ${open ? "var(--accent)" : "var(--border2)"}`, cursor: "pointer", fontSize: "11px", color: "var(--text2)", fontFamily: "inherit", transition: "all 0.15s" }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text)"; }}}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; }}}
      >
        <FileText size={11} color="var(--accent)" />
        <span>[{index}]</span>
        <span style={{ color: "var(--accent)", fontWeight: 500 }}>{pct}%</span>
      </button>

      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 50, width: "280px", background: "var(--panel2)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={12} color="var(--accent)" />
              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source.document_name}</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: "2px", display: "flex" }}>
              <X size={13} />
            </button>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {source.preview}…
          </div>
          <div style={{ marginTop: "10px", padding: "4px 8px", borderRadius: "6px", background: "rgba(108,142,245,0.08)", display: "inline-flex", alignItems: "center" }}>
            <span style={{ fontSize: "10px", color: "var(--accent)" }}>{pct}% match</span>
          </div>
        </div>
      )}
    </div>
  );
}
