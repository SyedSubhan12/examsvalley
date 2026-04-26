# Mobile ↔ Web Parity Audit & Implementation Plan

**Mobile:** `/home/syeds/examsvalley` (Expo + expo-router + NativeWind, RN 0.76 / Expo 52)
**Web:** `/home/syeds/upriser-web` (React 18 + Vite + wouter + shadcn-ui)
**Backend (shared):** `upriser-web/server/` + `upriser-web/api/` + Drizzle/Postgres + Supabase storage. **The mobile app consumes this backend; server-side parity is not in scope.**

Audit date: 2026-04-26
Methodology: Forensic, file-by-file comparison of `client/src/` (web) against `app/`, `components/`, `context/`, `hooks/`, `lib/`, `types/` (mobile). Every gap below maps to a specific file/route observed (or its absence). Web-only concerns (SEO, responsive media queries, mouse-hover affordances) are flagged `N/A` with the mobile-equivalent substitute.

---

## 1. Executive summary

| Layer | Web items | Mobile items | Gap items | Coverage |
|---|---|---|---|---|
| **Routes/screens** | 60 routes (App.tsx) | 47 screens | **11 missing**, 2 partial | ~78% |
| **Reusable components** | 70+ (incl. shadcn) | 2 (`ProtectedRoute`, `RegistrationGate`) | **~25 functional gaps** (excluding shadcn primitives, which are N/A) | ~10% reusable extraction |
| **Hooks** | 5 | 3 (`useFeedbackStore`, `useFileDownload`, `useSecureSession`) | **2 functional gaps** (image upload, toast wrapper) | 60% |
| **Contexts** | 2 (`Auth`, `Theme`) | 1 (`Auth`) | **1 missing** (`ThemeContext`) | 50% |
| **Shared lib / utils** | 4 (`shared/*`) + 3 (`client/src/lib/*`) | 6 in `lib/` + `types/index.ts` | curriculum-schema not split out, otherwise complete | ~95% |
| **Auth flows** | Email/password + Google OAuth | Email/password only (Google placeholder) | **Google OAuth not wired** | 50% of providers |
| **Global UX** | Onboarding wizard, splash video, feedback popup, theme toggle, NotFound | Toast only | **5 missing** | ~20% |
| **Navigation** | wouter `<Switch>` w/ layouts; web sidebar/navbar | expo-router stacks; **no bottom tabs** | Bottom-tab UX missing | structural |

**Top 5 blockers for production parity (in order):**
1. Onboarding flow (`OnboardingGate` + `OnboardingWizard` + `SubjectMultiSelect` + splash video) — controls the entire first-run experience
2. Google OAuth login (currently stubbed with a Toast)
3. Missing admin screens: `BoardEditorPage`, `SubjectsTopicsPage`, `AdminResourceManagerPage`
4. Missing public screens: `BecomeTutorPage`, `TeacherPortfolioPage` (`/t/:username` deep link), `HelpPage`, `MultiViewPage`, `BoardSelectionPage`, `+not-found`
5. No `ThemeContext` / dark-mode parity; no global `FeedbackPopup` (post-2-min user feedback prompt)

---

## 2. Route / screen parity matrix

Legend: ✅ = present and converted • ⚠️ = partial / merged / behavior diverges • ❌ = missing • N/A = web-only by design

### 2.1 Public / curriculum

