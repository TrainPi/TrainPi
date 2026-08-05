# TrainPi — End-to-End Remaining Checklist
**As of:** 2026-07-28 (updated after live Gemini verification) · both remotes in sync

Legend: ✅ Done & verified · 🟡 Built, not verified live · ⬜ Not started

---

## 0. Environment & Secrets

- [x] Neon Postgres connected, all 17 tables created and confirmed
- [x] `SECRET_KEY` rotated to a real random value
- [x] `GOOGLE_API_KEY` (Gemini) — **added and verified live.** Default model switched from `gemini-2.5-flash` (retired by Google for new keys — confirmed via a live 404) to `gemini-flash-latest`, Google's rolling alias to their current-generation flash model.
- [ ] Rotate Gmail app password (`SMTP_PASSWORD`) — old one was pasted in chat, needs revoke + regenerate in Google Account → Security → App Passwords
- [ ] Rotate Neon DB password — old one was pasted in chat, needs reset in Neon Console → Roles
- [ ] `YOUTUBE_API_KEY` — needed for course-matching fallback search
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — needed for Google OAuth login
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — needed for credit purchases
- [ ] `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` — needed for jobs feature (built, needs keys)
- [ ] `UPSTASH_REDIS_REST_URL` / `_TOKEN` — needed to activate Redis caching (built, falls back to in-memory)
- [ ] `SENTRY_DSN` — needed to activate backend error tracking (built, no-op until set)
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
- [ ] Frontend login/register **pages in a browser** — never clicked through (blocked by unresolved `npm install` issue)

## 2. Auth (Google OAuth)

- [ ] `GOOGLE_CLIENT_ID`/`SECRET` configured
- [ ] `/login/google` → Google consent → `/auth/google` callback flow tested live
- [ ] New-user-via-OAuth creates a `User` row correctly
- [ ] Existing-user-via-OAuth logs in without duplicating the account

## 3. Frontend — Never Run Live

