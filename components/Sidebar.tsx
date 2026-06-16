"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Upload, FileText, Image, Trash2, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { Document } from "@/lib/types";

interface Props {
  onUploadSuccess: () => void;
  refreshKey: number;
}

export default function Sidebar({ onUploadSuccess, refreshKey }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    if (data.ok) setDocuments(data.documents);
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs, refreshKey]);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Upload failed");
      onUploadSuccess();
      await fetchDocs();
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    uploadFile(files[0]);
  }

  async function deleteDoc(id: string) {
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-panel border-r border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-sm font-semibold tracking-wider text-accent uppercase">
          Multimodal RAG
        </h1>
        <p className="text-xs text-muted mt-0.5">pgvector + GPT-4o</p>
      </div>

      {/* Upload zone */}
      <div className="p-4 border-b border-border">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className={clsx(
            "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-5 cursor-pointer transition-colors",
            dragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
          )}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-muted" />
          )}
          <span className="text-xs text-muted text-center leading-snug">
            {uploading ? "Processing…" : "Drop a PDF, image, or text file"}
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploadError && (
          <div className="mt-2 flex items-center gap-1.5 text-red-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {uploadError}
          </div>
        )}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {documents.length === 0 && (
          <p className="text-xs text-muted text-center py-6">No documents yet</p>
        )}
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex items-start gap-2 rounded-md px-2 py-2 hover:bg-border/50 transition-colors"
          >
            {doc.file_type === "image" ? (
              <Image className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            ) : (
              <FileText className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink truncate">{doc.name}</p>
              <p className="text-[10px] text-muted">{formatSize(doc.file_size)}</p>
            </div>
            <button
              onClick={() => deleteDoc(doc.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-red-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
