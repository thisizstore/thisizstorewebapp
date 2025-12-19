-- =====================================================
-- SQL SCRIPT: ADMIN MANAGEMENT
-- =====================================================
-- Script ini berisi semua yang diperlukan untuk:
-- 1. Setup RLS policies yang benar (jika perlu reset)
-- 2. Menambahkan admin baru
-- 3. Menghapus status admin
-- 4. Melihat daftar admin
-- =====================================================


-- =======================================================
-- BAGIAN A: MENAMBAHKAN ADMIN BARU (SERING DIPAKAI)
-- =======================================================
-- Ganti 'nama_username' dengan username yang ingin dijadikan admin
-- Contoh: UPDATE public.users_profile SET is_admin = true WHERE LOWER(username) = 'budi';

UPDATE public.users_profile 
SET is_admin = true 
WHERE LOWER(username) = 'nama_username';

-- Verifikasi perubahan:
SELECT id, username, is_admin, phone_number, created_at 
FROM public.users_profile 
WHERE LOWER(username) = 'nama_username';


-- =======================================================
-- BAGIAN B: MENGHAPUS STATUS ADMIN
-- =======================================================
-- Ganti 'nama_username' dengan username yang ingin dihapus status adminnya

UPDATE public.users_profile 
SET is_admin = false 
WHERE LOWER(username) = 'nama_username';


-- =======================================================
-- BAGIAN C: MELIHAT SEMUA ADMIN
-- =======================================================

SELECT id, username, is_admin, phone_number, created_at 
FROM public.users_profile 
WHERE is_admin = true
ORDER BY created_at ASC;


-- =======================================================
-- BAGIAN D: MELIHAT SEMUA USER
-- =======================================================

SELECT id, username, is_admin, phone_number, created_at 
FROM public.users_profile 
ORDER BY is_admin DESC, created_at DESC;


-- =======================================================
-- BAGIAN E: RESET RLS POLICIES (JIKA ADA MASALAH)
-- =======================================================
-- HANYA jalankan bagian ini jika ada masalah RLS atau login admin tidak work
-- Copy dari baris "DO $$" sampai baris terakhir

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

-- Create admin check function
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

GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO anon;

-- Enable RLS
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

-- Policy 4: Admin dapat membaca SEMUA profile
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

-- Verify policies created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users_profile';


-- =====================================================
-- CARA PENGGUNAAN:
-- =====================================================
-- 
-- 1. MENAMBAH ADMIN BARU:
--    - Copy BAGIAN A saja
--    - Ganti 'nama_username' dengan username yang diinginkan
--    - Jalankan di Supabase SQL Editor
--    - User tersebut akan langsung menjadi admin setelah login ulang
--
-- 2. MENGHAPUS ADMIN:
--    - Copy BAGIAN B saja
--    - Ganti 'nama_username' dengan username yang diinginkan
--    - Jalankan di Supabase SQL Editor
--
-- 3. CEK DAFTAR ADMIN:
--    - Copy BAGIAN C saja dan jalankan
--
-- 4. CEK SEMUA USER:
--    - Copy BAGIAN D saja dan jalankan
--
-- 5. FIX MASALAH RLS:
--    - Copy SELURUH BAGIAN E dan jalankan
--    - Ini akan reset semua policy dan membuat ulang
--
-- =====================================================
