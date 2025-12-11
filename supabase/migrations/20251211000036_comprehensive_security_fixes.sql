/*
  # Comprehensive Security Fixes

  1. Add Covering Indexes
    - Composite indexes on foreign key columns for better query performance
    - Indexes on approval status columns for faster filtering

  2. Optimize RLS Policies
    - Replace all auth.uid() with (select auth.uid()) for performance
    - Consolidate multiple permissive policies where possible

  3. Performance Improvements
    - Add strategic indexes for common query patterns
*/

-- Drop existing individual indexes to replace with covering indexes
DROP INDEX IF EXISTS idx_users_profile_user_id;
DROP INDEX IF EXISTS idx_jasa_posting_game_id;
DROP INDEX IF EXISTS idx_jasa_posting_user_id;
DROP INDEX IF EXISTS idx_jasa_posting_is_approved;
DROP INDEX IF EXISTS idx_jasa_cari_game_id;
DROP INDEX IF EXISTS idx_jasa_cari_user_id;
DROP INDEX IF EXISTS idx_jasa_cari_is_approved;

-- Create covering indexes for foreign keys and common queries
CREATE INDEX IF NOT EXISTS idx_users_profile_user_id ON users_profile(user_id) WHERE is_admin = false;
CREATE INDEX IF NOT EXISTS idx_users_profile_admin_idx ON users_profile(user_id) WHERE is_admin = true;

CREATE INDEX IF NOT EXISTS idx_jasa_posting_user_id_approved ON jasa_posting(user_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_jasa_posting_game_id_approved ON jasa_posting(game_id, is_approved);

CREATE INDEX IF NOT EXISTS idx_jasa_cari_user_id_approved ON jasa_cari(user_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_jasa_cari_game_id_approved ON jasa_cari(game_id, is_approved);

-- Re-create all RLS policies with optimized auth.uid() calls using subqueries

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;
DROP POLICY IF EXISTS "Public can view approved postings" ON jasa_posting;
DROP POLICY IF EXISTS "Users can view own postings" ON jasa_posting;
DROP POLICY IF EXISTS "Admin can view all postings" ON jasa_posting;
DROP POLICY IF EXISTS "Users can update own postings" ON jasa_posting;
DROP POLICY IF EXISTS "Admin can approve postings" ON jasa_posting;
DROP POLICY IF EXISTS "Admin can delete postings" ON jasa_posting;
DROP POLICY IF EXISTS "Users can view their own postings" ON jasa_posting;
DROP POLICY IF EXISTS "Admins can delete postings" ON jasa_posting;
DROP POLICY IF EXISTS "Public can view approved cari" ON jasa_cari;
DROP POLICY IF EXISTS "Users can view own cari" ON jasa_cari;
DROP POLICY IF EXISTS "Admin can view all cari" ON jasa_cari;
DROP POLICY IF EXISTS "Users can update own cari" ON jasa_cari;
DROP POLICY IF EXISTS "Admin can approve cari" ON jasa_cari;
DROP POLICY IF EXISTS "Admin can delete cari" ON jasa_cari;
DROP POLICY IF EXISTS "Users can view their own cari" ON jasa_cari;
DROP POLICY IF EXISTS "Admins can delete cari" ON jasa_cari;

-- Users Profile Policies
CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users view all for admin check"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Jasa Posting Policies
CREATE POLICY "Anyone can view approved postings"
  ON jasa_posting FOR SELECT
  TO authenticated, anon
  USING (is_approved = true);

CREATE POLICY "Users can view own or approved postings"
  ON jasa_posting FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    is_approved = true
    OR
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );

CREATE POLICY "Users can update own postings"
  ON jasa_posting FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()) AND is_approved = false);

CREATE POLICY "Admins can update postings"
  ON jasa_posting FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  )
  WITH CHECK (true);

CREATE POLICY "Admins can delete postings"
  ON jasa_posting FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Jasa Cari Policies
CREATE POLICY "Anyone can view approved cari"
  ON jasa_cari FOR SELECT
  TO authenticated, anon
  USING (is_approved = true);

CREATE POLICY "Users can view own or approved cari"
  ON jasa_cari FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR
    is_approved = true
    OR
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );

CREATE POLICY "Users can update own cari"
  ON jasa_cari FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()) AND is_approved = false);

CREATE POLICY "Admins can update cari"
  ON jasa_cari FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  )
  WITH CHECK (true);

CREATE POLICY "Admins can delete cari"
  ON jasa_cari FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = (select auth.uid()) AND up.is_admin = true
    )
  );
