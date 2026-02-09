-- Run this in Supabase SQL Editor (Dashboard → SQL Editor) if registration returns 500
-- or if you see errors about missing columns (credits, gemini_api_key, etc.)

-- Add missing columns to users table (safe: only adds if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'credits') THEN
    ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gemini_api_key') THEN
    ALTER TABLE users ADD COLUMN gemini_api_key TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;
