-- ============================================================================
-- SOLUÇÃO: CRIAR USUÁRIO PELO SUPABASE DASHBOARD
-- ============================================================================

-- ❌ NÃO É POSSÍVEL modificar auth.users via SQL (falta permissão)
-- ✅ SOLUÇÃO: Usar o Dashboard do Supabase

-- PASSO A PASSO:
-- ============================================================================

-- 1. Vá para o Supabase Dashboard:
--    https://supabase.com/dashboard/project/mbcstctoikcnicmeyjgh

-- 2. Navegue para: Authentication > Users

-- 3. Clique em "Add user" (botão roxo no canto superior direito)

-- 4. Preencha o formulário:
--    Email: ivoneserrana@gmail.com
--    Password: Reurb1234@
--    ✅ Auto Confirm User: MARCAR COMO TRUE/YES
--    
-- 5. Clique em "Create user"

-- 6. DEPOIS que o usuário for criado no dashboard, execute este SQL:
-- ============================================================================

INSERT INTO public.reurb_profiles (id, nome, email, grupo_acesso)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'ivoneserrana@gmail.com'),
  'Ivone Serrana',
  'ivoneserrana@gmail.com',
  'Técnicos Amapá Terra'
)
ON CONFLICT (id) DO UPDATE 
SET 
  grupo_acesso = 'Técnicos Amapá Terra',
  nome = 'Ivone Serrana';

-- 7. VERIFICAR SE ESTÁ TUDO CORRETO:
-- ============================================================================

SELECT 
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  rp.grupo_acesso,
  rp.nome
FROM auth.users au
LEFT JOIN public.reurb_profiles rp ON rp.id = au.id
WHERE au.email = 'ivoneserrana@gmail.com';

-- Resultado esperado:
-- email_confirmed: true
-- grupo_acesso: Técnicos Amapá Terra
-- nome: Ivone Serrana

-- ============================================================================
-- AGORA TENTE FAZER LOGIN:
-- Email: ivoneserrana@gmail.com
-- Senha: Reurb1234@
-- ============================================================================
