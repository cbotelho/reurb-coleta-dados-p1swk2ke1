-- ⚠️ SCRIPT PARA RESETAR SENHA DO USUÁRIO
-- Email: ivoneserrana@gmail.com
-- Nova Senha: Reurb1234@
-- Data: 09 de Janeiro de 2026

-- ============================================================================
-- OPÇÃO 1: Usar função nativa do Supabase (RECOMENDADO)
-- ============================================================================
-- Execute esta query no editor SQL do Supabase:

SELECT auth.admin_set_user_password(
  (SELECT id FROM auth.users WHERE email = 'ivoneserrana@gmail.com'),
  'Reurb1234@'
);

-- Verificar se o usuário existe:
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'ivoneserrana@gmail.com';


-- ============================================================================
-- OPÇÃO 2: Atualizar diretamente a coluna encrypted_password
-- ============================================================================
-- Se a OPÇÃO 1 não funcionar, tente:

UPDATE auth.users
SET 
  encrypted_password = crypt('Reurb1234@', gen_salt('bf')),
  updated_at = NOW(),
  last_sign_in_at = NULL
WHERE email = 'ivoneserrana@gmail.com';

-- Confirmar a atualização:
SELECT id, email, updated_at FROM auth.users 
WHERE email = 'ivoneserrana@gmail.com';


-- ============================================================================
-- OPÇÃO 3: Teste de login para validar
-- ============================================================================
-- Após executar uma das opções acima, teste o login com:
-- Email: ivoneserrana@gmail.com
-- Senha: Reurb1234@
-- URL: http://localhost:8080/login ou seu URL de produção

-- Se o login falhar, verifique:
-- 1. Se o email existe na tabela auth.users
-- 2. Se a coluna encrypted_password foi atualizada
-- 3. Se o usuário tem reurb_profiles.grupo_acesso = 'tecnico'
