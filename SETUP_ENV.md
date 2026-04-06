# TrainPI Environment Setup & 502 Error Fix

## Problem
You're seeing **502 Bad Gateway** errors when calling the `/api/ai/career-goals-guidance` endpoint on your Vercel deployment.

## Root Causes Fixed
1. ✅ **Vercel timeout was too short** (60 seconds) - now increased to 300 seconds
2. ✅ **Missing timeout handling** in AI service - added detection for timeouts
3. ✅ **Poor error messages** - improved to provide better feedback instead of generic 502

## Required Environment Variables for Vercel

### Primary AI Service (Google Gemini)
Add ONE of these to Vercel settings:
- `GOOGLE_API_KEY` (preferred) - Your Google AI Studio API key
- `GEMINI_API_KEY` (alternative) - Same as above

### Fallback AI Service (Groq - for when Gemini fails)
- `GROQ_API_KEY` - Your Groq API key (free tier available)

### How to set them in Vercel:
1. Go to your project on Vercel: https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add each variable name and value
4. Redeploy the project (git push or Vercel dashboard)

## Getting API Keys

### Google Gemini (Primary - Recommended)
1. Go to https://aistudio.google.com/apikey
2. Click "Get API Key"
3. Create a new project or use existing
4. Copy the API key
5. Add to Vercel as `GOOGLE_API_KEY`

### Groq (Fallback - Free)
1. Go to https://console.groq.com
2. Sign up for a free account
3. Get your API key from dashboard
4. Add to Vercel as `GROQ_API_KEY`

## Testing After Deployment

### Check if environment variables are loaded:
```bash
curl https://your-vercel-app.vercel.app/api/health
```

### Test career guidance (with auth token):
```bash
curl -X POST https://your-vercel-app.vercel.app/api/ai/career-goals-guidance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"goal":"Learn Python"}'
```

## What Was Changed

### 1. Vercel Timeout (`vercel.json`)
```json
"config": {
    "maxDuration": 300  // Changed from 60 to 300 seconds
}
```

### 2. AI Service Improvements (`app/services/ai_service.py`)
- Added timeout exception detection
- Better error handling for quota/rate limits
- Faster fallback to Groq if Gemini times out

### 3. Better Error Messages (`app/routers/ai_features.py`)
- 503 for service quota/rate limit errors
- 504 for timeout errors
- 502 for other generation failures
- Detailed error messages instead of generic ones

## Common Issues & Solutions

### Still getting 502/503/504?

**Check 1: Are environment variables set?**
```bash
# On Vercel, check the deployment logs
# Look for messages like: "No Google API keys, using Groq for JSON..."
```

**Check 2: Is the API key valid?**
- Go to Google AI Studio or Groq dashboard
- Verify your key is still active
- Check for typos in Vercel settings

**Check 3: Have you hit rate limits?**
- Free tier limits: Limited requests per minute
- Solution: Wait a few minutes and try again, or upgrade tier

**Check 4: Is the prompt too complex?**
- Very long career paths with many resources can timeout
- Solution: Simplify the career goal request

## Local Development

For local testing, create a `.env` file:
```
GOOGLE_API_KEY=your_key_here
GROQ_API_KEY=your_groq_key_here
```

Then run:
```bash
cd backend
python run.py
```

The backend will use timeouts to prevent hanging requests.

## Monitoring

Watch your Vercel logs for patterns:
- "Gemini timeout" = Request exceeded AI processing time
- "quota" = API rate limit hit
- "No Google API keys" = Environment variables not set

All these are now handled with appropriate error codes instead of generic 502.
