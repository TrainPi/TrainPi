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
| File type PNG | ⬜ **Not supported** — rejected with a clear error (no OCR pipeline built). Flagged as a known gap, not silently broken. |
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

**Status: 🟡 Mostly built — 1 real gap**

| Requirement | Implementation |
|---|---|
| Readiness score visualization, strengths, gaps, capability alignment charts | Built, real data from `WorkforceAnalysis` |
| Risk indicators, recommendations dashboard | Built (`top_gaps`, `key_insights`) |
| **Downloadable summary report** | ⬜ **Not built** — button exists, just shows a toast ("we'll email it shortly"). No PDF generation, no email delivery. |

---

## 5. Personalized Roadmap & Pathway (Exhibit A Step 5)

**Status: 🟡 Mostly built — 1 real gap**

| Requirement | Implementation |
|---|---|
| AI-guided phased roadmap (4 phases) tied to actual gaps | `POST /api/workforce/roadmap` — real Gemini call using the persisted analysis's `top_gaps`/`missing_skills` |
| Recommended skills, learning modules, projects, timeline, milestones | Returned + persisted (`WorkforceRoadmap`) |
| AI mentor guidance | Existing `ai_chat.py` mentor chat, linked from roadmap page |
| **Downloadable roadmap (PDF)** | ⬜ **Not built** — same toast-only gap as Step 4 |

---

## 6. Admin & Organizational Features (Exhibit A — dedicated section)

**Status: ⬜ Not started — the single biggest remaining gap**

Exhibit A explicitly requires:
- Admin dashboard
- Participant tracking (across an organization, not just self)
- Organizational readiness monitoring (aggregate view across many participants)
- Analytics and reporting
- Workflow gap visualization at the org level
- Downloadable reports
- AI interaction monitoring

**Why this is a real architecture gap, not a UI page:** everything built so far is single-user — each `User` sees only their own `WorkforceProfile`/`OrganizationDocument`/`WorkforceAnalysis`. There is no concept of an "Organization" that groups many participants under one admin's view. This requires:

- New `Organization` model (name, admin user(s), created_at)
- New `OrganizationMembership` model (user_id, organization_id, role)
- A `role` field on `User` (or the membership table): `participant`, `org_admin`, `platform_admin`
- New admin-only endpoints: `GET /api/admin/organizations/{id}/participants`, `GET /api/admin/organizations/{id}/readiness-summary` (aggregated scores across all members), etc.
- New admin dashboard frontend section, gated by role

This is genuinely a multi-day build on its own — it's a new entity type, not a rewire of existing pages.

---

## 7. Security & Data Handling (Exhibit A)

| Requirement | Status |
|---|---|
| Securely store participant + org data | ✅ Postgres (Neon), gitignored `.env`, hashed passwords |
| Separate participant/org records | ✅ Separate tables |
| **Role-based access** | ⬜ Not built — no roles exist yet (see Section 6) |
| Secure document upload | ✅ Size limits, type validation |
| Confidentiality of org documents | 🟡 Data is per-user isolated but not encrypted at rest beyond what Postgres/Neon provides by default |

---

## 8. Repository & Contract Compliance (Exhibit A)

| Requirement | Status |
|---|---|
| Code in NanTechs-controlled GitHub repo | ✅ Pushed to `TrainPi/TrainPi` (upstream org repo), fast-forwarded to latest |
| NanTechs holds admin access | ⚠️ Needs confirmation outside of code — verify NanTechs org members actually have admin rights on that GitHub org/repo |
| Regular commits | ✅ 14 logical, traceable commits for the workforce build |
| Nothing withheld | ✅ All backend/frontend code pushed |

---

## 9. Beyond Exhibit A — Personalized Course Generation

**Not in the contract. This is a product extension you've asked for.** Status: 🟡 Partially built, needs new orchestration logic.

**Architecture (hybrid model, as discussed and agreed):**

1. Student's gaps (from `WorkforceAnalysis.missing_skills`/`top_gaps`, or the individual-flow `CareerProfile`) feed into the existing `roadmap.py` AI call, which already generates a topic list per step.
2. **New logic needed:** for each AI-generated topic, first check `frontend/lib/courseCatalog.ts` (the existing hardcoded, hand-curated course library) for a keyword/skill match.
   - If matched → attach that curated course (already has real multi-unit structure + progress tracking via `CourseEnrollment`).
   - If no match → fall back to a live YouTube search via `video.py`'s `/api/video/search` endpoint, using a tightened query (`"<topic> tutorial for beginners"`, not the raw topic name).
3. **Quality gating on the fallback search** (currently missing in `video.py`, should be added):
   - Request `maxResults=5` instead of 1, filter by `videoDuration=medium` or `long` to exclude Shorts/junk clips, and pick the highest-view-count result among embeddable candidates — instead of blindly taking result #1.
