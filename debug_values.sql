-- Script para debugar as linhas problemáticas

-- Verificar estrutura da tabela
SELECT column_name, ordinal_position 
FROM information_schema.columns 
WHERE table_name = 'reurb_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Linha 68 (Gessyca Barreiros) - 11 valores:
-- (gen_random_uuid(), 'SEHAB', 'gessyca.barreiros', 'Gessyca', 'Karinne Picanço', 'Barreiros', 'gessyca.ka@gmail.com', NULL, '2025-11-06 05:34:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:50:00', NOW())

-- Colunas esperadas (10):
-- 1. id
-- 2. grupo_acesso
-- 3. nome_usuario
-- 4. nome
-- 5. sobrenome
-- 6. email
-- 7. foto
-- 8. ultimo_login
-- 9. situacao
-- 10. criado_por
-- 11. created_at
-- 12. updated_at

-- A linha 68 tem 11 valores, deveria ter 12 (incluindo updated_at) ou 10 (sem updated_at)
-- O problema é que estamos inserindo 11 valores mas a lista de colunas tem 10 (sem updated_at)

-- Vamos corrigir removendo um valor ou adicionando updated_at
