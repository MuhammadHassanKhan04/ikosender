-- Create app_users table for global authentication
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now
-- In a production app, you'd restrict this to authenticated admins
CREATE POLICY "Allow all operations on app_users"
  ON public.app_users
  FOR ALL
  USING (true)
  WITH CHECK (true);
