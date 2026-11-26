import { randomBytes } from "node:crypto";
import { answerEducationQuestion, type RagResponse } from "./rag-pipeline";
import { retrieveRanked } from "./knowledge-base";
import { EMBEDDING_MODEL, embeddingsConfigured } from "./embedding";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export type ChatProvenance = {
  modelProvider: string; modelVersion: string; embeddingModel: string | null; sourceIds: string[];
};

async function generateWithGemini(input: { systemInstruction: string; userPrompt: string }): Promise<{ text: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: input.userPrompt }] }],
        generationConfig: {
          temperature: 0.1, maxOutputTokens: 1024, responseMimeType: "application/json",
          responseSchema: { type: "OBJECT", properties: {
            status: { type: "STRING", enum: ["answered", "abstain"] },
            answer: { type: "STRING" },
            citations: { type: "ARRAY", items: { type: "STRING" } },
          }, required: ["status", "answer", "citations"] },
          // Thinking tokens would otherwise consume the output budget on 2.5-flash models.
          ...(/flash/.test(MODEL) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
    });
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    return { text };
  } finally {
    clearTimeout(timer);
  }
}

export async function runEducationChat(question: unknown): Promise<{ response: RagResponse; provenance: ChatProvenance }> {
  let sourceIds: string[] = [];
  let usedEmbeddings = false;
  const response = await answerEducationQuestion(question, {
    retrieve: async (q) => {
      const result = await retrieveRanked(q, 4);
      sourceIds = [...new Set(result.ranked.map(r => r.documentId))];
      usedEmbeddings = result.ranked.some(r => r.cosine !== null);
      return result;
    },
    generate: generateWithGemini,
    randomHex: () => randomBytes(8).toString("hex"),
  });
  return { response, provenance: {
    modelProvider: "google-gemini", modelVersion: MODEL,
    embeddingModel: embeddingsConfigured() && usedEmbeddings ? EMBEDDING_MODEL : null, sourceIds,
  } };
}
