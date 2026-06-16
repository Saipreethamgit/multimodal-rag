import { query } from "./db";
import { embed } from "./openai";

export interface SearchResult {
  id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  chunk_type: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Similarity search using pgvector cosine distance.
 * Returns top-k most relevant chunks.
 */
export async function similaritySearch(
  queryText: string,
  topK: number = 5,
  threshold: number = 0.3
): Promise<SearchResult[]> {
  const embedding = await embed(queryText);
  const vectorLiteral = `[${embedding.join(",")}]`;

  const sql = `
    SELECT
      c.id,
      c.document_id,
      d.name AS document_name,
      c.chunk_index,
      c.content,
      c.chunk_type,
      c.metadata,
      1 - (c.embedding <=> $1::vector) AS similarity
    FROM chunks c
    JOIN documents d ON d.id = c.document_id
    ORDER BY c.embedding <=> $1::vector
    LIMIT $2
  `;
  const results = await query<SearchResult>(sql, [vectorLiteral, topK]);
  console.log("Search results count:", results.length, "for query:", queryText);
  return results;
}

/**
 * Retrieve chunks by document ID (for context window stuffing).
 */
export async function getChunksByDocument(
  documentId: string
): Promise<{ content: string; chunk_index: number }[]> {
  return query<{ content: string; chunk_index: number }>(
    `SELECT content, chunk_index FROM chunks WHERE document_id = $1 ORDER BY chunk_index`,
    [documentId]
  );
}