4. **API keys needed:** `YOUTUBE_API_KEY` (Google Cloud Console, free tier — 10,000 quota units/day, ~100 units per search call, so ~100 free searches/day before hitting the quota ceiling). At 1M users this free tier will not be enough — see Section 11.

**What's already built:** `courseCatalog.ts` (curated courses), `video.py` (YouTube search + 24h in-memory cache), `roadmap.py` (AI topic generation), `CourseEnrollment` model (progress tracking).
**What's missing:** the matching/fallback orchestration layer connecting all three (currently they exist independently, not wired together).

---

## 10. Beyond Exhibit A — Job Postings Matched to Profile

**Not in the contract. Product extension.** Status: ⬜ Not started.

**Recommended provider: Adzuna** (free tier, 250 calls/month, broad aggregation across job boards, simple REST API). USAJobs (free, unlimited, but US-federal-only) is a good secondary source given the platform's cybersecurity/federal-agency framing, added later.

**Architecture:**
1. New `backend/app/routers/jobs.py` — one endpoint, `GET /api/jobs/search`.
2. Pull the student's skills from `WorkforceProfile.extracted_skills` (or `CareerProfile.skills` for the individual flow) → build a search query string.
3. Call Adzuna's `GET /v1/api/jobs/{country}/search/{page}` with `app_id`/`app_key` + the query.
4. Cache responses in-memory with a TTL (same pattern as `video.py`), since the free tier is rate-limited.
5. Optional match-scoring: count how many of the student's skills appear in each posting's description text (plain string matching, no AI needed) → sort by match count → show "you match 4/6 required skills."
6. New/extended frontend page (`dashboard/job-readiness` already exists as a stub) to list and sort postings.

**API keys needed:** Adzuna `app_id` + `app_key` (free signup).

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
- Current: Neon Postgres, no read replicas, no connection pooling beyond SQLAlchemy's default pool (`pool_size=5, max_overflow=10` in `database.py`) — **this pool size is far too small for 1M users' concurrent traffic** and needs to scale with your actual concurrent request volume (likely needs PgBouncer or Neon's built-in pooler, plus a much larger pool).
- No caching layer (Redis) anywhere — every dashboard load, every credits check, hits Postgres directly. At scale, add Redis for session/credits/frequently-read data.
- No database read replicas — all reads and writes hit one primary. Fine at low scale, a bottleneck at 1M users.

### 11.3 Backend compute
- Currently deployed as a single Vercel serverless function (`index.py`, `maxDuration: 300`). Serverless is fine for burst scaling but:
  - **300-second max duration** is risky for AI calls that may take a while under load — long AI responses could hit this ceiling.
  - Vercel serverless has cold-start latency; at 1M users, consider a dedicated backend host (e.g. a real server/container fleet) if latency becomes a complaint, though serverless can work fine if usage patterns are bursty rather than sustained.

### 11.4 Rate limiting & abuse prevention
- **Not built at all today.** Nothing stops one user from firing `/api/workforce/analyze` in a tight loop beyond credits running out (and refunds happen on AI failure, which could be abused).
- **Required:** per-user request rate limiting on the backend (e.g. a simple sliding window in Redis: max N requests per endpoint per minute), independent of the credits system.

### 11.5 File storage
- Resume/document uploads: currently, `parsed_text` is stored directly in Postgres as `Text` columns — fine for moderate volume, but at 1M users with large documents this bloats your database. Consider moving raw file storage to object storage (S3/R2/Supabase Storage) and keeping only extracted text + a file reference in Postgres.

### 11.6 Job/course API rate limits
- YouTube Data API free tier (10k units/day) and Adzuna free tier (250 calls/month) are **nowhere near sufficient** for 1M users. Both need upgrading to paid tiers, and both need aggressive caching (the existing `video.py` cache pattern should be extended and applied to jobs too) so repeated searches for the same popular queries don't re-hit the external API every time.

### 11.7 Monitoring
- No error tracking (Sentry or similar), no structured logging pipeline, no uptime monitoring visible in the codebase today. At 1M users, you need visibility into failures before users report them.

---

## 12. Priority Order (Recommended)

1. **Fill in AI keys, verify the full Exhibit A flow works live** (blocking everything else)
2. **Downloadable reports (PDF)** — small, self-contained, closes two explicit Exhibit A gaps
3. **Jobs integration** — self-contained, one new router, clear value
4. **Course-matching orchestration layer** — wires together three things you already have
5. **Admin & Organizational Features** — the big one; needs a new `Organization`/role data model
6. **Scale hardening** (Section 11) — do this incrementally as real usage grows, not all upfront; but rate limiting and DB pool sizing are worth doing before any real user growth, not after an outage
