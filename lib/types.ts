export interface Document {
  id: string;
  name: string;
  file_type: "pdf" | "image" | "text";
  file_path: string;
  file_size: number;
  created_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  chunk_type: "text" | "image_description";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceRef[];
  created_at: string;
}

export interface SourceRef {
  chunk_id: string;
  document_name: string;
  similarity: number;
  preview: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

// API response shapes
export interface UploadResponse {
  ok: boolean;
  documentId?: string;
  chunksCreated?: number;
  error?: string;
}

export interface QueryResponse {
  ok: boolean;
  answer?: string;
  sources?: SourceRef[];
  messageId?: string;
  error?: string;
}
