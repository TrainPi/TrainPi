# 🚀 TrainPI Deployment Guide to Vercel

## Step 1: Prepare Your Code for Vercel

### Backend Requirements
✅ Already configured:
- `.env` file with Groq API key
- Groq as PRIMARY AI service (no quota issues)
- FastAPI with uvicorn

### Frontend Requirements
✅ Already configured:
- Next.js 14 with TypeScript
- Tailwind CSS
- API proxy configuration

---

## Step 2: Add Environment Variables to Vercel

### For Backend (on Vercel/Railway/Render):
Go to your deployment platform and add these environment variables:

```
DATABASE_URL=postgresql://user:password@host:port/trainpi
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services (Add your own keys)
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Optional fallbacks
OPENROUTER_API_KEY=your_openrouter_key_here
```

### For Frontend (Vercel Dashboard):
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## Step 3: Vercel Frontend Deployment

### Option 1: Deploy from Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repo
4. Select the `frontend` folder as root
5. Add environment variables (see above)
6. Deploy!

### Option 2: Vercel CLI
```bash
cd frontend
npm i -g vercel
vercel --prod
```

---

## Step 4: Backend Deployment (Choose One)

### Option 1: Render.com (Easiest)
1. Go to [render.com](https://render.com)
2. Create New → Web Service
3. Connect your GitHub repo
4. Select `backend` folder
5. Add environment variables
6. Set start command: `python run.py`
7. Deploy!

### Option 2: Railway.app
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repo
4. Select `backend` folder
5. Add environment variables
6. Deploy!

### Option 3: Heroku
1. Go to [heroku.com](https://heroku.com)
2. Create new app
3. Connect GitHub repo
4. Select `backend` folder
5. Add environment variables
6. Deploy!

---

## Step 5: Update Frontend API Configuration

After deploying backend, update frontend `next.config.js`:

```javascript
// Change this:
const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// To your deployed backend URL
const backendUrl = "https://trainpi-backend.herokuapp.com"; // or your Render/Railway URL
```

---

## Step 6: Database Setup

Before deploying, ensure PostgreSQL database is created and accessible:

```sql
CREATE DATABASE trainpi;
-- Tables auto-create via SQLAlchemy
```

**Services with included PostgreSQL:**
- Railway.app (includes free Postgres)
- Render.com (paid, ~$15/month)
- Supabase.com (free tier available)

---

## Environment Variables Checklist

### Backend .env (Production)
- [ ] DATABASE_URL (production database)
- [ ] SECRET_KEY (strong, random key)
- [ ] GROQ_API_KEY (your Groq key)
- [ ] GOOGLE_API_KEY (optional fallback)
- [ ] FRONTEND_URL (for CORS)

### Frontend .env.local
- [ ] NEXT_PUBLIC_API_URL (backend domain)

---

## AI Service Configuration

**Current Setup:**
✅ **Primary:** Groq API (30k tokens/day free, no quota issues)
✅ **Fallback:** Google Gemini (if Groq fails)
✅ **Max Tokens:** 8000 (supports detailed long courses)
✅ **Response Time:** 2-5 seconds

**No additional configuration needed** - Groq is auto-selected as primary service!

---

## Testing After Deployment

1. Open frontend URL
2. Register new account
3. Login
4. Generate a course ("become a software developer")
5. Verify it returns 100/100 quality score

---

## Troubleshooting

### Backend not responding
- Check environment variables are set
- Verify DATABASE_URL is correct
- Check Groq API key is valid

### Courses not generating
- Check Groq API key in backend logs
- Verify max_tokens is 8000 (not 1000)
- Frontend might need API_URL update

### CORS errors
- Update CORS_ORIGINS in backend
- Include frontend domain

---

## Quick Commands

```bash
# Build frontend
cd frontend && npm run build

# Test backend locally
cd backend && python run.py

# Check if servers running
curl http://localhost:8000
curl http://localhost:3001

# Deploy frontend only
cd frontend && npm run build && vercel --prod

# Deploy backend only (if using Railway/Render)
git push origin main  # Auto-deploys
```

---

## Support

For errors, check:
1. Vercel logs (Frontend)
2. Railway/Render logs (Backend)  
3. Browser console (Network tab)
4. Backend logs (application errors)
