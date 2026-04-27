# ExamsValley Mobile — Remaining Work

Last updated: 2026-04-27

## ✅ Completed

| Phase | Items |
|---|---|
| Phase 0 | Parity audit (PARITY_AUDIT.md) |
| Phase 1 | Onboarding wizard, splash screen, OnboardingGate, Google OAuth, +not-found |
| Phase 2 | help, become-a-tutor, teacher portfolio `/t/[username]`, boards picker, multiview, IB DP groups |
| Phase 3 | Admin: board editor, subjects/topics CRUD, resource manager |
| Infra | JWT auth pipeline (Expo Router API route + upriser-web middleware), Tailscale fix, `.env` corrected, admin `_layout.tsx` updated |

---

## 🔴 Phase 4 — Teacher content creation (CRITICAL — teachers can't create anything)

- [ ] `app/(teacher)/materials/[id].tsx` — **currently read-only detail view**; needs full create/edit form:
  - Title, description, type picker (notes/video/past_paper/worksheet/ebook)
  - Board → Qualification → Subject → Topic cascade selectors
  - File upload via `expo-document-picker` (PDF) or `expo-image-picker`
  - Video URL field (when type = video)
  - Year, difficulty
  - POST /api/materials (create) / PATCH /api/materials/:id (edit)

- [ ] `app/(teacher)/quizzes/[id].tsx` — **currently read-only questions list**; needs full builder:
  - Quiz metadata edit (title, description, board, subject, topic, timed, duration)
  - Question list with add / edit / delete / reorder (up/down)
  - Per-question form: text, 4 options (A-D), correct answer radio, marks, explanation
  - POST /api/quizzes (create) / PATCH /api/quizzes/:id (edit)
  - POST /api/quizzes/:id/questions (add) / PATCH /api/questions/:id / DELETE /api/questions/:id

---

## 🟡 Phase 5 — UX completeness

- [ ] `components/FeedbackPopup.tsx` — global timed feedback prompt (shows after 2 min of use):
  - Uses existing `hooks/useFeedbackStore.ts` (already ported)
  - Wire into `app/_layout.tsx` (add `<FeedbackPopup delayMs={120000} />` after `<Toast />`)
  - POST /api/feedback

- [ ] `app/curriculum/ib/dp/[groupId].tsx` — IB per-group subject list:
  - Fetches subjects for the selected IB DP group
  - Links from `app/curriculum/ib/dp/index.tsx` group cards

- [ ] `app/t/[username].tsx` alias — add `app/teacher/[username].tsx` redirect to `/t/[username]`

- [ ] ThemeContext — system dark mode (`useColorScheme` from RN, no ThemeContext needed)

---

## 🟢 Phase 6 — Navigation & reusable components

- [ ] **Bottom tab navigation** for `(student)` and `(teacher)` groups:
  - Currently Stack-only; web has sidebar nav
  - Student tabs: Home, Subjects, Practice, Assignments, Profile
  - Teacher tabs: Dashboard, Materials, Quizzes, Assignments, Profile

- [ ] `components/ScreenHeader.tsx` — standardized back-button + title bar (reusable across screens)

---

## 🔵 Phase 7 — Polish & edge cases

- [ ] Handle upriser-web CORS for Tailscale IP (`100.72.195.67`) — add to `ALLOWED_ORIGINS` in upriser-web `.env`
- [ ] `expo.extra` / `app.config.js` — expose `EXPO_PUBLIC_*` at build time for EAS builds
- [ ] `app/api/auth/google/mobile+api.ts` — add rate limiting (5 req/min per IP)
- [ ] JWT refresh: implement token refresh before 30-day expiry (silent re-auth via stored Google token)

---

## Env vars still needed (add to .env + EAS Secrets)

```
DATABASE_URL=              # same as upriser-web
JWT_SECRET=                # node -e "require('crypto').randomBytes(64).toString('hex')"
GOOGLE_CLIENT_ID=          # web client ID
GOOGLE_IOS_CLIENT_ID=      # iOS client ID
GOOGLE_ANDROID_CLIENT_ID=  # Android client ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=
```

## upriser-web — still needed (one-time)

Add Tailscale IP to allowed CORS origins in `upriser-web/.env`:
```
ALLOWED_ORIGINS=http://localhost:19006,http://100.72.195.67:8081,...existing...
```
