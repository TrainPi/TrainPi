# TrainPi — Final Pre-Delivery Checklist
**As of:** 2026-08-07 (post full-codebase audit + code-only follow-up pass) · both remotes in sync at `5ee6655`

Legend: ✅ Done & verified · 🟡 Built, unverified/unreproducible · ⬜ Not started

---

## Headline finding

A fresh, skeptical audit (re-reading Exhibit A and the Development Agreement PDFs directly, then the actual source line-by-line — not trusting prior doc claims), followed by a code-only follow-up pass closing every remaining code-level item that didn't require an external account or a business decision:

- **Every Exhibit A functional requirement has real, working code behind it.** No feature is stubbed, faked, or missing.
- **Audit-day fixes:** unauthenticated `video.py` endpoint, inconsistent hardcoded `SECRET_KEY` fallbacks, missing `.env.example` templates, gitignored lockfile.
- **Follow-up pass fixes:** object storage for avatars (Cloudflare R2, replacing a local-disk write that doesn't survive Vercel's serverless filesystem), migrated off the deprecated `google.generativeai` SDK to `google-genai`, added a real automated test suite (27 tests, previously zero existed), and added encryption at rest for resume/org-document text.
- **All backend code work identified by the audit is now done.** What's left is exclusively external accounts/signups, business decisions, and the standing `npm install` block — see the priority list at the bottom.
- **The contract completion date (July 15, 2026) has already passed.** This is worth flagging to whoever manages the NanTechs relationship — it's independent of code readiness.

---

## 0. Fixed this round (audit + code-only follow-up)

- [x] `backend/app/routers/video.py` `/search` — was callable by anyone with no auth, burning the shared `YOUTUBE_API_KEY` quota. Now rate-limited per-user via the same `rate_limit()` dependency every other AI-adjacent endpoint uses.
- [x] `backend/app/auth.py` + `backend/app/main.py` — both read `SECRET_KEY` with **different hardcoded fallback strings**. Both now `os.environ["SECRET_KEY"]` — fails loudly at boot if unset, instead of silently running with a publicly-known default.
- [x] `backend/.env.example` and `frontend/.env.example` created — previously zero template existed anywhere in the repo for either side.
- [x] `frontend/.gitignore` — un-ignored `package-lock.json`/`yarn.lock` so a future working `npm install` produces a committed, reproducible snapshot instead of silently discarding it.
- [x] Object storage for avatars — `backend/app/storage.py` (Cloudflare R2 via boto3), replacing a local-disk write in `upload_avatar` that doesn't survive Vercel's ephemeral serverless filesystem. Falls back to local disk automatically when unconfigured. Also fixed a latent bug: `profile_image` was never persisted to the user's DB row.
- [x] Migrated `ai_service.py` off the deprecated `google.generativeai` SDK to `google-genai`. Live-verified against the real Gemini key (text, JSON, image, error handling, full pipeline run).
- [x] Added a real automated pytest suite — `backend/tests/`, 27 tests, all passing (credits, admin access control, rate limiting, workforce credit flows, encryption).
- [x] Added encryption at rest for `resume_text`/`parsed_text` — `backend/app/encryption.py`, gated behind `ENCRYPTION_KEY`.

---

## 1. Environment & Secrets

