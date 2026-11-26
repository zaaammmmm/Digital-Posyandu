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
  assert.equal(forParent.length, 1, "parent should only see the parent portal");
});

test("firestore rules no longer grant system_admin health-data reads", () => {
  const rules = read("../firestore.rules");
  assert.match(rules, /function healthDataRoles\(\) \{ return \['cadre', 'health_worker', 'posyandu_admin'\]; \}/);
  assert.doesNotMatch(rules, /function staffRoles\(\) \{[^}]*system_admin/);
  assert.match(rules, /correction_requests[\s\S]*roleIn\(resource\.data\.posyanduId, \['health_worker'\]\)/);
});
