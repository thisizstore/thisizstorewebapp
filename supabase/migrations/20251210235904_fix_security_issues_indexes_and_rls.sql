/*
  # Fix Security Issues: Indexes and RLS Performance

  1. Changes
    - Add missing indexes on foreign key columns
    - Optimize RLS policies by caching auth.uid() with select
    - Consolidate multiple permissive policies where appropriate
    - Improve query performance at scale

  2. Indexes Added
    - users_profile(user_id)
    - jasa_posting(game_id, user_id)
    - jasa_cari(game_id, user_id)

  3. RLS Optimizations
    - Replace auth.uid() with (select auth.uid()) in all policies
    - Reduces function re-evaluation on large result sets
*/

-- Add missing indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_users_profile_user_id ON users_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_jasa_posting_game_id ON jasa_posting(game_id);
CREATE INDEX IF NOT EXISTS idx_jasa_posting_user_id ON jasa_posting(user_id);
CREATE INDEX IF NOT EXISTS idx_jasa_posting_is_approved ON jasa_posting(is_approved);
CREATE INDEX IF NOT EXISTS idx_jasa_cari_game_id ON jasa_cari(game_id);
CREATE INDEX IF NOT EXISTS idx_jasa_cari_user_id ON jasa_cari(user_id);
CREATE INDEX IF NOT EXISTS idx_jasa_cari_is_approved ON jasa_cari(is_approved);

-- Drop and recreate users_profile RLS policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profile;
CREATE POLICY "Admins can view all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;
CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate jasa_posting RLS policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view their own postings" ON jasa_posting;
DROP POLICY IF EXISTS "Admins can view all postings" ON jasa_posting;
DROP POLICY IF EXISTS "Admin can view all postings" ON jasa_posting;
DROP POLICY IF EXISTS "Public can view approved postings" ON jasa_posting;
DROP POLICY IF EXISTS "Users can update own postings" ON jasa_posting;
DROP POLICY IF EXISTS "Admins can delete postings" ON jasa_posting;
DROP POLICY IF EXISTS "Admin can approve postings" ON jasa_posting;

-- Recreate consolidated jasa_posting policies
CREATE POLICY "Public can view approved postings"
  ON jasa_posting FOR SELECT
  TO authenticated, anon
  USING (is_approved = true);

CREATE POLICY "Users can view own postings"
  ON jasa_posting FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_approved = true);

CREATE POLICY "Admin can view all postings"
  ON jasa_posting FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );

CREATE POLICY "Users can update own postings"
  ON jasa_posting FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admin can approve postings"
  ON jasa_posting FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  )
  WITH CHECK (true);

CREATE POLICY "Admin can delete postings"
  ON jasa_posting FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Drop and recreate jasa_cari RLS policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view their own cari" ON jasa_cari;
DROP POLICY IF EXISTS "Admins can view all cari" ON jasa_cari;
DROP POLICY IF EXISTS "Admin can view all cari" ON jasa_cari;
DROP POLICY IF EXISTS "Public can view approved cari" ON jasa_cari;
DROP POLICY IF EXISTS "Users can update own cari" ON jasa_cari;
DROP POLICY IF EXISTS "Admins can delete cari" ON jasa_cari;
DROP POLICY IF EXISTS "Admin can approve cari" ON jasa_cari;

-- Recreate consolidated jasa_cari policies
CREATE POLICY "Public can view approved cari"
  ON jasa_cari FOR SELECT
  TO authenticated, anon
  USING (is_approved = true);

CREATE POLICY "Users can view own cari"
  ON jasa_cari FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_approved = true);

CREATE POLICY "Admin can view all cari"
  ON jasa_cari FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );

CREATE POLICY "Users can update own cari"
  ON jasa_cari FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admin can approve cari"
  ON jasa_cari FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  )
  WITH CHECK (true);

CREATE POLICY "Admin can delete cari"
  ON jasa_cari FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );
