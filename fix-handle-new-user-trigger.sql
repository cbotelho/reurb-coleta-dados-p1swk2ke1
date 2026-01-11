-- ============================================================================
-- INVESTIGAR FUNÇÃO handle_new_user() QUE PODE ESTAR CAUSANDO O ERRO
-- ============================================================================

-- 1. VER O CÓDIGO DA FUNÇÃO handle_new_user()
SELECT 
  proname as function_name,
  prosrc as source_code,
  provolatile,
  proisstrict
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. VERIFICAR SE A FUNÇÃO ESTÁ ACESSANDO reurb_profiles
-- Se sim, pode estar tentando inserir na tabela e falhando

-- 3. SOLUÇÃO TEMPORÁRIA: DESABILITAR O TRIGGER
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- 4. RESETAR SENHA DO USUÁRIO EXISTENTE (sem trigger)
UPDATE auth.users
SET 
  encrypted_password = crypt('Reurb1234@', gen_salt('bf')),
  updated_at = NOW(),
  email_confirmed_at = NOW()
WHERE email = 'ivoneserrana@gmail.com';

-- 5. GARANTIR QUE reurb_profiles EXISTE
INSERT INTO public.reurb_profiles (id, nome, email, grupo_acesso)
SELECT 
  id,
  'Ivone Serrana',
  email,
  'Técnicos Amapá Terra'
FROM auth.users
WHERE email = 'ivoneserrana@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
  grupo_acesso = 'Técnicos Amapá Terra',
  nome = 'Ivone Serrana';

-- 6. REABILITAR O TRIGGER
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- 7. VERIFICAR RESULTADO
SELECT 
  au.id,
  au.email,
  au.encrypted_password IS NOT NULL as has_password,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  rp.grupo_acesso,
  rp.nome
FROM auth.users au
LEFT JOIN public.reurb_profiles rp ON rp.id = au.id
WHERE au.email = 'ivoneserrana@gmail.com';

-- ============================================================================
-- SE O ERRO PERSISTIR, A FUNÇÃO handle_new_user() ESTÁ QUEBRADA
-- Precisamos reescrevê-la ou desabilitar permanentemente:
-- ============================================================================

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ou recriar a função corretamente:
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   INSERT INTO public.reurb_profiles (id, email, nome, grupo_acesso)
--   VALUES (
--     NEW.id,
--     NEW.email,
--     COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
--     'Externo'  -- grupo padrão
--   )
--   ON CONFLICT (id) DO NOTHING;
--   RETURN NEW;
-- END;
-- $$;
