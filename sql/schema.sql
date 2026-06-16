-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table: tracks uploaded files
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  file_type   TEXT NOT NULL,          -- 'pdf' | 'image' | 'text'
  file_path   TEXT NOT NULL,
  file_size   INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chunks table: text/image chunks with embeddings
CREATE TABLE IF NOT EXISTS chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  content      TEXT NOT NULL,           -- extracted text or image description
  chunk_type   TEXT NOT NULL,           -- 'text' | 'image_description'
  embedding    vector(1536),            -- text-embedding-3-small dimension
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for document lookups
CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON chunks(document_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  sources         JSONB DEFAULT '[]',   -- chunk IDs used as context
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
