-- Script para corrigir mapeamento auth_user_id
-- Todos os usuários já têm auth.users, só precisamos conectar

-- 1) Verificar situação atual
SELECT 
    COUNT(*) as total_perfis,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth,
    COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) as com_auth_user_id
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email;

-- 2) Popular auth_user_id para todos que têm auth
UPDATE reurb_profiles rp
SET auth_user_id = au.id
FROM auth.users au
WHERE rp.email = au.email
AND au.id IS NOT NULL
AND rp.auth_user_id IS NULL;

-- 3) Verificar resultado
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso,
    rp.id as perfil_id,
    au.id as auth_id,
    rp.auth_user_id as auth_user_id_mapeado,
    CASE 
        WHEN rp.auth_user_id IS NOT NULL THEN 'Mapeado OK'
        ELSE 'Sem Mapeamento'
    END as status_mapeamento
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
ORDER BY status_mapeamento, rp.email;

-- 4) Estatísticas finais
SELECT 
    rp.grupo_acesso,
    COUNT(*) as total,
    COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) as mapeados,
    COUNT(CASE WHEN rp.auth_user_id IS NULL THEN 1 END) as sem_mapeamento
FROM reurb_profiles rp
GROUP BY rp.grupo_acesso
ORDER BY total DESC;

-- 5) Verificar se todos estão mapeados
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) = COUNT(*) 
        THEN 'TODOS MAPEADOS COM SUCESSO ✓'
        ELSE 'AINDA EXISTEM SEM MAPEAMENTO ⚠️'
    END as status_final
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email;

-- 6) Lista final (se houver problemas)
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE au.id IS NOT NULL
AND rp.auth_user_id IS NULL
ORDER BY rp.email;
