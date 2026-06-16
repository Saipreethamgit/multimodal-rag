import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { query } from "./db";
import { embed, describeImage } from "./openai";

const CHUNK_SIZE = 1_000;   // characters
const CHUNK_OVERLAP = 150;  // characters

// ── Text chunking ────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 50);
}

// ── PDF ingestion ─────────────────────────────────────────────────────────────

async function extractPdfText(filePath: string): Promise<string> {
  // Dynamic import so the module is only loaded server-side
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

// ── Image ingestion ───────────────────────────────────────────────────────────

async function processImage(filePath: string, mimeType: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString("base64");
  return describeImage(base64, mimeType);
}

// ── Chunk persistence ────────────────────────────────────────────────────────

async function saveChunks(
  documentId: string,
  chunks: { content: string; type: "text" | "image_description"; metadata?: Record<string, unknown> }[]
) {
  for (let i = 0; i < chunks.length; i++) {
    const { content, type, metadata = {} } = chunks[i];
    const embedding = await embed(content);
    const vectorLiteral = `[${embedding.join(",")}]`;

    await query(
      `INSERT INTO chunks (id, document_id, chunk_index, content, chunk_type, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::vector, $7)`,
      [uuidv4(), documentId, i, content, type, vectorLiteral, JSON.stringify(metadata)]
    );
  }
}

// ── Main ingest entry-point ──────────────────────────────────────────────────

export type IngestResult = {
  documentId: string;
  chunksCreated: number;
};

export async function ingestFile(
  filePath: string,
  originalName: string,
  mimeType: string,
  fileSize: number
): Promise<IngestResult> {
  const ext = path.extname(originalName).toLowerCase();

  // Detect file type
  let fileType: "pdf" | "image" | "text";
  if (mimeType === "application/pdf" || ext === ".pdf") {
    fileType = "pdf";
  } else if (mimeType.startsWith("image/")) {
    fileType = "image";
  } else {
    fileType = "text";
  }

  // Insert document record
  const documentId = uuidv4();
  await query(
    `INSERT INTO documents (id, name, file_type, file_path, file_size)
     VALUES ($1, $2, $3, $4, $5)`,
    [documentId, originalName, fileType, filePath, fileSize]
  );

  // Extract content and create chunks
  let chunksToSave: { content: string; type: "text" | "image_description"; metadata?: Record<string, unknown> }[] = [];

  if (fileType === "pdf") {
    const text = await extractPdfText(filePath);
    const textChunks = chunkText(text);
    chunksToSave = textChunks.map((c) => ({ content: c, type: "text" }));

  } else if (fileType === "image") {
    const description = await processImage(filePath, mimeType);
    chunksToSave = [{ content: description, type: "image_description", metadata: { mimeType } }];

  } else {
    const text = await fs.readFile(filePath, "utf-8");
    const textChunks = chunkText(text);
    chunksToSave = textChunks.map((c) => ({ content: c, type: "text" }));
  }

  await saveChunks(documentId, chunksToSave);

  return { documentId, chunksCreated: chunksToSave.length };
}
