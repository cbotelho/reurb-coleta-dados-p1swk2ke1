-- 🚨 SCRIPT DE EMERGÊNCIA - VERSÃO CORRIGIDA (SEM ALTER TABLE) 🚨
-- Removemos comandos que exigem superuser (DISABLE TRIGGER) para evitar erro 42501
-- Focamos na atualização de dados e permissões públicas

-- 1. Garantir Extensões no Schema Extensions ou Public
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

-- 2. Corrigir Permissões do Schema Public (Essencial para remover erro 500)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Resetar Senhas (Hash: Reurb1234@)
-- REMOVIDO: confirmed_at (coluna gerada em versões recentes do Supabase Auth)
-- MANTIDO: email_confirmed_at para garantir acesso
UPDATE auth.users
SET 
  encrypted_password = '$2a$10$PgISnYnTLni0lTgrmZYmMOr9pn4zA68caMjg.69ZBilQxe7Dx1HGe',
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW(),
  raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE email != 'cbotelho.80@urbanus.tec.br';

-- 4. Criar Perfis Faltantes (Sincronia Auth -> Profile)
INSERT INTO public.reurb_profiles (id, username, full_name, email, grupo_acesso, situacao)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  email,
  'Externo',
  'Ativo'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.reurb_profiles)
ON CONFLICT (id) DO NOTHING;

-- 5. Recarregar Cache
NOTIFY pgrst, 'reload config';
