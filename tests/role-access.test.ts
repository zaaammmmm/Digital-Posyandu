import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const roleList = (source: string, call: string) => {
  const m = source.match(new RegExp(`${call}\\(\\s*(?:req,\\s*)?\\[([^\\]]*)\\]`));
  assert.ok(m, `role list not found for ${call}`);
  return m![1].split(",").map(v => v.trim().replace(/"/g, "")).filter(Boolean);
};

test("system_admin has no automatic access to health data APIs", () => {
  for (const path of [
    "../src/app/api/children/route.ts", "../src/app/api/children/[childId]/route.ts",
    "../src/app/api/guardians/route.ts", "../src/app/api/consents/route.ts",
    "../src/app/api/ai/summary/generate/route.ts",
  ]) {
    assert.ok(!roleList(read(path), "requireAuth").includes("system_admin"), `${path} still allows system_admin`);
  }
});

test("verification, rejection, correction and correction review are health_worker only", () => {
  for (const path of [
    "../src/app/api/visits/[visitId]/verify/route.ts", "../src/app/api/visits/[visitId]/reject/route.ts",
    "../src/app/api/visits/[visitId]/correct/route.ts", "../src/app/api/corrections/[requestId]/route.ts",
  ]) {
    assert.deepEqual(roleList(read(path), "requireAuth"), ["health_worker"], path);
  }
});

test("health-worker pages are limited to health_worker", () => {
  for (const path of [
    "../src/app/(dashboard)/health-worker/page.tsx", "../src/app/(dashboard)/health-worker/corrections/page.tsx",
    "../src/app/(dashboard)/health-worker/verifications/[visitId]/page.tsx",
  ]) {
    assert.match(read(path), /requirePageContext\(\["health_worker"\]\)/, path);
  }
});

test("previously unguarded pages now have role guards", () => {
  assert.match(read("../src/app/(dashboard)/admin/page.tsx"), /requirePageContext\(\["posyandu_admin", "system_admin"\]\)/);
  assert.match(read("../src/app/(dashboard)/cadre/administration/page.tsx"), /requirePageContext\(/);
  assert.match(read("../src/app/(dashboard)/cadre/guides/page.tsx"), /requirePageContext\(\["cadre", "health_worker"\]\)/);
  assert.match(read("../src/app/(dashboard)/cadre/children/new/layout.tsx"), /requirePageContext\(\["cadre", "posyandu_admin"\]\)/);
  assert.match(read("../src/app/(dashboard)/parent/page.tsx"), /requirePageContext\(\["parent"\]\)/);
});

test("navigation is filtered by role and the layout passes the membership role", () => {
  const nav = read("../src/components/layout/DashboardNavigation.tsx");
  const layout = read("../src/app/(dashboard)/layout.tsx");
  assert.match(nav, /export function navigationFor\(role: NavRole\)/);
  assert.match(layout, /requirePageContext\(\)/);
  assert.match(layout, /role=\{ctx\.role\}/);
  const parentItems = nav.split("\n").filter(l => l.includes("href:") && l.includes("roles:"));
  const forParent = parentItems.filter(l => /roles: \[[^\]]*"parent"/.test(l));
  // Parents see their portal plus the sourced education chatbot (Stage 4); nothing staff-facing.
  const hrefs = forParent.map(l => l.match(/href: "([^"]+)"/)![1]).sort();
  assert.deepEqual(hrefs, ["/chat", "/parent"], "parent should only see the parent portal and the education chat");
});

test("firestore rules no longer grant system_admin health-data reads", () => {
  const rules = read("../firestore.rules");
  assert.match(rules, /function healthDataRoles\(\) \{ return \['cadre', 'health_worker', 'posyandu_admin'\]; \}/);
  assert.doesNotMatch(rules, /function staffRoles\(\) \{[^}]*system_admin/);
  assert.match(rules, /correction_requests[\s\S]*roleIn\(resource\.data\.posyanduId, \['health_worker'\]\)/);
});

test("service event review (immunization/vitamin) is health_worker only and audited", () => {
  const shared = read("../src/lib/data/service-event-review.ts");
  assert.match(shared, /requireAuth\(req, \["health_worker"\]\)/);
  assert.match(shared, /VERIFY_SERVICE_EVENT/);
  assert.match(shared, /REJECT_SERVICE_EVENT/);
  assert.match(shared, /reason\.length < 5/);
  assert.match(read("../src/app/api/immunizations/[eventId]/review/route.ts"), /"immunization_events"/);
  assert.match(read("../src/app/api/supplements/[eventId]/review/route.ts"), /"supplement_events"/);
});

test("guardians only see verified immunizations and vitamins", () => {
  const page = read("../src/app/(dashboard)/parent/children/[childId]/page.tsx");
  assert.equal((page.match(/\.where\("verificationStatus", "==", "verified"\)/g) || []).length >= 3, true);
});

test("correction screen is bidan-only and closes accepted requests", () => {
  assert.match(read("../src/app/(dashboard)/health-worker/verifications/[visitId]/correct/page.tsx"), /requirePageContext\(\["health_worker"\]\)/);
  assert.match(read("../src/app/api/visits/[visitId]/correct/route.ts"), /status: "corrected"/);
});

test("knowledge submissions only accept http(s) source links, and guides show approved material only", () => {
  assert.match(read("../src/app/api/knowledge/route.ts"), /protocol === "https:" \|\| u\.protocol === "http:"/);
  assert.match(read("../src/app/(dashboard)/cadre/guides/page.tsx"), /where\("status", "==", "approved"\)/);
});

test("guardian consent for AI summaries is enforced on generation and hidden when withdrawn", () => {
  assert.match(read("../src/lib/data/consent.ts"), /return latest\?\.consentStatus === "granted"/);
  assert.match(read("../src/lib/data/consent.ts"), /if \(!AI_SUMMARY_NOTICE_VERSION\) return false/);
  assert.match(read("../src/app/api/visits/[visitId]/verify/route.ts"), /isAiSummaryAllowed/);
  assert.match(read("../src/app/api/ai/summary/generate/route.ts"), /isAiSummaryAllowed/);
  assert.match(read("../src/app/(dashboard)/parent/children/[childId]/page.tsx"), /summary && summaryAllowed/);
  assert.match(read("../src/app/(dashboard)/parent/children/[childId]/privacy/page.tsx"), /requirePageContext\(\["parent"\]\)/);
});

test("cadre follow-up page is cadre-only and listed only in the cadre menu", () => {
  assert.match(read("../src/app/(dashboard)/cadre/followups/page.tsx"), /requirePageContext\(\["cadre"\]\)/);
  assert.match(read("../src/components/layout/DashboardNavigation.tsx"), /href: "\/cadre\/followups"[^\n]*roles: \["cadre"\]/);
});