| Web route | Web file | Mobile file | Status | Notes |
|---|---|---|---|---|
| `/` , `/home` | `pages/curriculum/HomePage.tsx` | `app/index.tsx` | ✅ | Mobile drops `FloatingLines`/`CurvedLoop` animations + dark-mode toggle (per file header). Hero + board tiles ported. |
| `/curriculum` | `pages/curriculum/BoardsListPage.tsx` | `app/curriculum/index.tsx` | ✅ | |
| `/curriculum/:boardKey` | `pages/curriculum/BoardDetailPage.tsx` | `app/curriculum/[boardKey]/index.tsx` | ✅ | |
| `/curriculum/:boardKey/:qualKey/branch` | `BranchSelectorPage.tsx` | `[boardKey]/[qualKey]/branch.tsx` | ✅ | |
| `/curriculum/:boardKey/:qualKey/subjects` | `SubjectListPage.tsx` | `[boardKey]/[qualKey]/subjects.tsx` | ✅ | |
| `/curriculum/:boardKey/:qualKey/:branchKey/subjects` | `SubjectListPage.tsx` | `[boardKey]/[qualKey]/[branchKey]/subjects.tsx` | ✅ | |
| `/curriculum/ib/dp/groups` | `IBSubjectGroupPage.tsx` | `curriculum/ib/dp/groups.tsx` | ✅ | |
| `/curriculum/ib/:programId/:groupId` | `SubjectListPage.tsx` (reused) | — | ❌ | **MISSING** — IB-specific subject list (programId + groupId) deep link not routable. |
| `/subjects` | `pages/subjects/SubjectsSearchPage.tsx` (`GlobalSubjectsPage`) | `app/subjects/index.tsx` | ✅ | |
| `/subject/:subjectId` | `pages/subject/SubjectResourceHub.tsx` | `subject/[subjectId]/index.tsx` | ✅ | |
| `/subject/:subjectId/resource/:resourceKey` | `pages/subject/ResourceListPage.tsx` | `subject/[subjectId]/resource/[resourceKey]/index.tsx` | ✅ | |
| `/subject/:subjectId/files` | `pages/subject/FileBrowserPage.tsx` | `subject/[subjectId]/files.tsx` | ✅ | |
| `/view/file/:fileId` | `pages/files/PDFViewerPage.tsx` | `view/file/[fileId].tsx` | ✅ | |
| `/view/multiview/:fileId1/:fileId2` | `pages/files/MultiViewPage.tsx` | — | ❌ | **MISSING** — side-by-side viewer (e.g., QP + MS). |
| `/help` | `pages/help/HelpPage.tsx` | — | ❌ | **MISSING** — help/FAQ screen. |
| `/become-a-tutor` | `pages/public/BecomeTutorPage.tsx` | — | ❌ | **MISSING** — tutor-recruitment landing. |
| `/t/:username` | `pages/public/TeacherPortfolioPage.tsx` | — | ❌ | **MISSING** — public teacher portfolio deep link. Critical for sharing teacher pages. |
| `/teacher/:username` (catch-all after admin/teacher routes) | `TeacherPortfolioPage.tsx` (alias) | — | ❌ | **MISSING** — same as above; second alias route. |
| `/boards` | `pages/public/BoardSelectionPage.tsx` | — | ❌ | **MISSING** — legacy board picker (kept for back-compat on web). |
| `*` (NotFound) | `pages/not-found.tsx` | — | ❌ | **MISSING** — Expo's `app/+not-found.tsx` not present. |

### 2.2 Auth

| Web route | Web file | Mobile file | Status | Notes |
|---|---|---|---|---|
| `/login` | `pages/public/LoginPage.tsx` | `app/(auth)/login.tsx` | ⚠️ | Email/password ✅. **Google OAuth replaced with a Toast placeholder** (per file header). |
| `/register` | `pages/public/RegisterPage.tsx` | `app/(auth)/register.tsx` | ✅ | Verify Google OAuth path — likely same gap. |
| `/verify-teacher-email` | `TeacherEmailVerificationPage.tsx` | `app/(auth)/verify-teacher-email.tsx` | ✅ | |

### 2.3 Student

| Web route | Web file | Mobile file | Status |
|---|---|---|---|
| `/student/registration` | `StudentRegistrationPage.tsx` | `(student)/registration.tsx` | ✅ |
| `/student/dashboard` | `StudentDashboardPage.tsx` | `(student)/dashboard.tsx` | ✅ |
| `/student/materials` | `StudyMaterialsPage.tsx` | `(student)/materials/index.tsx` | ✅ |
| `/student/materials/:id` | `MaterialDetailPage.tsx` | `(student)/materials/[id].tsx` | ✅ |
| `/student/practice` | `QuizPracticePage.tsx` | `(student)/practice/index.tsx` | ✅ |
| `/student/practice/quiz/:quizId` | `QuizAttemptPage.tsx` | `(student)/practice/quiz/[quizId].tsx` | ✅ |
| `/student/practice/history` | `QuizHistoryPage.tsx` | `(student)/practice/history.tsx` | ✅ |
| `/student/assignments` | `AssignmentsPage.tsx` | `(student)/assignments/index.tsx` | ✅ |
| `/student/assignments/:id` | `AssignmentDetailPage.tsx` | `(student)/assignments/[id].tsx` | ✅ |
| `/student/announcements` | `AnnouncementsPage.tsx` | `(student)/announcements.tsx` | ✅ |
| `/student/profile` | `ProfilePage.tsx` | `(student)/profile.tsx` | ✅ |
| `/student/mcq/practice` | `mcq/McqPracticePage.tsx` | `(student)/mcq/practice.tsx` | ✅ |
| `/student/mcq/session/:id` | `mcq/McqSessionPage.tsx` | `(student)/mcq/session/[id].tsx` | ✅ |
| `/student/mcq/stats` | `mcq/McqStatsPage.tsx` | `(student)/mcq/stats.tsx` | ✅ |

**Student section: 14/14 routes covered.** ✅

### 2.4 Teacher

