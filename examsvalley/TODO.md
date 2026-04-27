# ExamsValley Mobile — Work Tracker

Last updated: 2026-04-27

## ✅ All phases complete

| Phase | Items | Status |
|---|---|---|
| 0 | Parity audit (PARITY_AUDIT.md) | ✅ |
| 1 | Onboarding wizard, splash screen, OnboardingGate, Google OAuth, +not-found | ✅ |
| 2 | help, become-a-tutor, teacher portfolio `/t/[username]`, boards picker, multiview, IB DP groups + per-group subjects | ✅ |
| 3 | Admin: board editor, subjects/topics CRUD, resource manager | ✅ |
| 4 | Teacher material editor (create + edit), quiz builder (full question CRUD) | ✅ |
| 5 | FeedbackPopup (wired in _layout), IB dp/[groupId] subjects page | ✅ |
| 6 | Bottom tabs (student + teacher), ScreenHeader component, `/teacher/[username]` alias | ✅ |
| 7 | Rate limiting (Google OAuth route), JWT auto-refresh (7-day window), CORS documented, Tailscale fixed, JWT_SECRET added to upriser-web .env | ✅ |

---

## Before first run — env vars to fill in

### examsvalley/.env

```env
EXPO_PUBLIC_API_URL=http://100.72.195.67:5000   # ← already set (Tailscale)
DATABASE_URL=<same as upriser-web>
JWT_SECRET=<run: node -e "require('crypto').randomBytes(64).toString('hex')">
GOOGLE_CLIENT_ID=<web client ID>
GOOGLE_IOS_CLIENT_ID=<iOS client ID>
GOOGLE_ANDROID_CLIENT_ID=<Android client ID>
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=<web client ID>
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=<iOS client ID>
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=<Android client ID>
```

### upriser-web/.env (additions)

```env
JWT_SECRET=<same value as above>
# CLIENT_URL is only needed in production; dev allows all origins automatically
```

---

## npm scripts

| Command | What it does |
|---|---|
| `npm run start:tailscale` | Expo dev server bound to Tailscale IP `100.72.195.67` — reach from any enrolled device |
| `npm run start:tunnel` | Expo dev server via ngrok public HTTPS tunnel (no Tailscale needed) |
| `npm run start` | Local-only (emulator / same machine) |

---

## Architecture summary

```
Expo mobile app
  └─ API calls  ─────────────────────────────► upriser-web Express :5000
                                                 (session cookie OR Bearer JWT)
  └─ POST /api/auth/google/mobile ──────────► Expo Router API route (examsvalley)
                                                 verifies Google ID token
                                                 finds/creates user in shared DB
                                                 returns { user, token }
  └─ POST /api/auth/refresh ─────────────────► Expo Router API route (examsvalley)
                                                 silently renews JWT before expiry
```
