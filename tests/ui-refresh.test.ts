import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("dashboard keeps server-side session protection and existing logout endpoint", () => {
  const layout = read("../src/app/(dashboard)/layout.tsx");
  const nav = read("../src/components/layout/DashboardNavigation.tsx");
  assert.match(layout, /requirePageSession\(\)/);
  assert.match(nav, /action="\/api\/auth\/logout"/);
});

test("navigation preserves the implemented application destinations", () => {
  const nav = read("../src/components/layout/DashboardNavigation.tsx");
  for (const href of [
    "/cadre", "/cadre/children", "/cadre/administration", "/cadre/guides",
    "/parent", "/health-worker", "/admin", "/admin/reports",
    "/admin/audit-logs", "/reviewer",
  ]) {
    assert.ok(nav.includes(`href: "${href}"`), `missing navigation destination ${href}`);
  }
  assert.match(nav, /aria-current=\{active \? "page" : undefined\}/);
});

test("login retains Firebase auth, session exchange, and role redirects", () => {
  const login = read("../src/app/(auth)/login/page.tsx");
  assert.match(login, /signInWithEmailAndPassword/);
  assert.match(login, /getIdToken\(true\)/);
  assert.match(login, /fetch\("\/api\/auth\/session"/);
  for (const path of ["/parent", "/cadre", "/health-worker", "/admin", "/reviewer"]) {
    assert.ok(login.includes(`"${path}"`), `missing login destination ${path}`);
  }
});

test("responsive and reduced-motion rules are present", () => {
  const css = read("../src/app/globals.css");
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.posyandu-table \{ min-width: 620px; \}/);
});