- [ ] **Resolve `npm install`** on this machine — still unresolved after repeated debugging. Latest finding: not Defender, not a fixed package, not simple V8 heap exhaustion (raising heap to 8GB didn't fix it, though it delayed the failure slightly). Manifest-fetch count before failure creeps up slightly across repeated attempts (8→11→14→16→17), suggesting general system memory pressure (~5GB free of 16GB, Windows Memory Compression already active) rather than an npm/network bug. Untried: retry after closing other running apps (VS Code, Slack, WhatsApp, Nextiva, Edge WebView) to free RAM, or run the install on a machine with more headroom.
- [ ] `npm run dev` boots without errors
- [ ] Click through registration → login → dashboard in an actual browser
- [ ] Confirm `NEXT_PUBLIC_USE_MOCK=false` / `NEXT_PUBLIC_API_URL` wiring actually reaches the real backend (never visually confirmed)
- [ ] Frontend Sentry (`@sentry/nextjs`) — intentionally not added yet, needs `npm install` working first

## 4. Exhibit A — Step 1: Participant Profile

- [x] Backend: resume upload, AI extraction, persisted to `WorkforceProfile` — verified via smoke test (mocked AI)
- [x] **Verified against real Gemini** (2026-07-28) — uploaded a real resume, got back genuinely accurate skills/strengths/gaps (correctly identified "no SIEM experience," "no formal security certs" as honest gaps, not hallucinated ones)
- [ ] Verified in browser UI (still blocked on `npm install`)

## 5. Exhibit A — Step 2: Operational Context Ingestion

- [x] Backend: document upload (PDF/DOCX/TXT), AI extraction of all 9 Exhibit A fields, persisted to `OrganizationDocument` — verified via smoke test
- [x] **PNG/JPG documents** — supported via Gemini native multimodal vision (no separate OCR engine — Tesseract was ruled out since it needs an OS-level binary unavailable on Vercel serverless).
- [x] **Verified against real Gemini** (2026-07-28, text path) — uploaded a real Incident Response SOP, got back correctly classified document type, accurate requirements, and correctly extracted the specific compliance policy number (CP-114) mentioned in the text
- [ ] Image path (PNG/JPG) still only verified via mocked smoke test, not live Gemini vision yet
- [ ] Verified in browser UI

## 6. Exhibit A — Step 3: AI Analysis & Comparison Engine

- [x] Backend: full comparison (matched/missing/partial skills, 6-category scoring, gap table) — verified via smoke test
- [x] **Verified against real Gemini** (2026-07-28) — real participant profile vs. real SOP produced a coherent 58% "Moderate Readiness" score with specific, correctly-reasoned gaps (SIEM experience, 15-minute triage SLA, compliance policy familiarity) and a 6-row comparison table
- [ ] Verified in browser UI

## 7. Exhibit A — Step 4: Results & Insights

- [x] Backend: persisted analysis retrieval — verified via smoke test
- [x] **Downloadable summary report (PDF)** — built via `xhtml2pdf` (pure Python, no OS deps — chosen after WeasyPrint's GTK3 requirement failed on this machine). `GET /api/workforce/analysis/report.pdf`.
- [x] **Verified against real Gemini + real PDF generation** (2026-07-28) — downloaded, confirmed valid PDF (`%PDF` header), 8579 bytes of real content from the live analysis above
- [ ] Verified in browser UI

## 8. Exhibit A — Step 5: Personalized Roadmap & Pathway

- [x] Backend: phased roadmap generation from real gaps — verified via smoke test
- [x] **Downloadable roadmap (PDF)** — `GET /api/workforce/roadmap/report.pdf`, same xhtml2pdf approach
- [x] **Verified against real Gemini** (2026-07-28) — 4-phase roadmap generated directly addressing the real gaps found in Step 3 (SIEM training, triage SLA practice, Security+/CySA+ cert path); PDF downloaded and confirmed valid (6017 bytes)
- [ ] AI mentor chat link — exists, not verified live
- [ ] Verified in browser UI

## 9. Exhibit A — Admin & Organizational Features

- [x] `Organization` + `OrganizationMembership` models — built
- [x] Role field (`participant` / `org_admin`) + `User.is_platform_admin` — built, column added to live Neon DB via safe additive `ALTER TABLE`
- [x] Admin dashboard API — create/list orgs, invite/remove/list members, aggregate `readiness-summary` endpoint (avg score, readiness distribution, most-common-gaps-across-org) — verified via smoke test **including 403 checks for outsiders and non-admin participants**
- [x] Admin dashboard frontend page (`/admin`) — built
- [x] Workflow gap visualization at org level — covered by `most_common_gaps` in the readiness-summary endpoint
- [x] **Org-level aggregate PDF export** — `GET /api/admin/organizations/{id}/readiness-summary/report.pdf`, reuses the same aggregation logic as the JSON endpoint via a shared helper. Verified via smoke test including 403 checks for outsiders/non-admins. Download button added to `/admin` page.
- [ ] AI interaction monitoring — not started (this is the one sub-item still open)
- [ ] Verified in browser UI

## 10. Exhibit A — Security & Data Handling

- [x] Passwords hashed (bcrypt) — verified
- [x] JWT auth with expiry — verified
- [x] Participant/org data in separate tables
- [x] Role-based access — built (`_require_org_admin` in `admin.py`), verified via smoke test
- [ ] Encryption at rest beyond Postgres/Neon defaults — not evaluated

## 11. Exhibit A — Repository & Contract Compliance

- [x] Code pushed to `TrainPi/TrainPi` (NanTechs-controlled org repo), in sync with fork — both remotes at `58fa7a6`
- [x] Regular, traceable commits (30+ logical commits across the whole engagement)
- [x] Development Agreement contract reviewed — read in full; flagged an internal date inconsistency and a broad IP/no-liability-clause worth being aware of (see prior conversation — not repeated here since it's not a code task)
- [ ] Confirm NanTechs org members actually have admin access on GitHub (outside of code, needs manual verification)

## 12. Beyond Exhibit A — AI Provider

- [x] Simplified to Gemini-only (Groq/Anthropic/OpenAI fully removed from the codebase)
- [x] Default model is `gemini-flash-latest` (switched from the pinned `gemini-2.5-flash`, which Google retired for new API keys — caught via a live 404 during verification, not caught by any smoke test since those all used mocked responses)
- [x] Multimodal image support added (`get_gemini_json_response_with_image`) for the PNG/JPG org-doc path
- [x] **Verified against real Gemini API** (2026-07-28) — full workforce pipeline run live, real output quality confirmed good
- [ ] Google Cloud project moved to a **billed** account (currently would run on free tier, which won't survive real traffic)

## 13. Beyond Exhibit A — Personalized Course Generation

- [x] Course-matching orchestration layer built (`frontend/lib/courseMatch.ts`) — AI roadmap topic → curated `courseCatalog.ts` match (token-overlap scoring) → YouTube fallback only when no curated course matches
- [x] Quality gating on YouTube fallback search — `video.py` now requests 5 candidates, filters to medium/long duration (excludes Shorts), picks highest-view-count result via a batched stats lookup instead of blindly taking result #1
- [ ] `YOUTUBE_API_KEY` configured
- [ ] Verified in browser UI

## 14. Beyond Exhibit A — Job Postings

- [x] `backend/app/routers/jobs.py` built — `GET /api/jobs/search`
- [x] Skill-based query building from `WorkforceProfile`/`CareerProfile`
- [x] Match-scoring (skills-in-description overlap, results sorted by match count)
- [x] Frontend `job-readiness` page wired to real data — search box, location filter, skill-match badges, apply links
- [x] Verified via smoke test (mocked Adzuna response): query building, sort order, caching, override, missing-config 503 all pass
- [ ] `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` configured (signup needed — currently returns a clear 503)
- [ ] Verified against the real Adzuna API

## 15. Scale Readiness (1M+ users)

- [ ] Billed Gemini key (see #12)
- [x] DB connection pool sizing now configurable via `DB_POOL_SIZE`/`DB_MAX_OVERFLOW`/`DB_POOL_TIMEOUT`/`DB_POOL_RECYCLE` env vars (defaults unchanged, tune as real traffic grows)
- [x] **Redis caching layer built** (`app/cache.py`, Upstash REST-based — fits serverless). `video.py`/`jobs.py` cache through it. Falls back to in-memory automatically when unconfigured.
- [x] **Read-replica routing code built** (`get_db_read`, `REPLICA_DATABASE_URL`), applied to the admin readiness-summary endpoint. No actual replica provisioned yet (deliberate — no read load exists to justify the cost).
- [x] **Per-user rate limiting built** (`app/rate_limit.py`) — applied to the 4 AI-calling workforce endpoints. Redis-backed fixed-window when configured, in-memory sliding-window fallback otherwise. Verified via smoke test.
- [ ] File storage moved to object storage (S3/R2) instead of Postgres `Text` columns — not done
- [x] **Backend error tracking built** (Sentry, `main.py`) — no-op until `SENTRY_DSN` is set
- [ ] Frontend error tracking (Sentry) — blocked on `npm install`
- [x] Caching on YouTube/Adzuna calls now goes through the shared Redis layer (11.6 in the full requirements doc) — reduces repeat-query load once Redis is configured; doesn't remove the need to upgrade API tiers as volume grows

---

## What's Actually Left

1. ~~`GOOGLE_API_KEY`~~ — ✅ **done 2026-07-28**, full pipeline verified live against real Gemini.
2. **Fix `npm install`** — still the single biggest blocker. Try closing other running apps to free RAM, then retry; or use a machine with more headroom. Blocks ever seeing the frontend run, and blocks frontend Sentry.
3. **Rotate Gmail app password** — was pasted in chat, still live.
4. **Rotate Neon DB password** — was pasted in chat, still live.
5. **`ADZUNA_APP_ID`/`ADZUNA_APP_KEY`** — free signup, activates real job search results.
6. **`UPSTASH_REDIS_REST_URL`/`_TOKEN`** — free signup, activates Redis caching.
7. **`SENTRY_DSN`** — free signup, activates backend error tracking.
8. **`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`** — needed to test Google OAuth login for the first time.
9. **Confirm Vercel production env vars** match intent — and update the production `GOOGLE_API_KEY`'s dependent model name if it was ever hardcoded anywhere outside `ai_service.py`'s `DEFAULT_MODEL` (it isn't, but worth a final check before deploy).
10. **Billed Google Cloud account** — needed before any real user traffic.
11. Once #2 is unblocked: **click through the entire Exhibit A flow live in a browser** for the first time — the backend side of this is now proven end-to-end; the browser/UI side is the one thing nobody has actually seen work.
12. **AI interaction monitoring** (Exhibit A's admin section) — the one remaining sub-item under Admin/Org that wasn't built this round.
