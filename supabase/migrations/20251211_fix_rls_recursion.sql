-- =====================================================
-- SQL SCRIPT: Fix RLS Infinite Recursion for Admin Check
-- =====================================================
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- Script ini akan:
-- 1. Membuat function is_user_admin() untuk mengecek status admin (bypass RLS)
-- 2. Mengupdate RLS policy agar tidak circular/recursion
-- =====================================================

-- ========== STEP 1: Create Admin Check Function ==========
-- Function ini menggunakan SECURITY DEFINER untuk bypass RLS
-- sehingga tidak terjadi infinite loop saat mengecek is_admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_input uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS inside the function
SET search_path = public
AS $$
DECLARE
  is_admin_result boolean;
BEGIN
  SELECT is_admin INTO is_admin_result
  FROM public.users_profile
  WHERE user_id = user_id_input
  LIMIT 1;
  
  RETURN COALESCE(is_admin_result, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;

-- ========== STEP 2: Drop existing problematic policies ==========
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users_profile;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users_profile;

-- ========== STEP 3: Recreate the admin policy using function ==========
-- Policy ini menggunakan function is_user_admin() yang sudah bypass RLS
-- sehingga tidak terjadi infinite recursion
CREATE POLICY "Admins can read all profiles"
  ON public.users_profile FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()));

-- ========== STEP 4: Verify user 'iz' is admin ==========
-- Update ke admin jika belum
UPDATE public.users_profile 
SET is_admin = true 
WHERE LOWER(username) = 'iz';

-- Verifikasi data
SELECT 
  id, 
  username, 
  is_admin, 
  user_id 
FROM public.users_profile 
WHERE LOWER(username) = 'iz';

-- ========== STEP 5: List all policies on users_profile ==========
-- Uncomment untuk debugging
-- SELECT * FROM pg_policies WHERE tablename = 'users_profile';

-- =====================================================
-- CARA MENJALANKAN:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Copy-paste SELURUH script ini
-- 3. Klik "Run"
-- 4. Pastikan query SELECT terakhir menunjukkan is_admin = true
-- 5. Refresh halaman aplikasi (Ctrl+Shift+R untuk hard refresh)
-- 6. Login lagi dengan username 'iz' dan password 'faiz123'
-- =====================================================
