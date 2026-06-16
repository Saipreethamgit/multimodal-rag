"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import type { SourceRef } from "@/lib/types";

interface Props {
  source: SourceRef;
  index: number;
}

export default function SourceBadge({ source, index }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-border hover:bg-border/70 text-[10px] text-muted transition-colors"
      >
        <FileText className="w-3 h-3" />
        <span>[{index}] {source.document_name.slice(0, 20)}</span>
        <span className="text-accent">{Math.round(source.similarity * 100)}%</span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-lg bg-panel border border-border shadow-lg p-3">
          <p className="text-xs font-medium text-ink mb-1 truncate">{source.document_name}</p>
          <p className="text-[11px] text-muted leading-relaxed line-clamp-4">{source.preview}…</p>
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 text-muted hover:text-ink text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
