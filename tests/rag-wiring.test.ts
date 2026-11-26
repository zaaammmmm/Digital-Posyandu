import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("chat API is limited to parent/cadre/health_worker, rate limited, and never stores the raw question", () => {
  const src = read("../src/app/api/ai/chat/route.ts");
  assert.match(src, /requireAuth\(req, \["parent", "cadre", "health_worker"\]\)/);
  assert.match(src, /consumeRateLimit/);
  assert.doesNotMatch(src, /question:\s*body\.question/);
  assert.match(src, /questionHash/);
  assert.match(src, /reasonCodes: _omit/); // internal reason codes are not returned to the browser
});

test("chat page is guarded by role", () => {
  assert.match(read("../src/app/(dashboard)/chat/page.tsx"), /requirePageContext\(\["parent", "cadre", "health_worker"\]\)/);
});

test("knowledge create/approve scan for injection and approval triggers indexing", () => {
  assert.match(read("../src/app/api/knowledge/route.ts"), /scanKnowledgeDocument\(body\)/);
  const approve = read("../src/app/api/knowledge/[documentId]/approve/route.ts");
  assert.match(approve, /scanKnowledgeDocument/);
  assert.match(approve, /indexKnowledgeDocument/);
  assert.match(read("../src/app/api/knowledge/reindex/route.ts"), /requireAuth\(req, \["content_reviewer", "system_admin"\]\)/);
});

test("retrieval reads approved documents only and checks eligibility", () => {
  const kb = read("../src/lib/ai/knowledge-base.ts");
  assert.match(kb, /where\("status", "==", "approved"\)/);
  assert.match(kb, /filter\(isEligibleDocument\)/);
  assert.match(kb, /isEvidenceSufficient/);
});

test("visit summary generation applies grounding validation in addition to the safety guard", () => {
  const gen = read("../src/lib/ai/summary-generator.ts");
  assert.match(gen, /validateSummaryGrounding\(text, payload\)/);
  assert.match(gen, /visit-summary-id-v1\.2/);
});

test("API keys are sent in headers, not URLs, in new Gemini calls", () => {
  for (const f of ["../src/lib/ai/embedding.ts", "../src/lib/ai/rag-chat.ts"]) {
    const src = read(f);
    assert.match(src, /x-goog-api-key/);
    assert.doesNotMatch(src, /\?key=/);
  }
});

test("firestore rules deny all client access to embeddings and chat events", () => {
  const rules = read("../firestore.rules");
  assert.match(rules, /match \/knowledge_embeddings\/\{embeddingId\} \{ allow read, write: if false; \}/);
  assert.match(rules, /match \/ai_chat_events\/\{eventId\} \{ allow read, write: if false; \}/);
});
