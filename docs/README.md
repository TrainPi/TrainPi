# TrainPi

AI-guided operational workforce readiness platform. Built for NanTechs per the Development Agreement (May 2026) and its Exhibit A functional requirements — see `docs/` for the original contract PDFs.

**What it is, per Exhibit A's own words:** not a course platform, not a resume builder, not a static LMS. TrainPi compares a person's real capabilities against a real organization's real operational requirements, scores the gap, and builds a phased path to close it — five steps: Participant Profile → Operational Context Ingestion → AI Analysis & Comparison → Results & Insights → Personalized Roadmap.

Stack: FastAPI (Python) backend + Next.js 14 App Router (TypeScript) frontend, Postgres (Neon), Google Gemini as the sole AI provider.

---

## Status

Every Exhibit A functional requirement — the 5-step workflow, Admin & Organizational Features, Security & Data Handling, Repository & Contract Compliance — is built and has real code behind it, verified live against the real Gemini API (2026-07-28) and against the real Postgres/Redis/SMTP infrastructure this project actually runs on. No feature is stubbed or faked.

Two product extensions beyond the contract are also built: personalized course generation (curated catalog + YouTube fallback) and job postings matched to a participant's profile (Adzuna).

**What's not yet done — all external, not code:**

1. **`npm install` is currently broken on the primary dev machine — root cause found, not yet resolved.** It is not a memory or config issue: Windows Defender has been silently killing `node.exe` on every install attempt since 2026-07-26, blocking a malicious script (`Trojan:Win32/NpmSteal.MU!MTB`, a known npm-supply-chain credential-stealer pattern) before it could execute. The trigger has been isolated to `motion-dom` (pulled in transitively by `framer-motion`) — installing it alone reproduces the failure 100% of the time, across multiple published versions, independent of `--ignore-scripts` and `--no-audit`. Investigation was mid-way through inspecting the actual downloaded tarball contents (to confirm a genuinely compromised package vs. an overly broad Defender signature) when paused. **This is the one real blocker**: the frontend has never been run or clicked through in a browser as a result.
2. Free/cheap signups still needed, each activating an already-built feature: `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` (job search), `SENTRY_DSN` (error tracking), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (OAuth login), `YOUTUBE_API_KEY` (course fallback search), `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (credit purchases), `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET`/`R2_PUBLIC_URL` (avatar object storage — has a local-disk fallback for dev), `ENCRYPTION_KEY` (one-line generation — activates encryption at rest for resume/org-document text, currently plaintext).
3. A billed Google Cloud account before real user traffic — the current Gemini key is free-tier and will not survive concurrent load.
4. Once `npm install` is resolved: click through the entire Exhibit A flow live in a browser for the first time.
5. Confirm Vercel production env vars match `.env` intent, and confirm NanTechs actually has GitHub admin access on this repo.

Already done and live-verified this cycle: both exposed secrets (Gmail app password, Neon DB password) rotated and tested; Upstash Redis configured and tested against the real instance; migrated off the deprecated `google.generativeai` SDK to `google-genai`; added a 27-test automated pytest suite (previously zero tests existed anywhere in the repo); added encryption-at-rest support (built, awaiting `ENCRYPTION_KEY` to activate); added object storage for avatars (built, awaiting R2 credentials to activate); closed an unauthenticated endpoint (`video.py` search) and a hardcoded `SECRET_KEY` fallback vulnerability found during a full-codebase audit against the Exhibit A and Development Agreement source PDFs.

---

## Architecture

### Backend (`backend/`)

FastAPI, SQLAlchemy + Postgres (Neon), JWT auth (`python-jose`), bcrypt password hashing.

- **`app/routers/workforce.py`** — the core Exhibit A 5-step workflow. Resume/document upload with AI extraction (Gemini, including native multimodal vision for PNG/JPG org documents — no separate OCR step), the comparison/scoring engine, PDF report generation (`xhtml2pdf`), roadmap generation. Every AI-calling endpoint is rate-limited and deducts/refunds credits around the AI call.
- **`app/routers/admin.py`** — Organization/membership model, role-based access (`_require_org_admin`, verified on every sensitive endpoint), org-wide readiness aggregation (JSON + PDF, same underlying computation for both), and AI interaction monitoring (a usage activity log derived from existing `CreditTransaction` rows, not raw prompt/response storage).
- **`app/services/ai_service.py`** — the only AI integration point in the codebase. Google Gemini exclusively (`google-genai` SDK, `gemini-flash-latest`); Groq/Anthropic/OpenAI have been fully removed. Multi-key rotation/fallback, quota detection, JSON response parsing, and image/multimodal support all live here.
- **`app/cache.py`** — Upstash Redis (REST-based, fits serverless), automatic in-memory fallback when unconfigured. Backs `video.py`/`jobs.py` response caching and the rate limiter's distributed counter.
- **`app/rate_limit.py`** — per-user rate limiting, Redis-backed fixed-window when configured, in-memory sliding-window fallback otherwise.
- **`app/storage.py`** — object storage for user-uploaded files that need to persist (currently: avatars only — resumes/org documents/lesson uploads are extract-then-discard by design, so they never need raw-file storage). Cloudflare R2 via `boto3`, falls back to local disk for dev.
- **`app/encryption.py`** — application-level encryption at rest (Fernet/AES) for `resume_text` and `parsed_text`, the two free-text fields holding PII/confidential content. Gated behind `ENCRYPTION_KEY`; plaintext when unset, transparent encrypt/decrypt when set, legacy plaintext rows stay readable.
- **`app/database.py`** — `get_db()` (primary) and `get_db_read()` (routes to `REPLICA_DATABASE_URL` when set, falls back to primary otherwise — no replica is provisioned yet, the routing code is just ready for one).
- **`app/routers/jobs.py`** — Adzuna-backed job search, scored against the participant's extracted skills.
- **`tests/`** — pytest suite (27 tests): credit deduct/refund/402 handling, every admin access-control path, rate limiting, workforce credit flows, encryption. Run with `pip install -r requirements-dev.txt && pytest`. AI calls are mocked in tests (no live Gemini traffic in the suite); the actual pipeline has been separately verified live against the real API.

### Frontend (`frontend/`)

Next.js 14 App Router, TypeScript, Zustand for state, Tailwind.

- `app/workforce/` — the five Exhibit A step pages (profile, operational-context, analysis-comparison, results-insights, roadmap-pathway), each wired to the real backend endpoints via `lib/api.ts`'s `workforceAPI`.
- `app/admin/` — the org admin dashboard (`adminAPI`), no mock branch — role checks are real.
- `app/dashboard/job-readiness/` — job search UI (`jobsAPI`).
- `lib/courseMatch.ts` — roadmap topic → curated `courseCatalog.ts` match (token-overlap scoring) → YouTube fallback only when nothing curated matches.
- `lib/mockConfig.ts` — `NEXT_PUBLIC_USE_MOCK` gates mock vs. real API calls; `.env.local` sets it to `false` for local dev against the real backend.

---

## Setup

### Backend

```bash
cd backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env   # then fill in real values
uvicorn app.main:app --reload
```

Required env vars are documented inline in `.env.example`. At minimum: `DATABASE_URL`, `SECRET_KEY` (the app now fails to boot without one — no insecure fallback), `GOOGLE_API_KEY`. Everything else (Redis, R2, Sentry, Adzuna, YouTube, Stripe, OAuth, encryption) is optional and has a safe fallback or a clear disabled-state error until configured.

Run tests: `pip install -r requirements-dev.txt && pytest`

### Frontend

```bash
cd frontend
npm install   # currently broken on the primary dev machine — see Status above
cp .env.example .env.local
npm run dev
```

---

## Contract documents

`docs/Exhibit A - Operational Workflow - May 2026.pdf` and `docs/TRAINPI DEVELOPMENT AGREEMENT - May 2026.docx.pdf` are the original NanTechs source documents this build was scoped against.
