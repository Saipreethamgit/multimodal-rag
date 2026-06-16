import OpenAI from "openai";

declare global {
  // eslint-disable-next-line no-var
  var _openai: OpenAI | undefined;
}

const openai: OpenAI =
  globalThis._openai ??
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (process.env.NODE_ENV !== "production") {
  globalThis._openai = openai;
}

export default openai;

/**
 * Generate a 1536-dim embedding with text-embedding-3-small.
 */
export async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8_000), // safety trim
  });
  return response.data[0].embedding;
}

/**
 * Describe an image (base64) with gpt-4o vision.
 */
export async function describeImage(
  base64: string,
  mimeType: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Describe the contents of this image in detail. Include any text visible, charts, diagrams, tables, or notable visual elements. Be thorough but concise.",
          },
        ],
      },
    ],
  });
  return response.choices[0].message.content ?? "";
}

/**
 * Answer a question given retrieved context chunks.
 */
export async function generateAnswer(
  question: string,
  contextChunks: { content: string; source: string }[],
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const contextText = contextChunks
    .map((c, i) => `[Source ${i + 1} – ${c.source}]\n${c.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a helpful assistant that answers questions based on retrieved document context.
  
Use the provided context to answer the user's question accurately. If the context doesn't contain enough information, say so clearly. Always cite which source(s) you used in your answer using [Source N] notation.

Context:
${contextText}`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-6), // keep last 3 turns
    { role: "user", content: question },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 1024,
    temperature: 0.3,
  });

  return response.choices[0].message.content ?? "No response generated.";
}
