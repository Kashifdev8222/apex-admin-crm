-- Fix admin login password for staff_users
-- Paste in Supabase → SQL Editor → Run
-- Email: admin@apex.ai
-- Password: Admin@12345

UPDATE public.staff_users
SET
  password_hash = '$2b$10$J3AveI2gP7A9d3sbiCv8keOBc4DiLlcL4.RjFORhrj08h.Kee4Gsu',
  updated_at = now()
WHERE email = 'admin@apex.ai';
