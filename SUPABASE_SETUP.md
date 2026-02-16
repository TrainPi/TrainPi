# 🎯 Supabase Database Setup for TrainPi

## Step 1: Get the Connection URL from Supabase

### Instructions:
1. Go to: https://supabase.com/dashboard
2. Click on your **"trainpi"** project
3. Click the **Settings** icon (⚙️) in the left sidebar
4. Click **Database** in the settings menu
5. Scroll down to **"Connection string"** section
6. Click the **URI** tab (NOT "Session mode" or "Transaction mode")
7. You'll see something like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
8. **Copy this URL**
9. **IMPORTANT:** Replace `[YOUR-PASSWORD]` with your actual database password

### Example:
```
Before: postgresql://postgres.abc123:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

After:  postgresql://postgres.abc123:MyActualPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## Step 2: Add to Vercel

### Instructions:
1. Go to: https://vercel.com/dashboard
2. Click on your **backend** project (trainpi-backend or similar)
3. Click **Settings** tab
4. Click **Environment Variables** in the left menu
5. Look for `DATABASE_URL`:
   - **If it exists:** Click **Edit** → Paste your URL → **Save**
   - **If it doesn't exist:** Click **Add New** → 
     - Key: `DATABASE_URL`
     - Value: (paste your connection string)
     - Environment: Select **Production**, **Preview**, and **Development**
     - Click **Save**
6. Go to **Deployments** tab
7. Click the **...** menu on the latest deployment
8. Click **Redeploy**
9. Wait for deployment to finish (~2 minutes)

---

## Step 3: Create Database Tables

### Option A: Automatic (Recommended - No SQL needed!)

Your app will auto-create tables on first use. Just:

1. **Wait for Vercel deployment to finish** (Step 2 above)
2. **Visit your frontend** (e.g., https://trainpi.vercel.app)
3. **Try to register a new user**
4. Tables will be created automatically! ✨

**That's it! No SQL queries needed.**

---

### Option B: Manual (Only if automatic doesn't work)

If you want to create tables manually or automatic creation fails:

1. Go to Supabase → Your "trainpi" project
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    gemini_api_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create career_profiles table
CREATE TABLE IF NOT EXISTS career_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    career_goal TEXT,
    current_skills TEXT,
    target_role VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    career_path VARCHAR(255) NOT NULL,
    steps JSON NOT NULL,
    current_step INTEGER DEFAULT 0,
    completion_percentage FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500),
    analysis_result JSON,
    score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    roadmap_id INTEGER REFERENCES roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    step_number INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started',
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create credits table
CREATE TABLE IF NOT EXISTS credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_roadmap_id ON lessons(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);

-- Success message
SELECT 'Tables created successfully!' AS status;
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see "Tables created successfully!"

---

## ✅ Verification

### Check if it's working:

1. **Go to your frontend** (e.g., https://trainpi.vercel.app)
2. **Try to register** a new user
3. **If registration works** → Database is connected! 🎉
4. **To verify tables exist:**
   - Go to Supabase → **Table Editor**
   - You should see: `users`, `roadmaps`, `lessons`, etc.

---

## 🆘 Troubleshooting

### "Connection refused" or "Database error"
- ✅ Check you replaced `[YOUR-PASSWORD]` with actual password
- ✅ Make sure you copied the **URI** format (not Session/Transaction)
- ✅ Verify the URL includes `:6543` port number
- ✅ Make sure you added it to **backend** project in Vercel
- ✅ Redeploy after adding the variable

### "Tables don't exist"
- ✅ Try registering a user (auto-creates tables)
- ✅ If that fails, use the manual SQL method above
- ✅ Check Supabase → Table Editor to see if tables exist

### "Password authentication failed"
- ✅ Double-check your database password
- ✅ Reset password in Supabase: Settings → Database → Reset Database Password
- ✅ Update the connection string with new password

---

## 📝 Summary

**What you need:**
1. ✅ Connection URL from Supabase (with password replaced)
2. ✅ Add to Vercel backend as `DATABASE_URL`
3. ✅ Redeploy backend
4. ✅ Try to register a user (tables auto-create)

**No SQL queries needed unless automatic creation fails!**

---

## 🎯 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Frontend:** (your-frontend-url.vercel.app)
