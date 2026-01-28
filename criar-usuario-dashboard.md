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


INSERT INTO public.reurb_user_profiles (user_id, full_name, email, role, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'ivoneserrana@gmail.com'),
  'Ivone Serrana',
  'ivoneserrana@gmail.com',
  'Vistoriador',
  true
)
ON CONFLICT (user_id) DO UPDATE 
SET 
  role = 'Vistoriador',
  full_name = 'Ivone Serrana',
  is_active = true;

-- 7. VERIFICAR SE ESTÁ TUDO CORRETO:
-- ============================================================================


SELECT 
  au.id as auth_id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  up.role,
  up.full_name
FROM auth.users au
LEFT JOIN public.reurb_user_profiles up ON up.user_id = au.id
WHERE au.email = 'ivoneserrana@gmail.com';

-- Resultado esperado:
-- email_confirmed: true
-- role: Vistoriador
-- full_name: Ivone Serrana

-- ============================================================================
-- AGORA TENTE FAZER LOGIN:
-- Email: ivoneserrana@gmail.com
-- Senha: Reurb1234@
-- ============================================================================
