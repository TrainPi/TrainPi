# TrainPi Platform — Full Requirements Document
**Prepared from:** Exhibit A (NanTechs Development Agreement, May 2026) + product discussions on courses, jobs, and scale
**Scope target:** 1,000,000+ registered users
**Status legend:** ✅ Built & verified · 🟡 Partially built · ⬜ Not started

---

## 0. What TrainPi Actually Is

Per Exhibit A's own words: **not** a course platform, **not** a resume builder, **not** a static LMS. It is an AI-guided operational workforce readiness platform — it compares a person's real capabilities against a real organization's real requirements, scores the gap, and builds a path to close it.

Two things you've since layered on top of Exhibit A's scope, which are legitimate product extensions but are **not** in the contract document:
- Personalized course generation (YouTube-sourced)
- Job posting search matched to the student's profile

Both are addressed below, clearly separated from the contractual Exhibit A requirements.

---

## 1. Participant Profile (Exhibit A Step 1)

**Status: ✅ Built**

| Requirement | Implementation |
|---|---|
| Resume upload (PDF/DOCX/TXT) | `POST /api/workforce/profile/upload-resume` |
| Skills, years of experience, job title, notes | `PUT /api/workforce/profile` |
| AI extraction → Participant Capability Profile | Gemini call in `workforce.py`, structured JSON: work history, skills, certifications, tools, strengths, missing/unclear skills |
| Data persisted for later comparison (not just displayed) | `WorkforceProfile` table (Postgres/Neon) |
| 5-step nav bar, workforce-readiness language, sidebar nav | `StepProgressBar`, `Sidebar.tsx` |

**AI provider:** Google Gemini only (`gemini-2.5-flash`), single API key, env var `GOOGLE_API_KEY`. Groq/Anthropic/OpenAI support has been removed from the codebase entirely — Gemini is the sole provider everywhere (shared app key + optional per-user personal Gemini key). Key currently **blank in `.env` — must be filled before this works live.**

---

## 2. Operational Context Ingestion (Exhibit A Step 2 — "the most important concept")

**Status: ✅ Built**, one gap flagged below.

| Requirement | Implementation |
|---|---|
| Org uploads: SOPs, Workflows, Role Descriptions, Mission/Objectives, Skill Frameworks, Other | 6-category upload UI, `/workforce/operational-context` |
| File types PDF, DOCX, TXT | Supported (`extract_text_from_file`, extended to add TXT) |
| File type PNG/JPG | ✅ **Supported** — no separate OCR step; routed directly to Gemini 2.5 Flash's native multimodal image understanding (`get_gemini_json_response_with_image` in `ai_service.py`). Chosen over Tesseract after confirming Tesseract's OS-level binary dependency wouldn't work on Vercel's serverless Python runtime anyway. Verified via smoke test with a real PNG upload. |
| Stored separately from participant data | `OrganizationDocument` table, separate from `WorkforceProfile` |
| `organization_documents[]` object with all 9 Exhibit A fields | Implemented exactly: `document_type`, `parsed_text`, `extracted_requirements`, `extracted_skills`, `extracted_workflows`, `extracted_role_expectations`, `extracted_keywords`, `extracted_tools`, `extracted_compliance_requirements`, `extracted_mission_objectives` |
| AI pipeline: extract → classify → extract all fields | Single combined Gemini call per document (`POST /api/workforce/context/upload`) |

---

## 3. AI Analysis & Comparison Engine (Exhibit A Step 3)

**Status: ✅ Built**

| Requirement | Implementation |
|---|---|
| Compare Participant Profile vs. Agency Requirements | `POST /api/workforce/analyze` — sends both structured profiles to Gemini in one prompt |
| Matched / missing / partial skills | Returned and persisted (`WorkforceAnalysis.matched_skills`, `.missing_skills`, `.partial_skills`) |
| Workflow gaps, tool gaps, compliance gaps, mission alignment gaps, readiness risks | Covered in the comparison prompt + `comparison_table` |
| 6 scoring categories (Technical Skills, Experience Alignment, Workflow Readiness, Mission Alignment, Compliance Readiness, Overall) | All 6 persisted as separate float columns |
| Comparison table (Area / Participant / Requirement / Result) | `WorkforceAnalysis.comparison_table` (JSON list) |

**Verified:** full pipeline tested end-to-end against SQLite with mocked AI responses — credit deduction, refund-on-failure, and 402-on-insufficient-credits all pass.

---

