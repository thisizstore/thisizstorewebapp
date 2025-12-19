-- =====================================================
-- SQL SCRIPT: COMPLETE RLS FIX FOR ADMIN DETECTION
-- =====================================================
-- PENTING: Jalankan SELURUH script ini di Supabase Dashboard > SQL Editor
-- Script ini akan:
-- 1. Menghapus SEMUA policy yang ada pada users_profile
-- 2. Membuat function is_user_admin() dengan SECURITY DEFINER
-- 3. Membuat ulang policy yang benar tanpa infinite recursion
-- 4. Update semua user dengan is_admin=true menjadi admin
-- =====================================================

-- ========== STEP 1: DROP ALL EXISTING POLICIES ==========
-- Hapus semua policy yang mungkin menyebabkan infinite recursion
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users_profile' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users_profile', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- ========== STEP 2: CREATE ADMIN CHECK FUNCTION ==========
-- Function ini menggunakan SECURITY DEFINER untuk bypass RLS
-- sehingga tidak terjadi infinite loop
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users_profile WHERE user_id = check_user_id LIMIT 1),
    false
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO anon;

-- ========== STEP 3: CREATE NEW RLS POLICIES ==========
-- Enable RLS if not already enabled
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- Policy 1: User dapat membaca profile sendiri
CREATE POLICY "users_can_read_own_profile"
  ON public.users_profile
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: User dapat update profile sendiri
CREATE POLICY "users_can_update_own_profile"
  ON public.users_profile
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: User dapat insert profile sendiri
CREATE POLICY "users_can_insert_own_profile"
  ON public.users_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admin dapat membaca SEMUA profile (menggunakan function untuk avoid recursion)
CREATE POLICY "admins_can_read_all_profiles"
  ON public.users_profile
  FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

-- Policy 5: Admin dapat update SEMUA profile
CREATE POLICY "admins_can_update_all_profiles"
  ON public.users_profile
  FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true)
  WITH CHECK (public.is_user_admin(auth.uid()) = true);

-- Policy 6: Admin dapat delete profile
CREATE POLICY "admins_can_delete_profiles"
  ON public.users_profile
  FOR DELETE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

-- ========== STEP 4: SET USER 'IZ' AS ADMIN ==========
UPDATE public.users_profile 
SET is_admin = true 
WHERE LOWER(username) = 'iz';

-- ========== STEP 5: VERIFY RESULTS ==========
-- Tampilkan semua policies yang baru dibuat
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users_profile';

-- Tampilkan semua user dan status admin mereka
SELECT id, username, is_admin, user_id, created_at 
FROM public.users_profile 
ORDER BY is_admin DESC, created_at DESC;

-- =====================================================
-- SETELAH MENJALANKAN SCRIPT INI:
-- 1. Pastikan output menunjukkan 6 policy baru
-- 2. Pastikan user 'iz' memiliki is_admin = true
-- 3. Kembali ke aplikasi dan HARD REFRESH (Ctrl+Shift+R)
-- 4. Login dengan username: iz, password: faiz123
-- 5. Badge ADMIN seharusnya muncul dan menu Admin tersedia
-- =====================================================
