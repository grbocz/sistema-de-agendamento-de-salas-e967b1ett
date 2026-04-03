-- Adiciona colunas de opções de lanche na tabela de reservas
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS pao_de_queijo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS cookie BOOLEAN NOT NULL DEFAULT FALSE;

-- Cria a tabela de configurações da aplicação
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Habilita o RLS (Row Level Security) na tabela de configurações
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Remove as políticas caso já existam para garantir a idempotência
DROP POLICY IF EXISTS "Settings visible to authenticated" ON public.app_settings;
DROP POLICY IF EXISTS "Master can modify settings" ON public.app_settings;

-- Cria as políticas de segurança
CREATE POLICY "Settings visible to authenticated" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Master can modify settings" ON public.app_settings
  FOR ALL TO authenticated USING (
    EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'master' )
  ) WITH CHECK (
    EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'master' )
  );

-- Insere o valor padrão para a configuração de exibição de opções de lanche
INSERT INTO public.app_settings (key, value)
VALUES ('show_food_options', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
