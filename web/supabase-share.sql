-- Run this in your Supabase SQL editor (after supabase-setup.sql)

-- Add share columns to presentations table
ALTER TABLE presentations
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS presentations_share_token_idx ON presentations (share_token);

-- Create profiles table for plan tracking
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',         -- 'free' | 'pro'
  stripe_customer_id text,
  stripe_subscription_id text,
  presentation_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (new.id) ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- RLS: anyone can read public presentations (for share link viewer)
CREATE POLICY "Anyone can view public presentations" ON presentations
  FOR SELECT USING (is_public = true);
