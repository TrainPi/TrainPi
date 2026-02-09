# Deploying TrainPi (Vercel + env credentials)

You have the frontend and backend on Vercel and a custom domain. Credentials must be set in **Vercel Environment Variables** (not in the repo). Here’s how to make it work.

---

## 1. Where to set env vars

- **Vercel Dashboard** → your **project** (frontend or backend) → **Settings** → **Environment Variables**
- Add each variable for the right **Environment** (Production, Preview, Development). At least set **Production**.
- After changing env vars, **redeploy** the project (Deployments → … → Redeploy) so the new values are used.

---

## 2. Frontend project (Next.js on Vercel)

In the **frontend** Vercel project, add:

| Variable | Example | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-domain.vercel.app` or `https://api.yourdomain.com` | Yes |
| `NEXT_PUBLIC_USE_MOCK` | `false` | Yes (so the app uses the real backend) |

- **`NEXT_PUBLIC_API_URL`** must be the **full URL** of your deployed backend (no trailing slash), e.g.  
  `https://trainpi-backend.vercel.app` or your custom API domain.
- **`NEXT_PUBLIC_USE_MOCK`** must be `false` in production so the UI calls the real API and credits/auth work.

---

## 3. Backend project (FastAPI on Vercel)

In the **backend** Vercel project, add these. Use **production** values (no real secrets in the repo).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Production PostgreSQL URL (e.g. Neon, Supabase, Vercel Postgres, Railway). Must be reachable from Vercel. |
| `SECRET_KEY` | Long random string for JWT and sessions (e.g. 32+ chars). Generate one and keep it secret. |
| `FRONTEND_URL` | Full URL of your frontend, no trailing slash (e.g. `https://yourdomain.com` or `https://trainpi.vercel.app`). Used for CORS and OAuth redirects. |
| `GOOGLE_API_KEY` | Primary Gemini API key (from aistudio.google.com). |
| `GOOGLE_API_KEY_2` … `GOOGLE_API_KEY_5` | Optional extra Gemini keys for fallback. |
| `GOOGLE_CLIENT_ID` | If you use Google OAuth login. |
| `GOOGLE_CLIENT_SECRET` | If you use Google OAuth login. |
| `STRIPE_SECRET_KEY` | Only if you use Stripe for “Buy credits” (starts with `sk_live_` or `sk_test_`). |
| `STRIPE_WEBHOOK_SECRET` | Only if you use Stripe; set in Stripe Dashboard for the webhook URL. |
| `CORS_ORIGINS` | Optional. Comma-separated origins, e.g. `https://yourdomain.com,https://www.yourdomain.com`. If not set, backend uses `FRONTEND_URL` to allow that origin. |

Important:

- **`DATABASE_URL`**: Use a **hosted Postgres** (Neon, Supabase, Vercel Postgres, etc.). Localhost URLs will not work on Vercel.
- **`FRONTEND_URL`**: Must match the URL users use to open the app (including custom domain if you use one).
- **`SECRET_KEY`**: Must be the same across redeploys; use a strong random value and store it safely.

---

## 4. After setting env vars

1. **Redeploy** both projects (frontend and backend) after adding or changing env vars.
2. **Test**:
   - Open the frontend URL; it should load and call the backend (no mock).
   - Log in / register; dashboard and credits should load.
   - Use one AI feature (e.g. AI Career Mentor) to confirm Gemini and credits work.
3. **Custom domain**: If you use a domain for frontend and/or backend, ensure:
   - `NEXT_PUBLIC_API_URL` = backend domain (e.g. `https://api.yourdomain.com`).
   - `FRONTEND_URL` = frontend domain (e.g. `https://yourdomain.com`).
   - In Vercel, the domain is added and DNS is set as instructed.

---

## 5. Checklist

- [ ] Frontend: `NEXT_PUBLIC_API_URL` = backend URL  
- [ ] Frontend: `NEXT_PUBLIC_USE_MOCK` = `false`  
- [ ] Backend: `DATABASE_URL` = production Postgres URL  
- [ ] Backend: `SECRET_KEY` = strong random value  
- [ ] Backend: `FRONTEND_URL` = frontend URL (and/or set `CORS_ORIGINS`)  
- [ ] Backend: at least `GOOGLE_API_KEY` set (others optional)  
- [ ] Backend: Stripe vars only if you use Stripe checkout  
- [ ] Both projects redeployed after changing env  
- [ ] `.env` is never committed (already in `.gitignore`)

Once these are set and both apps are redeployed, the deployed app will use your credentials and work with your domain.