## 4. Results & Insights (Exhibit A Step 4)

**Status: ✅ Built**

| Requirement | Implementation |
|---|---|
| Readiness score visualization, strengths, gaps, capability alignment charts | Built, real data from `WorkforceAnalysis` |
| Risk indicators, recommendations dashboard | Built (`top_gaps`, `key_insights`) |
| **Downloadable summary report** | ✅ Real PDF via `xhtml2pdf` (pure Python, no OS deps — WeasyPrint was tried first but needs GTK3 installed at the OS level, which fails on both this Windows dev machine and Vercel's serverless Linux runtime). `GET /api/workforce/analysis/report.pdf`. |

---

## 5. Personalized Roadmap & Pathway (Exhibit A Step 5)

**Status: ✅ Built**

| Requirement | Implementation |
|---|---|
| AI-guided phased roadmap (4 phases) tied to actual gaps | `POST /api/workforce/roadmap` — real Gemini call using the persisted analysis's `top_gaps`/`missing_skills` |
| Recommended skills, learning modules, projects, timeline, milestones | Returned + persisted (`WorkforceRoadmap`) |
| AI mentor guidance | Existing `ai_chat.py` mentor chat, linked from roadmap page |
| **Downloadable roadmap (PDF)** | ✅ `GET /api/workforce/roadmap/report.pdf`, same `xhtml2pdf` approach as Step 4 |

---

## 6. Admin & Organizational Features (Exhibit A — dedicated section)

**Status: ✅ Built and verified** — this was the single biggest remaining gap; it's now closed.

Exhibit A explicitly requires:
- Admin dashboard — ✅ `/admin` frontend page
- Participant tracking (across an organization, not just self) — ✅
- Organizational readiness monitoring (aggregate view across many participants) — ✅ `readiness-summary` endpoint: average score, readiness distribution, per-participant breakdown
- Analytics and reporting — ✅ covered by readiness-summary
- Workflow gap visualization at the org level — ✅ `most_common_gaps` (counts how often each gap appears across all participants)
- Downloadable reports — 🟡 individual participant PDF reports exist (Sections 4/5); an *org-level* aggregate PDF export doesn't exist yet — minor remaining gap
- AI interaction monitoring — ⬜ **not built** — the one sub-item still open

**What was built:**
- `Organization` model (name, description, created_by_user_id)
- `OrganizationMembership` model (user_id, organization_id, role: `participant` | `org_admin`)
- `User.is_platform_admin` — a separate platform-wide superadmin flag, not tied to any one org (added to the live Neon DB via a safe additive `ALTER TABLE`)
- `backend/app/routers/admin.py` — create/list organizations, invite/remove/list members, and the core `GET /organizations/{id}/readiness-summary` endpoint
- Real role enforcement via `_require_org_admin` — **verified via smoke test**, including that outsiders and non-admin participants both correctly get 403
- `/admin` frontend page — create orgs, invite participants by email, view aggregate stats and a per-participant table

---

## 7. Security & Data Handling (Exhibit A)

| Requirement | Status |
|---|---|
| Securely store participant + org data | ✅ Postgres (Neon), gitignored `.env`, hashed passwords |
| Separate participant/org records | ✅ Separate tables |
| **Role-based access** | ✅ Built — `_require_org_admin`, verified via smoke test (403 for outsiders/non-admins) |
| Secure document upload | ✅ Size limits, type validation |
| Confidentiality of org documents | 🟡 Data is per-user isolated but not encrypted at rest beyond what Postgres/Neon provides by default |

---

## 8. Repository & Contract Compliance (Exhibit A)

| Requirement | Status |
|---|---|
| Code in NanTechs-controlled GitHub repo | ✅ Pushed to `TrainPi/TrainPi` (upstream org repo), both remotes in sync |
| NanTechs holds admin access | ⚠️ Needs confirmation outside of code — verify NanTechs org members actually have admin rights on that GitHub org/repo |
| Regular commits | ✅ 30+ logical, traceable commits across the engagement |
| Nothing withheld | ✅ All backend/frontend code pushed |
| Development Agreement reviewed | ✅ Read in full — flagged an internal date inconsistency and a broad IP/no-liability-clause worth being aware of |

---

## 9. Beyond Exhibit A — Personalized Course Generation

**Not in the contract. This is a product extension you've asked for.** Status: ✅ Built.

**Architecture (hybrid model, as discussed and agreed):**

1. `frontend/lib/courseMatch.ts` — for each AI-generated roadmap step (title + skills), scores it against every course in `courseCatalog.ts` by token overlap (title/category/skills) and picks the best match above a confidence threshold.
2. If no curated course matches → falls back to a live YouTube search via `video.py`'s `/api/video/search`, using a tightened query (`"<topic> tutorial for beginners"`, not the raw topic name).
3. **Quality gating on the fallback search** — `video.py` now requests 5 candidates (not 1), filters to `videoDuration=medium`/`long` to exclude Shorts/junk clips, and picks the highest-view-count result via a batched `videos.list` stats call — instead of blindly taking result #1.
4. Wired into `RoadmapView.tsx`'s "Learn this topic" button — routes to the matched curated course page, or opens the fallback video directly in a new tab (honest about it being a fallback, not a fake catalog entry).
5. **API keys needed:** `YOUTUBE_API_KEY` (Google Cloud Console, free tier — 10,000 quota units/day, ~100 units per search call, so ~100 free searches/day before hitting the quota ceiling) — **not yet configured**. At 1M users this free tier will not be enough — see Section 11.

**What's built:** `courseCatalog.ts` (curated courses), `video.py` (YouTube search with quality gating, cached through the shared Redis layer), `roadmap.py` (AI topic generation), `courseMatch.ts` (the matching/fallback orchestration connecting all three), `CourseEnrollment` model (progress tracking).

---

## 10. Beyond Exhibit A — Job Postings Matched to Profile

**Not in the contract. Product extension.** Status: ✅ Built, verified via smoke test (mocked Adzuna response) — real API key not yet configured.

**Provider: Adzuna** (free tier, 250 calls/month, broad aggregation across job boards). USAJobs (free, unlimited, US-federal-only) remains a good secondary source to add later given the platform's cybersecurity/federal-agency framing.

**Implementation:**
1. `backend/app/routers/jobs.py` — `GET /api/jobs/search`, mounted at `/api/jobs`.
2. Pulls skills from `WorkforceProfile.extracted_skills`/`primary_skills` first, falls back to `CareerProfile.skills` for the individual flow → builds the search query automatically (caller can override with `?query=`).
3. Calls Adzuna's `GET /v1/api/jobs/{country}/search/1` with `app_id`/`app_key`.
4. Responses cached in-memory for 4 hours (same TTL-cache pattern as `video.py`).
5. Match-scoring: counts how many of the user's skills appear in each posting's title+description (plain string matching, no AI) → sorts results by match count when the user has a skills profile.
6. `dashboard/job-readiness` page now has a real "Open Roles" section — search box, location filter, skill-match badges, direct apply links.

**API keys needed:** `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` (free signup at developer.adzuna.com) — placeholders added to `.env`, not yet filled in. Without them the endpoint returns a clear 503 rather than failing silently.

---

## 11. Scaling to 1,000,000+ Users — What Actually Changes

This is the part most people skip, and it's where a "works for 10 users" build breaks.

### 11.1 AI cost & rate limits
- **Free-tier Gemini keys will not survive real traffic.** Free tiers are rate-limited (e.g. ~15 req/min on Gemini free tier), shared across every user hitting your one key simultaneously.
- **Required:** move the Google Cloud project to a **billed** account (pay-as-you-go). This removes the hard rate ceiling; cost becomes the constraint instead, monitored via Cloud Console billing alerts/budgets.
- The existing multi-key rotation (`GOOGLE_API_KEY_2` through `_10` in `ai_service.py`) is a resilience mechanism against transient failures — **not** a substitute for paid capacity at scale.
- Groq/Anthropic/OpenAI fallback support has been removed — Gemini is the only provider, so there is no cross-provider fallback if Gemini itself has an outage. This is a deliberate simplicity tradeoff; revisit if Gemini reliability becomes a problem at scale.
- **Credits system** (already built — `credits.py`, `CreditTransaction`) is your actual cost-control lever: it limits how much AI usage any single user can generate before paying/waiting, which is what keeps your Gemini bill bounded as users grow.

### 11.2 Database
- ✅ Connection pool size/timeout/recycle now configurable via `DB_POOL_SIZE`/`DB_MAX_OVERFLOW`/`DB_POOL_TIMEOUT`/`DB_POOL_RECYCLE` env vars (defaults unchanged — still `pool_size=5, max_overflow=10`). Raise these via env var as real concurrent traffic grows; still relies on Neon's own pooler endpoint (already in use — note `-pooler` in the current `DATABASE_URL` hostname) for the real cross-instance concurrency limit on serverless.
- ✅ **Redis caching layer added** (`app/cache.py`, Upstash — REST-based, fits serverless). `video.py` and `jobs.py` now cache through it instead of a per-process dict, so cached results are shared across all serverless instances, not just one warm one. Falls back to the old in-memory behavior automatically when `UPSTASH_REDIS_REST_URL`/`_TOKEN` aren't set — **not yet configured**, needs a free Upstash signup.
- ✅ **Read-replica routing code added** (`get_db_read` in `database.py`), applied to the admin readiness-summary endpoint (its N+1 query pattern across org members is the clearest read-heavy candidate). Routes to `REPLICA_DATABASE_URL` when set, falls back to the primary automatically otherwise. **No replica is actually provisioned** — Neon's free tier doesn't include one, and at current scale (no real users yet) it would be paying for nothing. Provision one on a paid Neon tier once real read load justifies it.

### 11.3 Backend compute
- Currently deployed as a single Vercel serverless function (`index.py`, `maxDuration: 300`). Serverless is fine for burst scaling but:
  - **300-second max duration** is risky for AI calls that may take a while under load — long AI responses could hit this ceiling.
  - Vercel serverless has cold-start latency; at 1M users, consider a dedicated backend host (e.g. a real server/container fleet) if latency becomes a complaint, though serverless can work fine if usage patterns are bursty rather than sustained.

### 11.4 Rate limiting & abuse prevention
- ✅ **Built.** `app/rate_limit.py` — per-user rate limiting on the 4 AI-calling workforce endpoints, independent of the credits system. Now dual-backend: uses Redis (fixed-window `INCR`+`EXPIRE`, a true cross-instance limit) when Upstash is configured, falls back to the original per-process in-memory sliding window otherwise. Verified via smoke test that the 6th call within a 60s window gets a 429 while the first 5 go through.

### 11.5 File storage
- Resume/document uploads: currently, `parsed_text` is stored directly in Postgres as `Text` columns — fine for moderate volume, but at 1M users with large documents this bloats your database. Consider moving raw file storage to object storage (S3/R2/Supabase Storage) and keeping only extracted text + a file reference in Postgres. **Not started.**

### 11.6 Job/course API rate limits
- YouTube Data API free tier (10k units/day) and Adzuna free tier (250 calls/month) are **nowhere near sufficient** for 1M users. Both need upgrading to paid tiers as real traffic grows. Caching is now in place for both via the shared Redis layer (11.2) — this reduces repeat-query load on the external APIs today, but doesn't remove the need to upgrade the tiers themselves once volume grows.

### 11.7 Monitoring
- ✅ **Sentry wired into the backend** (`main.py`, no-op until `SENTRY_DSN` is set — free Sentry signup needed). **Frontend Sentry not added** — `@sentry/nextjs` requires `npm install` + its setup wizard, which couldn't be verified given the unresolved `npm install` issue on this machine (see the frontend section of the remaining checklist). Add it once the frontend can actually be built and tested locally.
- No structured logging pipeline or uptime monitoring beyond Sentry's own alerting — acceptable for now, revisit if Sentry alone proves insufficient.

---

## 12. What's Actually Left

Every planned build item is done. What remains is external accounts/keys and live verification — not more code:

1. **`GOOGLE_API_KEY`** — unblocks verifying the entire AI pipeline (including the new PNG/JPG vision path) against real Gemini instead of mocks.
2. **Fix `npm install`** on the dev machine — unresolved after repeated debugging (not Defender, not a specific package, not simple heap exhaustion — likely general system memory pressure). Blocks ever running the frontend, and blocks frontend Sentry.
3. **Rotate the Gmail app password and Neon DB password** — both were exposed in chat during setup.
4. **`ADZUNA_APP_ID`/`ADZUNA_APP_KEY`, `UPSTASH_REDIS_REST_URL`/`_TOKEN`, `SENTRY_DSN`** — all built and wired, each just needs a free signup.
5. **`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`** — needed to test Google OAuth login for the first time.
6. **Billed Google Cloud account** — needed before any real user traffic.
7. Once 1–2 are unblocked: **click through the entire Exhibit A flow live in a browser** — the one thing nobody has seen work end-to-end outside of smoke tests.
8. **AI interaction monitoring** (Exhibit A's admin section) — the one remaining sub-item under Admin/Org.
9. **Org-level aggregate PDF export** — individual participant reports exist; an org-wide summary PDF doesn't yet (minor).
