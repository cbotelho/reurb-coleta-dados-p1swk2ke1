-- ============================================================================
-- DIAGNÓSTICO PROFUNDO: ERRO NO LOGIN AUTH
-- "Database error querying schema" em /auth/v1/token
-- ============================================================================

-- 1. VERIFICAR SE O USUÁRIO EXISTE EM auth.users
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as has_password,
  LENGTH(encrypted_password) as password_length,
  email_confirmed_at,
  confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  banned_until,
  deleted_at
FROM auth.users
WHERE email = 'ivoneserrana@gmail.com';

-- 2. SE NÃO EXISTIR, CRIAR O USUÁRIO
-- IMPORTANTE: Use o Supabase Dashboard > Authentication > Add user (manual)
-- Ou execute:
-- INSERT INTO auth.users (
--   id, 
--   email, 
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at
-- ) VALUES (
--   gen_random_uuid(),
--   'ivoneserrana@gmail.com',
--   crypt('Reurb1234@', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- 3. SE EXISTIR MAS encrypted_password FOR NULL, RESETAR:
UPDATE auth.users
SET 
  encrypted_password = crypt('Reurb1234@', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'ivoneserrana@gmail.com'
AND encrypted_password IS NULL;

-- 4. SE encrypted_password EXISTIR MAS LOGIN FALHA, FORÇAR RESET:
UPDATE auth.users
SET 
  encrypted_password = crypt('Reurb1234@', gen_salt('bf')),
  updated_at = NOW(),
  email_confirmed_at = NOW(),
  banned_until = NULL,
  deleted_at = NULL
WHERE email = 'ivoneserrana@gmail.com';

-- Verificar novamente:
SELECT 
  id, 
  email, 
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed,
  banned_until IS NULL as not_banned,
  deleted_at IS NULL as not_deleted
FROM auth.users
WHERE email = 'ivoneserrana@gmail.com';

-- 5. VERIFICAR SE EXISTE reurb_profiles PARA O USUÁRIO
SELECT 
  rp.id,
  rp.email,
  rp.grupo_acesso,
  rp.nome,
  au.email as auth_email
FROM public.reurb_profiles rp
INNER JOIN auth.users au ON au.id = rp.id
WHERE rp.email = 'ivoneserrana@gmail.com' OR au.email = 'ivoneserrana@gmail.com';

-- 6. SE NÃO EXISTIR reurb_profiles, CRIAR:
INSERT INTO public.reurb_profiles (id, nome, email, grupo_acesso)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'nome', 'Ivone Serrana'),
  email,
  'Técnicos Amapá Terra'
FROM auth.users
WHERE email = 'ivoneserrana@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.reurb_profiles WHERE id = auth.users.id
)
RETURNING *;

-- 7. VERIFICAR TRIGGERS NA TABELA auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
ORDER BY trigger_name;

-- 8. SOLUÇÃO ALTERNATIVA: CRIAR USUÁRIO PELO DASHBOARD
-- ============================================================================
-- Se nada funcionar, vá em:
-- Supabase Dashboard > Authentication > Users > Add user (manual)
-- Email: ivoneserrana@gmail.com
-- Password: Reurb1234@
-- Email confirm: YES
-- Auto Confirm User: YES

-- Depois execute:
-- INSERT INTO public.reurb_profiles (id, nome, email, grupo_acesso)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'ivoneserrana@gmail.com'),
--   'Ivone Serrana',
--   'ivoneserrana@gmail.com',
--   'Técnicos Amapá Terra'
-- );
