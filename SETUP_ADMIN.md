# Setup Admin User

Untuk membuat akun admin dengan credentials yang Anda minta, ikuti langkah berikut:

## Cara 1: Via Supabase Dashboard (Recommended)

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Buka tab **SQL Editor**
4. Buat query baru dan paste script berikut:

```sql
-- Jalankan kedua query ini secara berurutan

-- 1. Buat user di auth.users melalui Supabase admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@gamestoreapp.local',
  crypt('faizramadhan25', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
);

-- 2. Ambil user_id yang baru dibuat dan update users_profile
INSERT INTO users_profile (
  user_id,
  username,
  phone_number,
  is_admin,
  created_at,
  updated_at
)
SELECT
  id,
  'admin',
  '6283136224221',
  true,
  now(),
  now()
FROM auth.users
WHERE email = 'admin@gamestoreapp.local'
LIMIT 1;
```

5. Click **Run** untuk kedua query

## Cara 2: Menggunakan Form Sign Up Kemudian Update Manual

1. Buka website dan klik Sign Up
2. Isi dengan:
   - Username: `admin`
   - Nomor WhatsApp: `6283136224221`
   - Password: `faizramadhan25`
   - Konfirmasi Password: `faizramadhan25`
3. Login

Kemudian update di Supabase Dashboard → SQL Editor:

```sql
UPDATE users_profile
SET is_admin = true
WHERE username = 'admin';
```

## Login Admin

Setelah setup selesai, gunakan credentials ini untuk login:

- **Username**: `admin`
- **Nomor WhatsApp**: `6283136224221`
- **Password**: `faizramadhan25`

Akan ada badge "ADMIN" di navbar ketika login dengan akun admin.

## Verifikasi

Setelah login sebagai admin, pergi ke halaman **Admin** di navbar untuk verify setup berhasil.
