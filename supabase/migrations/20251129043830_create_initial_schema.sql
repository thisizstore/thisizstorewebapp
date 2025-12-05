/*
  # Create Initial Schema for Gaming Account Marketplace

  1. New Tables
    - `games` - Daftar game yang tersedia
    - `users_profile` - Profile tambahan untuk users
    - `jasa_posting` - Data akun yang dijual
    - `jasa_cari` - Data pencarian akun
    - `approvals` - Data untuk approval oleh admin
    - `testimonials` - Data testimoni (untuk future use)

  2. Security
    - Enable RLS pada semua tables
    - Create policies untuk authenticated users dan public access
*/

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon_name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number text UNIQUE NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jasa_posting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  owner_name text NOT NULL,
  game_id uuid REFERENCES games(id) NOT NULL,
  price integer NOT NULL CHECK (price >= 10000),
  phone_number text NOT NULL,
  is_safe boolean NOT NULL,
  additional_spec text,
  photos jsonb DEFAULT '[]'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jasa_cari (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  requester_name text NOT NULL,
  game_id uuid REFERENCES games(id) NOT NULL,
  price_min integer NOT NULL CHECK (price_min >= 10000),
  price_max integer NOT NULL CHECK (price_max >= 10000),
  phone_number text NOT NULL,
  account_spec text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE jasa_posting ENABLE ROW LEVEL SECURITY;
ALTER TABLE jasa_cari ENABLE ROW LEVEL SECURITY;

-- Games: Public read
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users Profile: Users can view their own, admins can view all
CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Jasa Posting: Users can view approved, users can insert their own
CREATE POLICY "Approved postings are viewable by everyone"
  ON jasa_posting FOR SELECT
  TO authenticated, anon
  USING (is_approved = true);

CREATE POLICY "Users can view their own postings"
  ON jasa_posting FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all postings"
  ON jasa_posting FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Users can insert postings"
  ON jasa_posting FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own postings"
  ON jasa_posting FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete postings"
  ON jasa_posting FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Admins can update postings approval"
  ON jasa_posting FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- Jasa Cari: Similar policies
CREATE POLICY "Approved cari are viewable by everyone"
  ON jasa_cari FOR SELECT
  TO authenticated, anon
  USING (is_approved = true);

CREATE POLICY "Users can view their own cari"
  ON jasa_cari FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cari"
  ON jasa_cari FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Users can insert cari"
  ON jasa_cari FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cari"
  ON jasa_cari FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete cari"
  ON jasa_cari FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Admins can update cari approval"
  ON jasa_cari FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- Insert default games
INSERT INTO games (name, icon_name) VALUES
  ('Free Fire', 'Flame'),
  ('Mobile Legend', 'Sword'),
  ('Efootball', 'Trophy'),
  ('FC Mobile', 'Trophy'),
  ('Roblox', 'Cube'),
  ('PUBG', 'Target'),
  ('Genshin Impact', 'Sparkles'),
  ('Clash of Clans', 'Shield')
ON CONFLICT (name) DO NOTHING;