| Web route | Web file | Mobile file | Status | Notes |
|---|---|---|---|---|
| `/teacher/dashboard` | `TeacherDashboardPage.tsx` | `(teacher)/dashboard.tsx` | ✅ | |
| `/teacher/registration` | `TutorRegistrationPage.tsx` | `(teacher)/registration.tsx` | ✅ | |
| `/teacher/materials` | `MyMaterialsPage.tsx` | `(teacher)/materials/index.tsx` | ✅ | |
| `/teacher/materials/new` | `MaterialEditorPage.tsx` (new) | — (collapsed into `[id]`) | ⚠️ | Mobile must treat `id === 'new'` as create-mode; verify the screen handles this branch. If it doesn't, this is a **logic gap**. |
| `/teacher/materials/:id` | `MaterialEditorPage.tsx` (edit) | `(teacher)/materials/[id].tsx` | ✅ | |
| `/teacher/resources` | `TeacherResourcesPage.tsx` | `(teacher)/resources.tsx` | ✅ | |
| `/teacher/quizzes` | `QuizListPage.tsx` | `(teacher)/quizzes/index.tsx` | ✅ | |
| `/teacher/quizzes/new` | `QuizBuilderPage.tsx` (new) | — (collapsed) | ⚠️ | Same `id === 'new'` concern. |
| `/teacher/quizzes/:id` | `QuizBuilderPage.tsx` (edit) | `(teacher)/quizzes/[id].tsx` | ⚠️ | File header says it merges `QuizBuilderPage + QuizResultsPage`. Read shows it's actually a read-only **detail** view (questions list), not the full builder. **Likely a logic gap: question CRUD UI missing.** |
| `/teacher/quizzes/:quizId/results` | `QuizResultsPage.tsx` | (claimed merged into `[id].tsx`) | ⚠️ | Verify results sub-tab actually rendered; per inspection only quiz + questions queries are present. |
| `/teacher/assignments` | `AssignmentsManagePage.tsx` | `(teacher)/assignments/index.tsx` | ✅ | |
| `/teacher/assignments/:assignmentId/submissions` | `AssignmentSubmissionsPage.tsx` | `(teacher)/assignments/[id].tsx` | ✅ | Path semantics differ; param name aligned. |
| `/teacher/announcements` | `TeacherAnnouncementsPage.tsx` | `(teacher)/announcements.tsx` | ✅ | |
| `/teacher/mcq-manager` | `McqManagerPage.tsx` | `(teacher)/mcq-manager.tsx` | ✅ | |
| (none on web) | — | `(teacher)/profile.tsx` | ➕ | Mobile-only logged-in teacher profile screen. Confirm this is intended (web teachers use `/student/profile`?). |

**Teacher section: 11 fully covered, 4 ⚠️ (`/new` create-mode, full quiz builder editing, quiz results).**

### 2.5 Admin

| Web route | Web file | Mobile file | Status | Notes |
|---|---|---|---|---|
| `/admin/dashboard` | `AdminDashboardPage.tsx` | `(admin)/dashboard.tsx` | ✅ | |
| `/admin/boards` | `BoardsPage.tsx` | `(admin)/boards/index.tsx` | ✅ | |
| `/admin/boards/new`, `/admin/boards/:id` | `BoardEditorPage.tsx` | — | ❌ | **MISSING** — board create/edit. No `(admin)/boards/[id].tsx`. |
| `/admin/subjects` | `SubjectsTopicsPage.tsx` | — | ❌ | **MISSING** — subjects/topics CRUD. |
| `/admin/users` | `UsersPage.tsx` | `(admin)/users/index.tsx` | ✅ | |
| `/admin/users/:id` | `UserDetailPage.tsx` | `(admin)/users/[id].tsx` | ✅ | |
| `/admin/teachers` | `TeacherApprovalPage.tsx` | `(admin)/teachers/index.tsx` | ✅ | |
| `/admin/teachers/:id` | `TeacherDetailPage.tsx` | `(admin)/teachers/[id].tsx` | ✅ | |
| `/admin/moderation` | `ContentModerationPage.tsx` | `(admin)/moderation.tsx` | ✅ | |
| `/admin/analytics` | `AnalyticsPage.tsx` | `(admin)/analytics.tsx` | ✅ | |
| `/admin/settings` | `SystemSettingsPage.tsx` | `(admin)/settings.tsx` | ✅ | |
| `/admin/feedback` | `FeedbackPage.tsx` | `(admin)/feedback.tsx` | ✅ | |
| `/admin/resources` | `AdminResourceManagerPage.tsx` | — | ❌ | **MISSING** — global resource manager (uses `UppyFolderUploader`). |

**Admin section: 10/13 routes covered. 3 missing.**

---

## 3. Component / module gap matrix

Mobile contains only `ProtectedRoute.tsx` and `RegistrationGate.tsx` as reusable components. Web has 70+ components. Excluding the shadcn-ui primitive set (`button`, `card`, `dialog`, etc. — all `N/A` on mobile because NativeWind + RN primitives replace them), the missing **functional/composite** components are:

