# Multimodal RAG — Next.js 15 + pgvector + GPT-4o

A production-ready Retrieval-Augmented Generation app that lets you chat with **PDFs, images, and text files** using semantic vector search.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router)                                             │
│                                                                      │
│   Sidebar (upload + doc list)          ChatPanel (Q&A interface)     │
│          │                                      │                    │
│   POST /api/upload               POST /api/query                     │
│          │                                      │                    │
│   ┌──── Ingest Pipeline ────┐    ┌─── RAG Pipeline ────┐            │
│   │ PDF → pdf-parse         │    │ embed(question)      │            │
│   │ Image → GPT-4o vision   │    │ pgvector similarity  │            │
│   │ Text → chunk            │    │ GPT-4o completion    │            │
│   │ embed → pgvector INSERT  │    │ save to messages     │            │
│   └─────────────────────────┘    └──────────────────────┘            │
│                                                                      │
│  PostgreSQL + pgvector                                               │
│  documents / chunks (vector 1536) / conversations / messages         │
└──────────────────────────────────────────────────────────────────────┘
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Embeddings | OpenAI `text-embedding-3-small` (1536-dim) |
| Vision | OpenAI `gpt-4o` (image → description) |
| Generation | OpenAI `gpt-4o` |
| Vector DB | PostgreSQL + `pgvector` extension |
| ORM | Raw `pg` queries for full control |

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ with the `pgvector` extension installed
- OpenAI API key

### Install pgvector

**macOS (Homebrew):**
```bash
brew install pgvector
```

**Ubuntu / Debian:**
```bash
sudo apt install postgresql-15-pgvector   # adjust version
```

**Docker:**
```bash
docker run -d \
  --name pgvector \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd multimodal-rag
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/multimodal_rag
OPENAI_API_KEY=sk-...
```

### 3. Create database & run schema

```bash
# Create database (if it doesn't exist)
createdb multimodal_rag

# Apply schema (enables pgvector, creates tables + indexes)
npm run db:setup
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Upload** — drag a PDF, PNG/JPG, or `.txt`/`.md` into the sidebar drop zone.
   - PDFs are text-extracted and chunked (~1000 chars with 150-char overlap).
   - Images are described by GPT-4o vision, description is then embedded.
   - Text files are chunked directly.

2. **Ask** — type a question. The app:
   - Embeds the question with `text-embedding-3-small`
   - Finds top-5 chunks via cosine similarity (`<=>` operator)
   - Passes context + history to GPT-4o
   - Returns the answer with clickable source badges

3. **Sources** — click any `[N]` badge below an answer to preview the exact chunk.

## Project Structure

```
multimodal-rag/
├── app/
│   ├── api/
│   │   ├── upload/route.ts      # file upload + ingest trigger
│   │   ├── query/route.ts       # RAG pipeline
│   │   └── documents/route.ts   # list & delete documents
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Sidebar.tsx              # upload zone + document list
│   ├── ChatPanel.tsx            # message thread + input
│   └── SourceBadge.tsx          # hoverable source tooltip
├── lib/
│   ├── db.ts                    # pg Pool singleton + query helper
│   ├── openai.ts                # embed / describeImage / generateAnswer
│   ├── ingest.ts                # PDF / image / text ingestion pipeline
│   ├── vectorSearch.ts          # pgvector similarity search
│   └── types.ts                 # shared TypeScript types
├── sql/
│   └── schema.sql               # pgvector schema
├── scripts/
│   └── setup-db.js              # DB initialisation script
└── .env.example
```

## Supported File Types

| Type | Extensions | Processing |
|------|-----------|------------|
| PDF | `.pdf` | `pdf-parse` → text chunks |
| Image | `.jpg`, `.png`, `.webp`, `.gif` | GPT-4o vision description |
| Text | `.txt`, `.md` | Direct text chunking |

Max file size: **20 MB**

## Configuration

Edit constants in `lib/ingest.ts`:
```ts
const CHUNK_SIZE    = 1_000;  // characters per chunk
const CHUNK_OVERLAP = 150;    // overlap between chunks
```

Edit similarity threshold / top-K in `app/api/query/route.ts`:
```ts
const topK      = 5;
const threshold = 0.3;   // cosine similarity floor
```

## Production Deployment

```bash
npm run build
npm start
```

Ensure `DATABASE_URL` and `OPENAI_API_KEY` are set in the production environment. Use a managed Postgres service (e.g. Supabase, Neon, RDS) with pgvector enabled.

## License

MIT
