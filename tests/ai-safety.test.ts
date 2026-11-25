import test from "node:test";
import assert from "node:assert/strict";
import { checkAiSummarySafety } from "../src/lib/ai/safety-guard.ts";

test("rejects diagnosis and prescription language", () => {
  assert.equal(checkAiSummarySafety("Anak mengalami anemia dan perlu dosis obat.", true).passed, false);
});

test("does not approve empty output or missing source", () => {
  assert.equal(checkAiSummarySafety("", false).passed, false);
});
