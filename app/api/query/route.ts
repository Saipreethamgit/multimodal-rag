import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { similaritySearch } from "@/lib/vectorSearch";
import { generateAnswer } from "@/lib/openai";
import { query } from "@/lib/db";
import type { QueryResponse, SourceRef } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QueryBody {
  question: string;
  conversationId?: string;
  topK?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<QueryResponse>> {
  try {
    const body: QueryBody = await request.json();
    const { question, conversationId, topK = 5 } = body;

    if (!question?.trim()) {
      return NextResponse.json({ ok: false, error: "Question is required" }, { status: 400 });
    }

    // Retrieve conversation history (if any)
    let history: { role: "user" | "assistant"; content: string }[] = [];
    let convId = conversationId;

    if (convId) {
      const msgs = await query<{ role: "user" | "assistant"; content: string }>(
        `SELECT role, content FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at
         LIMIT 10`,
        [convId]
      );
      history = msgs;
    } else {
      // Create new conversation
      convId = uuidv4();
      await query(
        `INSERT INTO conversations (id, title) VALUES ($1, $2)`,
        [convId, question.slice(0, 80)]
      );
    }

    // Semantic search
    const searchResults = await similaritySearch(question, topK);

    if (searchResults.length === 0) {
      const noContextAnswer =
        "I couldn't find any relevant information in the uploaded documents to answer your question.";

      await persistMessages(convId, question, noContextAnswer, []);

      return NextResponse.json({
        ok: true,
        answer: noContextAnswer,
        sources: [],
        conversationId: convId,
      });
    }

    // Build context for LLM
    const contextChunks = searchResults.map((r) => ({
      content: r.content,
      source: r.document_name,
    }));

    const answer = await generateAnswer(question, contextChunks, history);

    // Map to source refs
    const sources: SourceRef[] = searchResults.map((r) => ({
      chunk_id: r.id,
      document_name: r.document_name,
      similarity: Math.round(r.similarity * 100) / 100,
      preview: r.content.slice(0, 150),
    }));

    const messageId = await persistMessages(convId, question, answer, sources);

    return NextResponse.json({
      ok: true,
      answer,
      sources,
      conversationId: convId,
      messageId,
    });
  } catch (err) {
    console.error("[query] error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

async function persistMessages(
  convId: string,
  question: string,
  answer: string,
  sources: SourceRef[]
): Promise<string> {
  await query(
    `INSERT INTO messages (id, conversation_id, role, content, sources)
     VALUES ($1, $2, 'user', $3, '[]')`,
    [uuidv4(), convId, question]
  );

  const assistantId = uuidv4();
  await query(
    `INSERT INTO messages (id, conversation_id, role, content, sources)
     VALUES ($1, $2, 'assistant', $3, $4)`,
    [assistantId, convId, answer, JSON.stringify(sources)]
  );

  return assistantId;
}
