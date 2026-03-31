-- Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'generico' CHECK (role IN ('generico', 'master')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 10,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#000000',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configure RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles visible to authenticated" ON public.profiles;
CREATE POLICY "Profiles visible to authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Rooms visible to authenticated" ON public.rooms;
CREATE POLICY "Rooms visible to authenticated" ON public.rooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Master can modify rooms" ON public.rooms;
CREATE POLICY "Master can modify rooms" ON public.rooms FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'master')
);

DROP POLICY IF EXISTS "Reservations visible to authenticated" ON public.reservations;
CREATE POLICY "Reservations visible to authenticated" ON public.reservations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reservations" ON public.reservations;
CREATE POLICY "Users can delete own reservations" ON public.reservations FOR DELETE TO authenticated USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'master')
);

-- Profile creation trigger on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $DO_BLOCK$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'generico'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$DO_BLOCK$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Setup Storage Bucket for room images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-images', 'room-images', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Room images public read" ON storage.objects;
CREATE POLICY "Room images public read" ON storage.objects FOR SELECT USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Authenticated users can upload room images" ON storage.objects;
CREATE POLICY "Authenticated users can upload room images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Authenticated users can update room images" ON storage.objects;
CREATE POLICY "Authenticated users can update room images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Authenticated users can delete room images" ON storage.objects;
CREATE POLICY "Authenticated users can delete room images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'room-images');

-- Seed Data
DO $DO_BLOCK$
DECLARE
  new_user_id uuid;
  room_1_id uuid := gen_random_uuid();
  room_2_id uuid := gen_random_uuid();
BEGIN
  -- Seed Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'grbocuzzi@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id, '00000000-0000-0000-0000-000000000000', 'grbocuzzi@gmail.com',
      crypt('securepassword123', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"name": "Admin Master"}',
      false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
    );
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (new_user_id, 'grbocuzzi@gmail.com', 'Admin Master', 'master')
    ON CONFLICT (id) DO UPDATE SET role = 'master';
  END IF;

  -- Seed Rooms
  IF NOT EXISTS (SELECT 1 FROM public.rooms LIMIT 1) THEN
    INSERT INTO public.rooms (id, name, capacity, description, color, image_url) VALUES 
    (room_1_id, 'Sala São Paulo', 12, 'Sala com projetor e videoconferência', 'hsl(var(--chart-1))', 'https://img.usecurling.com/p/400/400?q=meeting%20room'),
    (room_2_id, 'Sala Rio de Janeiro', 8, 'Sala para reuniões rápidas', 'hsl(var(--chart-2))', 'https://img.usecurling.com/p/400/400?q=conference%20room');
  END IF;
END $DO_BLOCK$;
