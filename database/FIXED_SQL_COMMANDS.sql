   -- ============================================
-- FIXED SQL COMMANDS FOR SUPABASE
-- ============================================
-- Run these commands in Supabase SQL Editor
-- They handle existing policies gracefully
-- ============================================

-- 1. Add INSERT policy for profiles table (drops if exists first)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Update trigger function to handle phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

