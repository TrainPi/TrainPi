# TrainPi — End-to-End Remaining Checklist
**As of:** 2026-07-27 · Last verified commit: `652cb44`

Legend: ✅ Done & verified · 🟡 Built, not verified live · ⬜ Not started

---

## 0. Environment & Secrets

- [x] Neon Postgres connected, all 15 tables created and confirmed
- [x] `SECRET_KEY` rotated to a real random value
- [ ] `GOOGLE_API_KEY` (Gemini) — still blank, **blocks all AI features**
- [ ] Rotate Gmail app password (`SMTP_PASSWORD`) — old one was pasted in chat, needs revoke + regenerate in Google Account → Security → App Passwords
- [ ] Rotate Neon DB password — old one was pasted in chat, needs reset in Neon Console → Roles
- [ ] `YOUTUBE_API_KEY` — needed for course-generation fallback search
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — needed for Google OAuth login
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — needed for credit purchases
- [ ] Adzuna `app_id` / `app_key` — needed for jobs feature (not yet built)
- [ ] Confirm Vercel production env vars match/are separate from local `.env` as intended

---

## 1. Auth (Email/Password)

- [x] Register — verified live against real Neon DB
- [x] Login — verified live
- [x] `GET /me` with valid token — verified live
- [x] Reject no token (401) — verified live
- [x] Reject wrong password (401) — verified live
- [x] Reject duplicate email (400) — verified live
- [x] Forgot-password request returns generic message (no email enumeration) — verified live
- [ ] Actual password-reset **email delivery** — endpoint responds correctly, but SMTP send itself not confirmed end-to-end
- [ ] Reset-password (using the emailed token) — code exists, not tested live
- [ ] Frontend login/register **pages in a browser** — never clicked through (blocked by npm install issue)

## 2. Auth (Google OAuth)

- [ ] `GOOGLE_CLIENT_ID`/`SECRET` configured
- [ ] `/login/google` → Google consent → `/auth/google` callback flow tested live
- [ ] New-user-via-OAuth creates a `User` row correctly
- [ ] Existing-user-via-OAuth logs in without duplicating the account

## 3. Frontend — Never Run Live

- [ ] **Resolve `npm install`** on this machine (root cause never found — dies silently ~3s into dependency resolution, reproducible even for a single trivial package in an empty folder; ruled out Defender, cache corruption, network)
- [ ] `npm run dev` boots without errors
- [ ] Click through registration → login → dashboard in an actual browser
- [ ] Confirm `NEXT_PUBLIC_USE_MOCK=false` / `NEXT_PUBLIC_API_URL` wiring actually reaches the real backend (never visually confirmed)

## 4. Exhibit A — Step 1: Participant Profile

- [x] Backend: resume upload, AI extraction, persisted to `WorkforceProfile` — verified via smoke test (mocked AI)
- [ ] Verified against **real Gemini** (only tested with mocked responses so far)
- [ ] Verified in browser UI

## 5. Exhibit A — Step 2: Operational Context Ingestion

- [x] Backend: document upload (PDF/DOCX/TXT), AI extraction of all 9 Exhibit A fields, persisted to `OrganizationDocument` — verified via smoke test
- [ ] PNG/image documents — **not supported** (no OCR), rejected with clear error (deliberate, documented gap)
- [ ] Verified against real Gemini
- [ ] Verified in browser UI

## 6. Exhibit A — Step 3: AI Analysis & Comparison Engine

- [x] Backend: full comparison (matched/missing/partial skills, 6-category scoring, gap table) — verified via smoke test
- [ ] Verified against real Gemini
- [ ] Verified in browser UI

## 7. Exhibit A — Step 4: Results & Insights

- [x] Backend: persisted analysis retrieval — verified via smoke test
- [ ] **Downloadable summary report (PDF)** — not built, button shows a toast only
- [ ] Verified in browser UI

## 8. Exhibit A — Step 5: Personalized Roadmap & Pathway

- [x] Backend: phased roadmap generation from real gaps — verified via smoke test
- [ ] **Downloadable roadmap (PDF)** — not built, same toast-only gap
- [ ] AI mentor chat link — exists, not verified live
- [ ] Verified in browser UI

## 9. Exhibit A — Admin & Organizational Features

- [ ] `Organization` model — not started
- [ ] `OrganizationMembership` / role field on `User` — not started
- [ ] Admin dashboard (participant tracking, org readiness monitoring, analytics) — not started
- [ ] Workflow gap visualization at org level — not started
- [ ] AI interaction monitoring — not started
- [ ] **This is the single biggest remaining contractual gap from Exhibit A**

## 10. Exhibit A — Security & Data Handling

- [x] Passwords hashed (bcrypt) — verified
- [x] JWT auth with expiry — verified
- [x] Participant/org data in separate tables
- [ ] Role-based access — not built (depends on #9)
- [ ] Encryption at rest beyond Postgres/Neon defaults — not evaluated

## 11. Exhibit A — Repository & Contract Compliance

- [x] Code pushed to `TrainPi/TrainPi` (NanTechs-controlled org repo), in sync with fork
- [x] Regular, traceable commits (24+ logical commits)
- [ ] Confirm NanTechs org members actually have admin access on GitHub (outside of code, needs manual verification)
- [ ] Review the actual **Development Agreement** contract (only Exhibit A has been reviewed so far)

## 12. Beyond Exhibit A — AI Provider

- [x] Simplified to Gemini-only (removed Groq/Anthropic/OpenAI)
- [x] Upgraded default model to `gemini-2.5-flash`
- [ ] Verified against real Gemini API (blocked on `GOOGLE_API_KEY`)
- [ ] Google Cloud project moved to a **billed** account (currently would run on free tier, which won't survive real traffic)

## 13. Beyond Exhibit A — Personalized Course Generation

- [ ] Course-matching orchestration layer (AI topic → curated catalog match → YouTube fallback) — pieces exist independently (`courseCatalog.ts`, `video.py`, `roadmap.py`), **not wired together yet**
- [ ] Quality gating on YouTube fallback search (maxResults, duration filter, view-count sort) — not added
- [ ] `YOUTUBE_API_KEY` configured

## 14. Beyond Exhibit A — Job Postings

- [ ] Adzuna account signup (`app_id`/`app_key`)
- [ ] `backend/app/routers/jobs.py` — not created
- [ ] Skill-based query building from `WorkforceProfile`/`CareerProfile`
- [ ] Match-scoring (skills-in-description overlap)
- [ ] Frontend job-readiness page wired to real data (currently a stub)

## 15. Scale Readiness (1M+ users)

- [ ] Billed Gemini key (see #12)
- [ ] DB connection pool sizing reviewed (`pool_size=5, max_overflow=10` — too small for real concurrency)
- [ ] Redis/caching layer — none exists
- [ ] Read replicas — none exist
- [ ] Per-user rate limiting on backend endpoints — none exists (credits system limits cost, not request rate)
- [ ] File storage moved to object storage (S3/R2) instead of Postgres `Text` columns — not done
- [ ] Error tracking / monitoring (Sentry or equivalent) — none exists
- [ ] Aggressive caching on YouTube/Adzuna calls beyond the existing 24h in-memory cache pattern

---

## Immediate Next 3 Actions (Recommended Order)

1. **Add `GOOGLE_API_KEY`** — unblocks verifying the entire AI pipeline against real Gemini instead of mocks
2. **Fix `npm install`** — unblocks ever seeing the frontend run, the single biggest unverified risk right now
3. **Rotate Gmail + Neon passwords** — both were exposed in this chat; low effort, real security cleanup