### 3.1 Onboarding (entire flow missing) — UI + Logic + State

| Web component | Web file | Mobile equivalent | Status |
|---|---|---|---|
| `OnboardingGate` | `components/onboarding/OnboardingGate.tsx` | — | ❌ Wraps app; gates first-run UX |
| `OnboardingWizard` | `components/onboarding/OnboardingWizard.tsx` | — | ❌ Multi-step subject/board picker |
| `SplashScreen` | `components/onboarding/SplashScreen.tsx` | — | ❌ Pre-onboarding splash (use `expo-splash-screen` + `expo-av` for video) |
| `SplashVideoScreen` | `components/onboarding/SplashVideoScreen.tsx` | — | ❌ Splash video (mobile/desktop variants in `client/public/splash-{mobile,desktop}.mp4`) |
| `SubjectMultiSelect` | `components/onboarding/SubjectMultiSelect.tsx` | — | ❌ Used inside the wizard |
| `FeedbackPopup` | `components/FeedbackPopup.tsx` (mounted in `App.tsx` w/ `delayMinutes={2}`) | — | ❌ Global timed feedback prompt; pairs with `useFeedbackStore` ✅ (hook is ported) |

> **Note:** `useFeedbackStore` is already ported (`hooks/useFeedbackStore.ts`) but has no consumer on mobile.

### 3.2 Curriculum / file-browsing reusables

| Web component | Web file | Status | Mobile note |
|---|---|---|---|
| `BoardTile` | `components/curriculum/BoardTile.tsx` | ❌ | Inlined into `app/index.tsx`; should be extracted for reuse on `curriculum/index.tsx` |
| `BranchSelector` | `components/curriculum/BranchSelector.tsx` | ❌ | Inlined into `branch.tsx` |
| `FeatureBoardSection` | `components/curriculum/FeatureBoardSection.tsx` | ❌ | |
| `FeaturesSection` | `components/curriculum/FeaturesSection.tsx` | ❌ | Likely landing-page only |
| `QualificationCard` | `components/curriculum/QualificationCard.tsx` | ❌ | |
| `SubjectRow` | `components/curriculum/SubjectRow.tsx` | ❌ | |
| `Breadcrumbs` | `components/files/Breadcrumbs.tsx` | ❌ | Mobile breadcrumb UI absent — verify in `subject/[subjectId]/files.tsx` |
| `FileRow` | `components/files/FileRow.tsx` | ❌ | |
| `FolderRow` | `components/files/FolderRow.tsx` | ❌ | |
| `FileTypeFilterBar` | `components/files/FileTypeFilterBar.tsx` | ❌ | Per-file-type filter chips (QP/MS/SP/ER/GT/syllabus). Mobile inlines a simpler version. |
| `MultiViewResourceBrowser` | `components/resources/MultiViewResourceBrowser.tsx` | ❌ | Companion to missing `MultiViewPage` |
| `ResourceCard` | `components/resource/ResourceCard.tsx` | ❌ | |
| `SearchBar` | `components/common/SearchBar.tsx` | ❌ | Inlined per-screen on mobile |
| `FilterChips` | `components/common/FilterChips.tsx` | ❌ | |

### 3.3 Layout / navigation chrome

| Web component | Web file | Status | Mobile note |
|---|---|---|---|
| `AppNavbar` | `components/layout/AppNavbar.tsx` | ❌ | Each role's `_layout.tsx` uses a stack; no top-bar component |
| `Footer` | `components/layout/Footer.tsx` | N/A | Mobile UX has no footer |
| `PageHeader` | `components/layout/PageHeader.tsx` | ❌ | Used widely on web |
| `RoleSwitcher` | `components/layout/RoleSwitcher.tsx` | ❌ | Multi-role users can't switch role on mobile |
| `AnimatedNavbar` | `components/navigation/AnimatedNavbar.tsx` | N/A on screen-by-screen basis | But: **no bottom-tab navigation exists on mobile** — see §6 |
| `ScreenHeader` | `components/navigation/ScreenHeader.tsx` | ❌ | Standardized header missing |
| `StudentLayout` | `layouts/StudentLayout.tsx` | partial | `(student)/_layout.tsx` exists but is just a Stack; sidebar/nav not ported |
| `TeacherLayout` | `layouts/TeacherLayout.tsx` | partial | as above |
| `AdminLayout` | `layouts/AdminLayout.tsx` | partial | as above |
| `CurriculumLayout` | `layouts/CurriculumLayout.tsx` | ❌ | No curriculum-section layout on mobile |
| `PublicLayout` | `layouts/PublicLayout.tsx` | ❌ | No public-section layout |

### 3.4 Other

