-- =====================================================
-- SQL SCRIPT: Complete Login and Admin Fix
-- =====================================================
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- Script ini akan:
-- 1. Membuat function untuk phone lookup (bypass RLS)
-- 2. Update RLS policy agar profile bisa dibaca setelah login
-- =====================================================

-- ========== STEP 1: Create Phone Lookup Function ==========
-- Function ini bisa dipanggil tanpa auth untuk mencari username dari nomor telepon

CREATE OR REPLACE FUNCTION get_username_by_phone(phone_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
  result_username text;
BEGIN
  SELECT username INTO result_username
  FROM users_profile
  WHERE phone_number = phone_input
  LIMIT 1;
  
  RETURN result_username;
END;
$$;

-- Grant akses ke anonymous dan authenticated users
GRANT EXECUTE ON FUNCTION get_username_by_phone(text) TO anon;
GRANT EXECUTE ON FUNCTION get_username_by_phone(text) TO authenticated;

-- ========== STEP 2: Fix RLS Policy for Profile Read ==========
-- Drop semua policy SELECT yang existing untuk users_profile
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Allow username lookup for login" ON users_profile;
DROP POLICY IF EXISTS "Allow profile lookup for login and own profile view" ON users_profile;

-- Buat policy baru yang lebih sederhana dan permissive
-- Authenticated users bisa baca profile mereka sendiri
CREATE POLICY "Authenticated users can read own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin bisa baca semua profile
CREATE POLICY "Admins can read all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- ========== STEP 3: Verify Existing Data ==========
-- Cek data user yang ada (uncomment untuk testing)
-- SELECT id, username, phone_number, is_admin, user_id FROM users_profile;

-- =====================================================
-- CARA MENJALANKAN:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Copy-paste SELURUH script ini
-- 3. Klik "Run"
-- 4. Refresh halaman aplikasi dan coba login lagi
-- =====================================================