- [x] Neon Postgres connected, all tables created
- [x] `SECRET_KEY` rotated to a real random value, **and now required (no insecure fallback)**
- [x] `GOOGLE_API_KEY` (Gemini) — verified live, `gemini-flash-latest`
- [ ] **Rotate Gmail app password** (`SMTP_PASSWORD`) — still the original value pasted in chat months ago, still live in `.env`
- [ ] **Rotate Neon DB password** — same exposure, still live in `.env`
- [ ] `YOUTUBE_API_KEY` — course-matching fallback search
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth login, never tested live
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — credit purchases
- [ ] `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` — jobs feature (built, returns clean 503 without it)
- [ ] `UPSTASH_REDIS_REST_URL` / `_TOKEN` — Redis caching (built, on in-memory fallback) — **paused mid-setup, awaiting your go-ahead**
- [ ] `SENTRY_DSN` — backend error tracking (built, no-op until set)
- [ ] `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` — object storage for avatars (built, on local-disk fallback which doesn't survive Vercel)
- [ ] Confirm Vercel production env vars match local `.env` intent — not inspected in this audit (out of scope for a local file read)

## 2. Exhibit A — 5-step workflow (backend)

All confirmed with real file:line evidence this session — see `backend/app/routers/workforce.py` (681 lines, read in full):

- [x] Step 1 Participant Profile — resume upload + AI extraction + persistence
- [x] Step 2 Operational Context — PDF/DOCX/TXT text extraction + PNG/JPG via Gemini vision, all 9 Exhibit A fields persisted
- [x] Step 3 AI Analysis — matched/missing/partial skills, all 6 scoring categories, credit refund on AI failure
- [x] Step 4 Results — persisted retrieval + PDF export (`xhtml2pdf`, real HTML escaping)
- [x] Step 5 Roadmap — phased plan tied to actual gaps + PDF export
- [x] Consistent error handling throughout: credits refunded on AI failure, hard-fail (502) where there's nothing useful to persist, soft-degrade where a partial record is still useful
- [ ] Minor: Exhibit A's Step-1 field list separately calls out "projects/tasks performed" — not a distinct column in `WorkforceProfile` (folded into work_history/strengths instead). Small literal deviation, likely fine — your judgment call.
- [ ] **Verified in browser UI** — still blocked on `npm install`, still never visually confirmed by anyone

## 3. Exhibit A — Admin & Organizational Features

- [x] Organization + membership model, role-based access (`_require_org_admin`) — confirmed applied to **every** sensitive endpoint in `admin.py`, no gaps found
- [x] Readiness summary (avg score, distribution, most-common-gaps) — JSON + PDF, both share one code path so they can't drift
- [x] AI interaction monitoring — usage-only `CreditTransaction` aggregation, correctly excludes purchases/refunds
- [x] Admin dashboard frontend (`/admin`) wired to real endpoints (no mock branch)
- [ ] Verified in browser UI

## 4. AI Provider — Gemini-only

- [x] Confirmed zero `groq`/`anthropic`/`openai` references anywhere in backend or frontend source (grepped, zero hits)
- [x] `requirements.txt` contains exactly one AI package: `google-genai`
- [x] `DEFAULT_MODEL = "gemini-flash-latest"`
- [x] **Migrated off the deprecated `google.generativeai` SDK to `google-genai`** — the old SDK emitted a `FutureWarning` on every import saying it no longer receives updates. Rewrote `ai_service.py`'s client/call shape (`genai.Client(api_key=...).models.generate_content(...)`), preserving identical behavior: multi-key rotation, quota detection, JSON parsing, user-key override, image/multimodal input. Live-verified against the real Gemini key: text, JSON, image, invalid-key error handling, and a full end-to-end resume-upload pipeline run all pass.
- [ ] Billed Google Cloud account — currently free tier, won't survive real traffic

## 5. Security

- [x] Bcrypt password hashing, JWT with expiry — confirmed
- [x] `SECRET_KEY` fallback vulnerability — **fixed**
- [x] `video.py` unauthenticated endpoint — **fixed**
- [x] Role-based access control on all org-scoped endpoints — confirmed, no gaps
- [x] No hardcoded secrets in source (grepped patterns like `sk-`, `AIza`, `whsec_` — zero hits outside `.env`, which is correctly gitignored and untracked)
- [x] No bare `except:` anywhere in backend; the two `except Exception: pass` sites found are both benign (idempotent table creation, optional-extraction fallback with a visible placeholder string)
- [x] **Encryption at rest built** (`backend/app/encryption.py`) — `WorkforceProfile.resume_text` (PII) and `OrganizationDocument.parsed_text` (confidential SOPs/mission text) now use a SQLAlchemy `EncryptedText` type (Fernet/AES via `cryptography`, already a transitive dependency, no new package). Gated behind `ENCRYPTION_KEY`: unset = plaintext exactly as before (today's actual state), set = transparent encrypt/decrypt with no application code changes, legacy plaintext rows stay readable (no backfill migration required). Verified end-to-end: raw SQL reads return ciphertext only, ORM reads decrypt transparently.
- [ ] `ENCRYPTION_KEY` — generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`, store outside `.env` somewhere durable (losing it makes encrypted rows unreadable)

## 6. Tests

- [x] **Automated pytest suite added** (`backend/tests/`, 27 tests, all passing) — no test code existed anywhere in the repo before this; every prior "verified via smoke test" claim was manual and unreproducible. Covers: credit deduct/refund/402-insufficient-credits (the cost-control mechanism every AI feature depends on), every `_require_org_admin` access-control path (outsider 403, participant-role 403, platform-admin bypass, 404-vs-403 ordering, empty-org zero-states), the in-memory rate limiter (allows-up-to-cap, 429+Retry-After after, per-user scoping), workforce resume/doc-upload credit behavior, and the encryption module (both key-unset and key-set states). AI calls are mocked (no live Gemini traffic in the suite) — the pipeline is separately live-verified, see section 4.
- [x] Run with `cd backend && pip install -r requirements-dev.txt && pytest`
- [ ] No CI configured yet to run these automatically on push — worth adding a GitHub Actions workflow at some point, not blocking

## 7. Frontend — Never Run Live

- [ ] **`npm install`** still unresolved on this machine. Per your instruction, not being worked on unless you ask again.
- [ ] No lockfile currently exists to commit even once install succeeds (fixed the gitignore blocker today; still need one working install to generate it)
- [ ] All Exhibit A-relevant pages confirmed wired to real API calls at the source level (not mock data) — `profile`, `operational-context`, `analysis-comparison`, `results-insights`, `roadmap-pathway`, `/admin`, `job-readiness` all checked against `api.ts`
- [ ] None of the above has ever been rendered in a browser — this remains the single biggest unverified surface of the whole product

## 8. Jobs & Course Matching (beyond Exhibit A)

- [x] `jobs.py` built — skill-based query, match scoring, caching, frontend wired
- [x] Course-matching orchestration (`courseMatch.ts`) — curated catalog first, YouTube fallback with quality gating
- [x] `video.py` — now properly rate-limited (fixed this session)
- [ ] `ADZUNA_APP_ID`/`KEY` and `YOUTUBE_API_KEY` both still blank — features work, just unconfigured

## 9. Scale Readiness

- [x] DB pool sizing configurable via env vars
- [x] Redis caching layer built, auto-falls-back to in-memory
- [x] Read-replica routing built, falls back to primary
- [x] Per-user rate limiting built, now applied consistently including `video.py`
- [x] Sentry hook built, no-op until `SENTRY_DSN` set
- [x] **Object storage built** (`backend/app/storage.py`, Cloudflare R2 via boto3) — audit found resumes/org docs/lesson uploads never stored raw bytes anyway (extract-then-discard by design, no DB bloat risk). The real gap was `upload_avatar` writing to local disk, which doesn't survive Vercel's ephemeral serverless filesystem — fixed, now goes through R2 with automatic local-disk fallback for dev. Also fixed a latent bug: the old endpoint never persisted `profile_image` to the user's DB row at all.
- [ ] `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET`/`R2_PUBLIC_URL` — free Cloudflare R2 signup, activates object storage (currently on local-disk fallback)

## 10. Repository & Contract

- [x] Code in `TrainPi/TrainPi` (NanTechs org repo), in sync with fork — both remotes at `5ee6655`
- [x] Regular, traceable commit history
- [ ] Confirm NanTechs org members actually have GitHub admin access — not a code question, needs manual check
- [ ] **Contract completion date (July 15, 2026) has passed** — flag to whoever manages the relationship, independent of code state

---

## What's Actually Left — Priority Order

Every item below requires either an external account/signup, a business decision only you can make, or is the standing `npm install` block — **no more code-only work remains** from the audit.

1. **Rotate Gmail app password** — exposed in chat, still live.
2. **Rotate Neon DB password** — exposed in chat, still live.
3. **Decide on Upstash Redis** — paused mid-setup on your "wait." Free signup at console.upstash.com whenever you're ready.
4. **Fix `npm install`** — biggest remaining blocker; parked per your instruction. Frontend has never been seen running.
5. **Adzuna, Sentry, Google OAuth, YouTube, Stripe, Cloudflare R2, `ENCRYPTION_KEY`** — all free/cheap signups or a one-line key generation, all currently blank, each activates one already-built feature.
6. **Billed Google Cloud account** — needed before real user traffic on the free-tier Gemini key.
7. **Once npm install is fixed:** click through the entire Exhibit A flow live in a browser for the first time.
8. **Confirm Vercel production env vars** match intent, and that NanTechs has actual GitHub admin access.
9. **Surface the passed contract deadline** to whoever manages the NanTechs relationship.
10. Optional: add a GitHub Actions workflow to run the new pytest suite on every push — not blocking, the suite already runs and passes locally.

Everything else — every Exhibit A feature, the admin/org layer, the AI provider (now on the current SDK), scale-hardening scaffolding, object storage, encryption at rest, and a real test suite — is genuinely built, tested, and pushed.