| Web component | Web file | Status | Mobile note |
|---|---|---|---|
| `StudentRegistrationModal` | `components/StudentRegistrationModal.tsx` | ❌ | Mobile uses dedicated screen `(student)/registration.tsx` instead of a modal — acceptable parity divergence; flag intentional |
| `TutorRegistrationModal` | `components/TutorRegistrationModal.tsx` | ❌ | Same |
| `UppyFolderUploader` | `components/admin/UppyFolderUploader.tsx` | ❌ (Logic) | Used by `AdminResourceManagerPage`; needs mobile equivalent built on `expo-document-picker` + chunked upload to Supabase. **Heavy lift — Uppy is browser-only.** |
| `ProtectedRoute` | `components/ProtectedRoute.tsx` | ✅ | |
| `RegistrationGate` | `components/RegistrationGate.tsx` | ✅ | |
| Animation/decor (`StaggeredMenu`, `CurvedLoop`, `FloatingLines`, `Folder/Folder.jsx`) | various | N/A | Web-only WebGL/GSAP. Mobile substitute: Reanimated equivalents (or skip). |

---

## 4. Hooks, contexts, libs, types

### 4.1 Hooks

| Web | File | Mobile | Status |
|---|---|---|---|
| `useFeedbackStore` | `hooks/useFeedbackStore.ts` | `hooks/useFeedbackStore.ts` | ✅ identical (Bucket A_reuse) |
| `use-image-upload` | `hooks/use-image-upload.tsx` | — | ❌ **Logic gap** — needed by avatar/profile flows. Replace with `expo-image-picker` wrapper. |
| `use-toast` | `hooks/use-toast.ts` | — | ⚠️ Mobile already uses `react-native-toast-message` directly (see `_layout.tsx`); no hook abstraction. Optional. |
| `use-mobile` | `hooks/use-mobile.tsx` | — | N/A — replace usages with `Dimensions` / `useWindowDimensions` / `Platform` on a per-call basis |
| `use-media-query` | `hooks/use-media-query.ts` | — | N/A — same |
| (mobile-only) | — | `useFileDownload.ts` | ➕ wraps `expo-file-system` + `expo-sharing` (Bucket D_replace) |
| (mobile-only) | — | `useSecureSession.ts` | ➕ replaces `localStorage` for session (Bucket D_replace) |

### 4.2 Contexts

| Web | Mobile | Status |
|---|---|---|
| `AuthContext` (201 LoC) | `AuthContext` (211 LoC) | ✅ Ported, `localStorage` → `expo-secure-store`, fetch URLs prefixed with `EXPO_PUBLIC_API_URL` |
| `ThemeContext` | — | ❌ **Missing** — no dark-mode / theme toggle on mobile |

### 4.3 lib / shared

| Web | Mobile | Status |
|---|---|---|
| `client/src/lib/queryClient.ts` | `lib/queryClient.ts` | ✅ |
| `client/src/lib/utils.ts` (`cn`) | `lib/utils.ts` | ✅ |
| `client/src/lib/curriculumData.ts` | `lib/curriculumData.ts` | ✅ |
| `client/src/api/admin.ts` | `lib/api/admin.ts` | ✅ |
| `shared/caie-utils.ts` (112 LoC) | `lib/caie-utils.ts` | ✅ |
| `shared/email-validation.ts` (102 LoC) | `lib/email-validation.ts` | ✅ |
| `shared/curriculum-schema.ts` (259 LoC) | — | ⚠️ Not present as standalone file. Likely folded into `lib/curriculumData.ts` and/or `types/index.ts`. **Verify**: any zod validators or board/qualification key constants from `curriculum-schema.ts` are in scope. |
| `shared/schema.ts` (806 LoC, drizzle + drizzle-zod) | `types/index.ts` (777 LoC, pure zod) | ✅ Ported, drizzle stripped (Bucket A_reuse) |

### 4.4 Auth flow specifics

