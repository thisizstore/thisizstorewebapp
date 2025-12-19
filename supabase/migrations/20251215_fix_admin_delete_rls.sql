-- =====================================================
-- SQL SCRIPT: FIX DELETE AND UPDATE RLS POLICIES
-- =====================================================
-- PENTING: Jalankan script ini di Supabase Dashboard > SQL Editor
-- Script ini memperbaiki policy delete dan update untuk admin
-- menggunakan function is_user_admin() untuk menghindari recursion
-- =====================================================

-- ========== STEP 1: DROP OLD POLICIES FOR jasa_posting ==========
DROP POLICY IF EXISTS "Admins can delete postings" ON public.jasa_posting;
DROP POLICY IF EXISTS "Admins can update postings approval" ON public.jasa_posting;
DROP POLICY IF EXISTS "Admins can view all postings" ON public.jasa_posting;

-- ========== STEP 2: DROP OLD POLICIES FOR jasa_cari ==========
DROP POLICY IF EXISTS "Admins can delete cari" ON public.jasa_cari;
DROP POLICY IF EXISTS "Admins can update cari approval" ON public.jasa_cari;
DROP POLICY IF EXISTS "Admins can view all cari" ON public.jasa_cari;

-- ========== STEP 3: CREATE NEW POLICIES for jasa_posting using is_user_admin() ==========

-- Admin can view all postings
CREATE POLICY "admins_can_view_all_postings"
  ON public.jasa_posting
  FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

-- Admin can update any posting (for approval)
CREATE POLICY "admins_can_update_all_postings"
  ON public.jasa_posting
  FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true)
  WITH CHECK (public.is_user_admin(auth.uid()) = true);

-- Admin can delete any posting
CREATE POLICY "admins_can_delete_postings"
  ON public.jasa_posting
  FOR DELETE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

-- ========== STEP 4: CREATE NEW POLICIES for jasa_cari using is_user_admin() ==========

-- Admin can view all cari
CREATE POLICY "admins_can_view_all_cari"
  ON public.jasa_cari
  FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

-- Admin can update any cari (for approval)
CREATE POLICY "admins_can_update_all_cari"
  ON public.jasa_cari
  FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true)
  WITH CHECK (public.is_user_admin(auth.uid()) = true);

-- Admin can delete any cari
CREATE POLICY "admins_can_delete_cari"
  ON public.jasa_cari
  FOR DELETE
  TO authenticated
  USING (public.is_user_admin(auth.uid()) = true);

-- ========== STEP 5: VERIFY RESULTS ==========
-- Show all policies for jasa_posting
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'jasa_posting' AND schemaname = 'public';

-- Show all policies for jasa_cari
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'jasa_cari' AND schemaname = 'public';

-- =====================================================
-- SETELAH MENJALANKAN SCRIPT INI:
-- 1. Pastikan output menunjukkan policy baru dengan prefix "admins_can_"
-- 2. Kembali ke aplikasi dan refresh
-- 3. Login sebagai admin
-- 4. Coba approve dan delete posting - seharusnya berfungsi
-- =====================================================
