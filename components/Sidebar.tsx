"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Upload, FileText, Image as ImageIcon, Trash2, Loader2, AlertCircle, Sparkles } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    if (data.ok) setDocuments(data.documents);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs, refreshKey]);

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
    setDeletingId(id);
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <aside style={{
      width: "280px", flexShrink: 0, display: "flex", flexDirection: "column",
      background: "var(--panel)", borderRight: "1px solid var(--border)",
      height: "100vh", overflow: "hidden"
    }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px var(--accent-glow)"
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text)", letterSpacing: "-0.3px" }}>DocMind</div>
            <div style={{ fontSize: "11px", color: "var(--text2)" }}>AI Document Intelligence</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border2)"}`,
            borderRadius: "10px", padding: "20px 16px", textAlign: "center",
            cursor: uploading ? "default" : "pointer",
            background: dragging ? "var(--accent-glow)" : "var(--panel2)",
            transition: "all 0.2s",
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={20} color="var(--accent)" style={{ margin: "0 auto 8px", animation: "spin 1s linear infinite" }} />
              <div style={{ fontSize: "12px", color: "var(--text2)" }}>Processing document…</div>
              <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>Generating embeddings</div>
            </>
          ) : (
            <>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: "var(--border)", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 10px"
              }}>
                <Upload size={16} color="var(--text2)" />
              </div>
              <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500, marginBottom: "4px" }}>
                Drop a file or click to upload
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)" }}>PDF · Images · Text files</div>
            </>
          )}
        </div>

        {uploadError && (
          <div style={{
            marginTop: "10px", padding: "8px 10px", borderRadius: "7px",
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
            display: "flex", alignItems: "center", gap: "6px"
          }}>
            <AlertCircle size={13} color="var(--red)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "var(--red)" }}>{uploadError}</span>
          </div>
        )}

        <input ref={fileRef} type="file"
          accept=".pdf,.txt,.md,image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: "12px", color: "var(--text3)", lineHeight: 1.6 }}>
              No documents yet.<br />Upload one to get started.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 8px 8px" }}>
              {documents.length} Document{documents.length !== 1 ? "s" : ""}
            </div>
            {documents.map((doc) => (
              <div key={doc.id}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", marginBottom: "2px", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--panel2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: "30px", height: "30px", borderRadius: "7px",
                  background: doc.file_type === "image" ? "rgba(108,142,245,0.12)" : "rgba(61,214,140,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  {doc.file_type === "image"
                    ? <ImageIcon size={14} color="var(--accent)" />
                    : <FileText size={14} color="var(--green)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "1px" }}>
                    {formatSize(doc.file_size)} · {formatDate(doc.created_at)}
                  </div>
                </div>
                <button onClick={() => deleteDoc(doc.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "5px", opacity: 0.4, display: "flex", color: "var(--text2)", transition: "all 0.15s" }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.opacity = "1"; b.style.color = "var(--red)"; }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.opacity = "0.4"; b.style.color = "var(--text2)"; }}
                >
                  {deletingId === doc.id
                    ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    : <Trash2 size={13} />}
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "10px", color: "var(--text3)", textAlign: "center" }}>
          Powered by pgvector + GPT-4o
        </div>
      </div>
    </aside>
  );
}