| Capability | Web | Mobile | Status |
|---|---|---|---|
| Email/password login | passport-local | `AuthContext.login()` → `/api/auth/login` | ✅ |
| Google OAuth | passport-google-oauth20 (server) + button on `LoginPage` | `expo-auth-session` installed; **login button shows Toast placeholder** per `(auth)/login.tsx` header | ❌ **Not wired** |
| Email verification (teacher) | `TeacherEmailVerificationPage` | `(auth)/verify-teacher-email.tsx` | ✅ |
| Session persistence | server-side via `express-session` + cookies | `expo-secure-store` + `credentials: "include"` cookies | ✅ — but verify the RN `fetch` cookie jar works on Android (typically requires `react-native-cookies` for full parity with web's session cookie behavior). |
| `ProtectedRoute` | ✅ | ✅ | |
| `RegistrationGate` | ✅ | ✅ | |
| `OnboardingGate` (forces onboarding before app loads) | ✅ wired in `App.tsx` | ❌ not wired in `_layout.tsx` | **Missing** |

> **Critical:** Native fetch on Android does *not* persist session cookies the same way as web. Verify with one round-trip: login → restart app → call `/api/auth/me`. If it 401s, install `@react-native-cookies/cookies` and configure or move to bearer-token auth.

---

## 5. Global UX / providers (`_layout.tsx` vs `App.tsx`)

| Provider / global mount | Web (`App.tsx`) | Mobile (`_layout.tsx`) | Status |
|---|---|---|---|
| `QueryClientProvider` | ✅ | ✅ | |
| `AuthProvider` | ✅ | ✅ | |
| `ThemeProvider` | ✅ | ❌ | **Missing** |
| `TooltipProvider` (shadcn) | ✅ | N/A (RN has no hover tooltips) | |
| Global `Toaster` | ✅ | ✅ (`react-native-toast-message`) | |
| `FeedbackPopup delayMinutes={2}` | ✅ mounted globally | ❌ | **Missing** — high-visibility global feature |
| `OnboardingGate` | ✅ wraps router | ❌ | **Missing** |
| `RegistrationGate` | ✅ wraps router (inside OnboardingGate) | not yet wired in `_layout.tsx` (component exists in `components/`) | ⚠️ verify it's actually rendered |
| `SafeAreaProvider` + `GestureHandlerRootView` | N/A | ✅ | mobile-only essentials |

---

## 6. Mobile-specific concerns (no web equivalent — but required)

These are not gaps relative to web but are missing for a production mobile app:

1. **No bottom-tab navigation.** Each role (`student`, `teacher`, `admin`) uses a flat `Stack` in `_layout.tsx`. Mobile UX standard is bottom tabs for top-level sections (e.g., student: Dashboard / Materials / Practice / Assignments / Profile). Add `expo-router` Tabs layouts.
2. **No `app/+not-found.tsx`.** Unmatched URLs crash silently.
3. **Push notifications.** No `expo-notifications` setup; web uses in-app `FeedbackPopup` and email. Decide: do announcements / new assignments push?
4. **Deep linking config.** `app.json` linking scheme — verify `/t/:username`, `/view/file/:fileId`, etc. are handled when those screens are added.
5. **App icons / splash.** `app.json` not inspected for production icon/splash assets.
6. **Offline strategy.** Web is online-only; for mobile, decide whether downloaded files (via `useFileDownload`) need a local index for offline reading.
7. **Permissions UX.** `expo-document-picker`, `expo-image-picker`, `expo-file-system`, `expo-sharing` all need permission rationale strings in `app.json` (`infoPlist` for iOS, Android `permissions`).
8. **EAS Build / submit.** No `eas.json` visible — required for App Store / Play Store releases.
9. **Per-fetch boilerplate.** Most mobile screens call `fetch()` directly (e.g., `app/index.tsx` reads `EXPO_PUBLIC_API_URL` and constructs URLs inline). Web's `queryClient.ts` defines a global `defaultQueryFn`. Recommend adopting the same pattern on mobile to drop the per-screen `BASE` constant and the inline `fetch` blocks (~40 LoC saved per screen, single auth/error spot).

---

## 7. Prioritized implementation plan

Tasks are sized in **engineer-days** (1 day = 1 focused dev). Each task lists exact files and a clear acceptance criterion. Phases gate on each other.

### Phase 0 — Pre-flight (½ day)

| # | Task | Files | AC |
|---|---|---|---|
| 0.1 | Verify cookie/session persistence on Android via real device. | `context/AuthContext.tsx` | Login → kill app → reopen → `/api/auth/me` returns 200. If not, add `@react-native-cookies/cookies` *or* switch to bearer-token returned by `/api/auth/login`. |
| 0.2 | Adopt global `defaultQueryFn` in `lib/queryClient.ts` mirroring web. | `lib/queryClient.ts`, all screens that currently hand-roll `fetch` | New screens use just `useQuery({ queryKey: [...] })`. Existing screens migrated opportunistically. |
| 0.3 | Confirm `MaterialEditor`/`QuizBuilder` `[id]` screens treat `id === 'new'` as create-mode (currently ⚠️). | `app/(teacher)/materials/[id].tsx`, `app/(teacher)/quizzes/[id].tsx` | Navigating to `materials/new` or `quizzes/new` opens an empty editor that POSTs on save. |

### Phase 1 — Auth & first-run blockers (3 days)

| # | Task | Files | AC |
|---|---|---|---|
| 1.1 | Implement Google OAuth on mobile via `expo-auth-session`. | `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `context/AuthContext.tsx` | "Continue with Google" button completes full OAuth round-trip and lands on `/auth/me`-recognized session. Replaces the Toast placeholder. |
| 1.2 | Build `OnboardingGate` for mobile. | NEW: `components/OnboardingGate.tsx` | If `user.boardIds`/`subjectIds` is empty, redirect to onboarding wizard before rendering children. Wire in `_layout.tsx`. |
| 1.3 | Build `OnboardingWizard` (mobile screen, not modal). | NEW: `app/onboarding/index.tsx`, NEW: `components/onboarding/SubjectMultiSelect.tsx` | Multi-step flow (Welcome → Pick Boards → Pick Subjects → Confirm) writes via existing `/api/auth/me` PATCH or onboarding endpoint. Matches web steps 1:1. |
| 1.4 | Splash + intro video. | `app.json` (splash assets), NEW: `app/splash.tsx` using `expo-av` and `client/public/splash-mobile.mp4` (copied to mobile assets) | Cold start shows splash; first-run plays intro video (skippable). |
| 1.5 | Add `app/+not-found.tsx`. | NEW | Unmatched routes show a friendly screen with "Go home" button. |

### Phase 2 — Missing public/curriculum screens (3 days)

| # | Task | Files | AC |
|---|---|---|---|
| 2.1 | Port `HelpPage`. | NEW: `app/help.tsx` (port `pages/help/HelpPage.tsx`) | Static FAQ renders; same content as web. |
| 2.2 | Port `BecomeTutorPage`. | NEW: `app/become-a-tutor.tsx` | Landing renders; CTA navigates to `/(auth)/register?role=teacher` or equivalent. |
| 2.3 | Port `TeacherPortfolioPage` (deep link). | NEW: `app/t/[username].tsx` (and optionally `app/teacher/[username].tsx` alias if catch-all behavior needed; expo-router prefers a single route) | Navigating to `examsvalley://t/yasir` or equivalent deep link renders the portfolio. Configure `expo-linking` scheme in `app.json`. |
| 2.4 | Port `BoardSelectionPage` (legacy `/boards`). | NEW: `app/boards.tsx` | Optional — only needed if web still routes here. Else mark deprecated. |
| 2.5 | Port `MultiViewPage` (side-by-side QP+MS). | NEW: `app/view/multiview/[fileId1]/[fileId2].tsx`, `components/resources/MultiViewResourceBrowser.tsx` (mobile port) | Two `react-native-pdf` panes (or one above the other on phones, side-by-side on tablets via `useWindowDimensions`). |
| 2.6 | Port IB nested `:programId/:groupId`. | NEW: `app/curriculum/ib/[programId]/[groupId].tsx` | Reuses subject-list logic with IB-specific filter. |

### Phase 3 — Missing admin screens (2.5 days)

| # | Task | Files | AC |
|---|---|---|---|
| 3.1 | `BoardEditorPage` (create/edit board). | NEW: `app/(admin)/boards/[id].tsx` (handles `id === 'new'`) | Form for displayName, key, logo (image picker via `expo-image-picker` + signed-URL upload to Supabase). |
| 3.2 | `SubjectsTopicsPage`. | NEW: `app/(admin)/subjects.tsx` | Subjects + topics CRUD parity with web. |
| 3.3 | `AdminResourceManagerPage`. | NEW: `app/(admin)/resources.tsx` + mobile uploader | Replace `UppyFolderUploader` with `expo-document-picker` (multi-file) + sequential upload to Supabase using existing endpoints. Folder-level upload likely deferred (RN can't pick a folder); document the limitation. |

### Phase 4 — Quiz/material editor parity (2 days)

| # | Task | Files | AC |
|---|---|---|---|
| 4.1 | Full quiz **builder** UX on `(teacher)/quizzes/[id].tsx` (currently read-only detail). | `app/(teacher)/quizzes/[id].tsx`, possibly split into `quizzes/[id]/edit.tsx` | Add/edit/delete questions; reorder; save. Match `QuizBuilderPage.tsx`. |
| 4.2 | Quiz results screen. | NEW: `app/(teacher)/quizzes/[id]/results.tsx` (or tab inside `[id].tsx`) | Submission stats per student, per question. Match `QuizResultsPage.tsx`. |
| 4.3 | Material editor `'new'` mode. | `app/(teacher)/materials/[id].tsx` | Verify or implement create flow. |

### Phase 5 — Reusable components & layout chrome (3 days)

| # | Task | Files | AC |
|---|---|---|---|
| 5.1 | Extract shared mobile components. | NEW: `components/curriculum/{BoardTile,QualificationCard,SubjectRow,BranchSelector}.tsx`, `components/files/{Breadcrumbs,FileRow,FolderRow,FileTypeFilterBar}.tsx`, `components/common/{SearchBar,FilterChips}.tsx`, `components/resource/ResourceCard.tsx` | Existing inlined screens refactored to use these. No behavior change; ~30% LoC reduction in screens. |
| 5.2 | `ScreenHeader` + `PageHeader`. | NEW: `components/navigation/ScreenHeader.tsx` | Standard header w/ back, title, right-side action slot. Adopted on every screen. |
| 5.3 | Bottom-tab navigation per role. | `app/(student)/_layout.tsx`, `app/(teacher)/_layout.tsx`, `app/(admin)/_layout.tsx` — convert to `Tabs` | Each role lands on a tab bar (Dashboard / Materials / Practice / etc.). Stack-only flows nest below. |
| 5.4 | `RoleSwitcher` (multi-role users). | NEW: `components/layout/RoleSwitcher.tsx` | Header dropdown; only renders if user has >1 role. |

### Phase 6 — Theme, feedback, polish (2 days)

| # | Task | Files | AC |
|---|---|---|---|
| 6.1 | Port `ThemeContext`. | NEW: `context/ThemeContext.tsx`, update `_layout.tsx`, NativeWind dark variant config | Light/dark toggle persisted in `expo-secure-store` (or `AsyncStorage`); `dark:` Tailwind classes switch. |
| 6.2 | Global `FeedbackPopup`. | NEW: `components/FeedbackPopup.tsx`, mounted in `_layout.tsx` with `delayMinutes={2}` | After 2 min of session time, modal asks for feedback; uses `useFeedbackStore` (already ported). Posts to existing feedback endpoint. |
| 6.3 | `use-image-upload` mobile equivalent. | NEW: `hooks/useImageUpload.ts` | Wraps `expo-image-picker` + signed-URL upload; returns `{ pick, upload, previewUri, isUploading }`. Used by avatar UI in profile screens. |
| 6.4 | Shared `curriculum-schema` audit. | Verify `lib/curriculumData.ts` + `types/index.ts` cover all exports of `shared/curriculum-schema.ts`; if not, port the missing constants/zod schemas. | `grep` of web codebase for `from "@shared/curriculum-schema"` shows every imported symbol is reachable on mobile. |

### Phase 7 — Mobile-only essentials (2 days)

| # | Task | Files | AC |
|---|---|---|---|
| 7.1 | `eas.json` + production icons/splash + permissions strings. | `eas.json` (NEW), `app.json` | `eas build --profile production -p ios|android` succeeds. |
| 7.2 | Deep-linking config. | `app.json` (`scheme`, `linking`) | Tapping `examsvalley://t/yasir` from outside app opens the portfolio screen; cold-start works. |
| 7.3 | Push notifications baseline (optional, gate on product). | `expo-notifications`, server token registration endpoint (already on web side?) | Device registers; test push delivers. |
| 7.4 | Permissions rationale + privacy manifest (iOS). | `app.json` `infoPlist` | TestFlight build passes review for camera/photo/document access. |

### Estimated total: ~18 engineer-days for full parity.

> Phases 0–2 (~6.5 days) take the app from "feature-incomplete" to "first-run usable for new and existing users." Phases 3–4 (~4.5 days) close admin/teacher feature gaps. Phases 5–7 (~7 days) are quality, structure, and store-readiness.

---

## 8. Out of scope (do **not** implement)

- shadcn-ui primitives (`button`, `dialog`, `popover`, `command`, `sheet`, `drawer`, `accordion`, `select`, `tabs`, `toast`, `tooltip`, `sidebar`, `navigation-menu`, …) — N/A; mobile uses RN primitives + NativeWind classes directly. Replicating the abstraction layer adds cost without value.
- `Footer` — N/A on mobile.
- Web hover/tooltip affordances — N/A; redesign as long-press if needed.
- `use-mobile`, `use-media-query` — replace with `useWindowDimensions` / `Platform` per-call.
- WebGL/GSAP decorative animations (`StaggeredMenu`, `CurvedLoop`, `FloatingLines`, `Folder.jsx`) — N/A; if motion is desired, use `react-native-reanimated` selectively.
- Web-only SEO, sitemap, OG tags — N/A on native.
- Server-side code (`server/`, `api/`, migrations, drizzle config) — out of scope; mobile consumes existing backend.

---

## 9. Verification checklist (post-implementation)

Run after each phase before merging:

- [ ] All routes from §2 render without crash on Android + iOS simulator
- [ ] `/api/auth/me` returns user after cold start (cookie persistence)
- [ ] Onboarding triggers for a fresh account, not for an existing one
- [ ] Google OAuth round-trips successfully on both platforms
- [ ] Deep link `examsvalley://t/<username>` opens portfolio from cold start
- [ ] File downloads (`useFileDownload`) open in native viewer; PDF viewer streams
- [ ] All `[id]` editor routes correctly distinguish `'new'` vs an actual id
- [ ] Bottom tabs per role render and persist state across tab switches
- [ ] Dark mode toggle persists across launches
- [ ] `FeedbackPopup` fires once at 2 min, never again post-submit (per `useFeedbackStore`)
- [ ] EAS production build passes on both platforms; app store metadata complete

---

*End of audit.*
