import { v4 as uuidv4 } from "uuid";
import { query } from "./db";
import { embed, describeImage } from "./openai";

const CHUNK_SIZE = 1_000;
const CHUNK_OVERLAP = 150;

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

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

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

export type IngestResult = { documentId: string; chunksCreated: number };

export async function ingestBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  fileSize: number
): Promise<IngestResult> {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";

  let fileType: "pdf" | "image" | "text";
  if (mimeType === "application/pdf" || ext === "pdf") fileType = "pdf";
  else if (mimeType.startsWith("image/")) fileType = "image";
  else fileType = "text";

  const documentId = uuidv4();
  await query(
    `INSERT INTO documents (id, name, file_type, file_path, file_size) VALUES ($1, $2, $3, $4, $5)`,
    [documentId, originalName, fileType, originalName, fileSize]
  );

  let chunksToSave: { content: string; type: "text" | "image_description"; metadata?: Record<string, unknown> }[] = [];

  if (fileType === "pdf") {
    const text = await extractPdfText(buffer);
    chunksToSave = chunkText(text).map((c) => ({ content: c, type: "text" as const }));
  } else if (fileType === "image") {
    const base64 = buffer.toString("base64");
    const description = await describeImage(base64, mimeType);
    chunksToSave = [{ content: description, type: "image_description", metadata: { mimeType } }];
  } else {
    const text = buffer.toString("utf-8");
    chunksToSave = chunkText(text).map((c) => ({ content: c, type: "text" as const }));
  }

  await saveChunks(documentId, chunksToSave);
  return { documentId, chunksCreated: chunksToSave.length };
}
