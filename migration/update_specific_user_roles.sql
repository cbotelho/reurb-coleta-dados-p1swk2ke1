-- Template para atualizar os grupos dos usuários manualmente
-- Use este script no Editor SQL do Supabase para definir quem é quem.

-- Exemplo: Promover Cleide Santos para Assistente Social
UPDATE reurb_profiles 
SET grupo_acesso = 'Assistente Social' 
WHERE nome ILIKE '%Cleide%' AND sobrenome ILIKE '%Santos%';

-- Exemplo: Promover Alguém para Jurídico
-- UPDATE reurb_profiles SET grupo_acesso = 'Jurídico' WHERE email = 'email@exemplo.com';

-- Exemplo: Promover para Técnico
-- UPDATE reurb_profiles SET grupo_acesso = 'Técnico' WHERE nome ILIKE '%Nome%';

-- Lista de Grupos Válidos (conforme configurado no sistema):
-- 'Administrador'
-- 'Assistente Social'
-- 'Jurídico'
-- 'Técnico'
-- 'Vistoriador'
-- 'Next'

-- Verificar como ficaram os usuários após a atualização:
SELECT nome, sobrenome, email, grupo_acesso FROM reurb_profiles ORDER BY nome;
