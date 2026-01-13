-- ============================================================================
-- DIAGNÓSTICO: VERIFICAR GRUPOS EXISTENTES
-- ============================================================================

-- 1. Listar TODOS os grupos únicos que existem em reurb_profiles
SELECT DISTINCT grupo_acesso, COUNT(*) as total
FROM public.reurb_profiles
GROUP BY grupo_acesso
ORDER BY total DESC;

-- 2. Verificar o usuário específico
SELECT 
  au.id,
  au.email,
  rp.grupo_acesso,
  rp.nome,
  rp.email as profile_email
FROM auth.users au
LEFT JOIN public.reurb_profiles rp ON rp.id = au.id
WHERE au.email = 'ivoneserrana@gmail.com';

-- 3. Se o usuário NÃO tem perfil, criar com grupo correto
-- (ajuste o grupo_acesso baseado no resultado do item 1)
INSERT INTO public.reurb_profiles (id, nome, email, grupo_acesso)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'nome', email),
  email,
  'tecnico'  -- ⚠️ TROCAR se o grupo for diferente (ex: 'Técnico', 'vistoriador', etc)
FROM auth.users
WHERE email = 'ivoneserrana@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.reurb_profiles WHERE id = auth.users.id
)
RETURNING *;

-- 4. Se o perfil existe mas o grupo está errado, ATUALIZAR:
-- UPDATE public.reurb_profiles
-- SET grupo_acesso = 'tecnico'  -- ⚠️ TROCAR para o grupo correto
-- WHERE email = 'ivoneserrana@gmail.com';

-- 5. ATUALIZAR AS POLÍTICAS RLS COM OS GRUPOS CORRETOS
-- Depois de identificar os grupos, atualize as políticas:

-- Exemplo se o grupo for 'Técnico' (com maiúscula):
-- DROP POLICY IF EXISTS "Técnicos podem visualizar todas surveys" ON public.reurb_surveys;
-- CREATE POLICY "Técnicos podem visualizar todas surveys"
-- ON public.reurb_surveys FOR SELECT TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.reurb_profiles
--     WHERE reurb_profiles.id = auth.uid()
--     AND reurb_profiles.grupo_acesso IN ('Técnico', 'Administrador', 'Administradores', 'Assistente Social', 'gestor', 'analista')
--   )
-- );

-- 6. VERIFICAR SE O ERRO PERSISTE NO LOGIN
-- Se ainda der erro "Database error querying schema", pode ser:
-- a) Problema na tabela auth.users (senha não configurada corretamente)
-- b) Trigger ou função RPC quebrada
-- c) Permissões no schema auth

-- Verificar se o usuário existe em auth.users:
SELECT id, email, encrypted_password IS NOT NULL as has_password, created_at
FROM auth.users
WHERE email = 'ivoneserrana@gmail.com';

-- Se encrypted_password for NULL, resetar a senha:
-- UPDATE auth.users
-- SET encrypted_password = crypt('Reurb1234@', gen_salt('bf'))
-- WHERE email = 'ivoneserrana@gmail.com';
