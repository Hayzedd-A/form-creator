# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server with Turbopack (http://localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint
```

There is no test suite/runner configured in this project (no Jest/Vitest, no `test` script). `test.js` at the repo root is scratch notes, not part of the app — ignore it.

## Environment

Requires a `.env` (or `.env.local`) with: `MONGODB_URI`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY`, `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`.

## Architecture

Next.js 16 App Router app (React 19, TypeScript) for building/sharing forms, backed by MongoDB via Mongoose.

### Auth is currently split across two incompatible configs — read before touching auth

This repo is mid-migration from NextAuth v4 to v5 (`next-auth@5.0.0-beta.30` is installed, but the code hasn't fully moved over):

- `src/lib/auth.ts` exports the **v4-style** `authOptions` (`NextAuthOptions`, credentials provider, bcrypt password check against the `User` model). **Every API route** (`src/app/api/**`) calls `getServerSession(authOptions)` from this file to authenticate requests.
- `src/auth.config.ts` exports the **v5-style** `authConfig` (`NextAuthConfig`) with an *empty* `providers: []`. `src/middleware.ts` builds `auth()` from this config and uses it purely to redirect unauthenticated visits to protected page routes (`/dashboard`, `/forms/create`, `*/edit`, `*/analytics`, `/profile`, `/settings`, `*/responses`) to `/auth/signin`.

Practically: the middleware's route-protection check and the API routes' actual session validation are two separate systems that happen to agree today only because `authConfig.providers` was never wired up for real checks in middleware. When adding a new protected route or new auth logic, update `src/middleware.ts`'s `isProtected` matcher (page-level) **and** copy the `getServerSession(authOptions)` guard into the new API route (data-level) — one without the other leaves a gap. Don't assume the two config files are equivalent or that fixing one fixes the other.

### Data model (`src/models/`)

Three Mongoose models, all accessed through the cached-connection helper `dbConnect()` in `src/lib/mongodb.ts` (must be awaited at the top of every API route/server action before querying):

- **User** — email/password (bcrypt-hashed) + profile image (Cloudinary) + password-reset token fields.
- **Form** — owned by a `userId`, has a unique `slug`, an array of `fields` (embedded `FormFieldSchema`, one of many field `type`s: short-text, paragraph, multiple-choice, file-upload, rating, linear-scale, yes-no, dropdown, checkbox, email, number, date, datetime, phone, url, signature, time, address), and a `settings` subdocument controlling public access, email/IP response limits, open/close dates, "assignment mode" (quiz-style scoring), draft-saving, theming, and notifications. A `pre("save")` hook recomputes `totalPoints` from field `points` when `assignmentMode` is on.
- **FormResponse** — one document per submission (or per in-progress draft, `status: draft|partial|completed`), storing per-field answers, submitter IP/email/location/device, timing, and — for assignment-mode forms — `totalScore`/`maxScore`.

Note: the `IFormField`/`IFormSettings`/form-field-type union is defined independently in at least three places (`src/models/Form.ts`, `src/app/forms/create/page.tsx`, `src/app/forms/[slug]/edit/page.tsx`) rather than shared from one source — when adding a new field type or setting, all copies need updating or the create/edit UI will silently diverge from what the API/DB accept.

### Form lifecycle

1. **Create** (`src/app/forms/create/page.tsx`, client component, uses `next-auth/react`'s `useSession`) — builds the `fields`/`settings` payload and `POST`s to `/api/forms` (`src/app/api/forms/route.ts`), which derives a unique `slug` from the title (lowercased, hyphenated, deduped by appending a counter) and creates the `Form`.
2. **Edit** — `src/app/forms/[slug]/edit/page.tsx` + `src/app/api/forms/[slug]/route.ts`.
3. **Public submission** — `src/app/form/[slug]/page.tsx` (public, no auth) posts to `src/app/api/forms/[slug]/submit/route.ts`, which validates access via `validateFormAccess()` (active/public/date-window/allowed-emails checks) in `src/lib/analytics.ts`, enforces `limitOneResponse`/`limitByEmail` dedup, collects IP/device/location (`getClientIP`, `getDeviceInfo`, `getLocationInfo` — the last calls the free `ip-api.com` service), and, for assignment-mode forms, scores the response via `calculateScore`/`getGradeFromScore`. The same file's `PUT` handler saves/updates in-progress drafts (only when `settings.allowDrafts` is enabled).
4. **Responses & analytics** — `src/app/forms/[slug]/responses/page.tsx` / `src/app/form/[slug]/analytics/page.tsx` read from `src/app/api/forms/[slug]/responses/route.ts` and `.../analytics/route.ts`; CSV/JSON export helpers (`exportToCSV`, `exportToJSON`) live in `src/lib/analytics.ts`.

### UI layer

ShadCN-style primitives live in `src/components/ui/` (Radix UI + `class-variance-authority` + `cn()` from `src/lib/utils.ts`, which wraps `clsx`+`tailwind-merge`). Feature components (modals, nav, user menu) sit directly under `src/components/`. `src/components/responseDetailModal-old.tsx` is a superseded version of `ResponseDetailModal.tsx` — check which one is actually imported before editing either.

Drag-and-drop field reordering (in the create/edit builders) uses `react-dnd` + `react-dnd-html5-backend`. Toaster notifications use `sonner`.
