-- Script de migração de dados de reurb_users_profiles (tabela legada/isolada) para reurb_profiles (tabela oficial)
-- Atualizado: 13/01/2026

BEGIN;

-- 1. Verificar se a tabela de origem existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reurb_users_profiles') THEN
        RAISE NOTICE 'A tabela reurb_users_profiles não foi encontrada. Verifique o nome exato.';
    ELSE
        RAISE NOTICE 'Tabela reurb_users_profiles encontrada. Iniciando migração...';
    END IF;
END $$;

-- 2. Inserir dados faltantes na tabela oficial
-- Mapeamento ATUALIZADO com base na estrutura real das tabelas fornecida
INSERT INTO reurb_profiles (
    id,          -- Mapeado de 'user_id' da tabela antiga
    nome,        -- Mapeado de 'full_name' (split parte 1)
    sobrenome,   -- Mapeado de 'full_name' (split parte 2)
    grupo_acesso,-- Mapeado de 'role' (admin, cidadão, etc)
    email,       -- Mapeado de 'email' (se existir) ou null
    created_at,  -- Mapeado de 'created_at'
    updated_at,  -- Mapeado de 'updated_at'
    situacao     -- Mapeado de 'is_active' (true='Ativo', false='Inativo')
)
SELECT 
    user_id as id,
    split_part(full_name, ' ', 1) as nome,
    substring(full_name from position(' ' in full_name)+1) as sobrenome,
    CASE 
        WHEN role = 'admin' THEN 'Administrador'
        WHEN role = 'cidadão' THEN 'Vistoriador' -- Assume Vistoriador como padrão para antigos 'cidadão' (coleta em campo)
        ELSE 'Vistoriador' -- Fallback seguro
    END as grupo_acesso,
    email,
    created_at,
    updated_at,
    CASE 
        WHEN is_active = true THEN 'Ativo'
        ELSE 'Inativo'
    END as situacao
FROM reurb_users_profiles
ON CONFLICT (id) DO NOTHING;


-- NOTA: Alteramos para 'DO NOTHING' para proteger seu usuário existente.
-- Se houver conflito de ID (seu usuário), o script MANTERÁ os dados atuais da reurb_profiles
-- e IGNORARÁ os dados da tabela antiga para esse registro específico.
-- Os outros usuários (que não existem na tabela nova) serão inseridos normalmente.

/* 
-- CASO QUEIRA FORÇAR A ATUALIZAÇÃO (sobrescrever seu usuário com dados antigos), use:
ON CONFLICT (id) DO UPDATE SET
    grupo_acesso = EXCLUDED.grupo_acesso,
    nome_usuario = EXCLUDED.nome_usuario,
    nome = EXCLUDED.nome,
    sobrenome = EXCLUDED.sobrenome,
    email = EXCLUDED.email,
    foto = EXCLUDED.foto,
    ultimo_login = EXCLUDED.ultimo_login,
    situacao = EXCLUDED.situacao,
    updated_at = EXCLUDED.updated_at;
*/

-- 3. Confirmação
DO $$
DECLARE
    count_profiles INTEGER;
BEGIN
    SELECT count(*) INTO count_profiles FROM reurb_profiles;
    RAISE NOTICE 'Migração concluída. Total de usuários em reurb_profiles agora: %', count_profiles;
END $$;

COMMIT;
