# UI Refresh — Acceptance Criteria

## Scope
Visual-only refresh for the existing Digital Posyandu application. Authentication, API contracts,
Firestore access, role checks, data models, forms, and workflow behavior are not changed.

## Acceptance criteria
- [ ] Dashboard uses a persistent desktop sidebar and compact mobile navigation.
- [ ] Current navigation item is exposed with `aria-current="page"`.
- [ ] Mobile navigation can be opened and closed using keyboard-operable buttons.
- [ ] Existing destinations remain unchanged: parent, cadre, children, administration, guides,
      health-worker verification, admin, reports, audit logs, and reviewer.
- [ ] Logout continues to submit `POST /api/auth/logout`.
- [ ] Dashboard layout still calls `requirePageSession()` before rendering protected content.
- [ ] Login still uses Firebase email/password authentication and `POST /api/auth/session`.
- [ ] Login keeps the same role-to-destination mapping and error/loading states.
- [ ] Tables remain horizontally scrollable on narrow screens.
- [ ] Reduced-motion preference disables non-essential transitions and smooth scrolling.
- [ ] Existing forms, charts, cards, badges, and page content remain present.

## Verification
Run from the repository root:

```bash
git apply --check Digital-Posyandu-UI-Refresh.patch
npm run typecheck
npm test
npm run build
```

Manual checks:
1. Open every existing role page at desktop width and verify sidebar active state.
2. Open the sidebar on a mobile viewport, follow a link, and close it with the backdrop.
3. Submit invalid and valid login credentials and verify the original error and redirect behavior.
4. Submit logout and verify the session is cleared by the existing logout route.
5. Check forms, tables, and Recharts charts at 360px, 768px, and desktop widths.
6. Enable `prefers-reduced-motion` and verify the interface remains usable.
