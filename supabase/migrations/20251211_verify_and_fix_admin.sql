-- =====================================================
-- SQL SCRIPT: Verify and Fix Admin User
-- =====================================================
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- Script ini akan:
-- 1. Menampilkan semua data users_profile
-- 2. Memperbarui user 'iz' menjadi admin (jika belum)
-- =====================================================

-- ========== STEP 1: View all user profiles ==========
SELECT 
  id, 
  username, 
  phone_number, 
  is_admin, 
  user_id,
  created_at
FROM users_profile
ORDER BY created_at DESC;

-- ========== STEP 2: Update user 'iz' to admin ==========
-- Jalankan query ini untuk memastikan user 'iz' memiliki is_admin = true
UPDATE users_profile 
SET is_admin = true 
WHERE username = 'iz';

-- ========== STEP 3: Verify the update ==========
SELECT 
  id, 
  username, 
  is_admin, 
  user_id 
FROM users_profile 
WHERE username = 'iz';

-- =====================================================
-- CARA MENJALANKAN:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Copy-paste SELURUH script ini
-- 3. Klik "Run"
-- 4. Lihat hasil query untuk memastikan is_admin = true
-- 5. Refresh halaman aplikasi dan login lagi dengan 'iz'
-- =====================================================
