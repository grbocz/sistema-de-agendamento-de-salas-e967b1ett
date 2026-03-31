-- 1. Adiciona a coluna password caso o usuário queira armazenar o hash (conforme solicitado na User Story)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Cria ou substitui a função de sincronização em PostgreSQL (Garante o espelhamento imediato e síncrono)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'generico',
    NEW.encrypted_password
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    password = EXCLUDED.password;
  RETURN NEW;
END;
$$;

-- 3. Recria o trigger para garantir que ele esteja ativo na criação de usuários no Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
