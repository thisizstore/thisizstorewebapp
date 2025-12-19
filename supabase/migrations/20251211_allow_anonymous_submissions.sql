-- =====================================================
-- SQL SCRIPT: ALLOW ANONYMOUS SUBMISSIONS
-- =====================================================
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- Script ini akan:
-- 1. Mengubah kolom user_id menjadi NULLABLE (opsional)
-- 2. Mengupdate RLS policies agar anonymous users bisa INSERT
-- 3. Tetap mempertahankan fitur login yang sudah ada
-- =====================================================

-- ========== STEP 1: ALTER TABLE - Make user_id NULLABLE ==========
-- Ini memungkinkan user TANPA login untuk submit form

-- Drop foreign key constraint terlebih dahulu
ALTER TABLE public.jasa_posting 
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.jasa_cari 
  ALTER COLUMN user_id DROP NOT NULL;

-- ========== STEP 2: DROP EXISTING INSERT POLICIES ==========
DROP POLICY IF EXISTS "Users can insert postings" ON public.jasa_posting;
DROP POLICY IF EXISTS "Anyone can insert postings" ON public.jasa_posting;
DROP POLICY IF EXISTS "Users can insert cari" ON public.jasa_cari;
DROP POLICY IF EXISTS "Anyone can insert cari" ON public.jasa_cari;

-- ========== STEP 3: CREATE NEW INSERT POLICIES ==========
-- Izinkan SIAPA SAJA (anon dan authenticated) untuk INSERT

CREATE POLICY "Anyone can insert postings"
  ON public.jasa_posting FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can insert cari"
  ON public.jasa_cari FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ========== STEP 4: FIX ADMIN POLICIES (Avoid Recursion) ==========
-- Drop problematic admin policies yang menggunakan subquery
DROP POLICY IF EXISTS "Admins can view all postings" ON public.jasa_posting;
DROP POLICY IF EXISTS "Admins can delete postings" ON public.jasa_posting;
DROP POLICY IF EXISTS "Admins can update postings approval" ON public.jasa_posting;
DROP POLICY IF EXISTS "Admins can update postings" ON public.jasa_posting;
DROP POLICY IF EXISTS "Admins can view all cari" ON public.jasa_cari;
DROP POLICY IF EXISTS "Admins can delete cari" ON public.jasa_cari;
DROP POLICY IF EXISTS "Admins can update cari approval" ON public.jasa_cari;
DROP POLICY IF EXISTS "Admins can update cari" ON public.jasa_cari;

-- Recreate admin policies using is_user_admin function (no recursion)
CREATE POLICY "Admins can view all postings"
  ON public.jasa_posting FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

CREATE POLICY "Admins can delete postings"
  ON public.jasa_posting FOR DELETE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

CREATE POLICY "Admins can update postings"
  ON public.jasa_posting FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

CREATE POLICY "Admins can view all cari"
  ON public.jasa_cari FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

CREATE POLICY "Admins can delete cari"
  ON public.jasa_cari FOR DELETE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

CREATE POLICY "Admins can update cari"
  ON public.jasa_cari FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

-- ========== STEP 5: VERIFY ==========
-- Cek policies yang sudah dibuat
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('jasa_posting', 'jasa_cari')
ORDER BY tablename, cmd;

-- =====================================================
-- SETELAH MENJALANKAN SCRIPT INI:
-- 1. Kembali ke aplikasi dan hard refresh (Ctrl+Shift+R)
-- 2. Logout dari aplikasi
-- 3. Coba submit form Jasa Posting TANPA login
-- 4. Form harus berhasil terkirim
-- =====================================================
