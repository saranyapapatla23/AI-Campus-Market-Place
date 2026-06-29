-- Fix the handle_new_user function to include college_name and handle all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, college_name, is_admin, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'college_name', 'Unknown College'),
    FALSE,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate policies for users table
DROP POLICY IF EXISTS insert_own_user ON public.users;
DROP POLICY IF EXISTS insert_own_user_anon ON public.users;

-- Allow authenticated users to insert their own record
CREATE POLICY "insert_own_user" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

-- Allow anon role to insert during signup (the trigger will handle this, but this allows manual inserts too)
CREATE POLICY "insert_own_user_anon" ON public.users 
FOR INSERT TO anon
WITH CHECK (true);