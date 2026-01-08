-- Script final corrigido para garantir mapeamento completo
-- Resolve todos os usuários sem auth_user_id

-- 1) Verificar quem ainda não está mapeado
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso,
    au.id as auth_id_disponivel
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE rp.auth_user_id IS NULL
  AND au.id IS NOT NULL
ORDER BY rp.grupo_acesso, rp.email;

-- 2) Mapear todos os usuários que têm auth mas não estão mapeados
UPDATE reurb_profiles rp
SET auth_user_id = au.id
FROM auth.users au
WHERE rp.email = au.email
  AND au.id IS NOT NULL
  AND rp.auth_user_id IS NULL;

-- 3) Para usuários sem auth, criar auth users
-- Cria uma temp table para capturar ids e emails recém-criados
CREATE TEMP TABLE temp_new_auth (
  id uuid,
  email text
) ON COMMIT DROP;

-- Inserir novos usuários (sem usar RETURNING ... INTO)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    rp.email,
    crypt('Q1w2e3r4#', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE au.id IS NULL
  AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com');

-- Em seguida, capture os novos registros inseridos (assumindo que email é único)
INSERT INTO temp_new_auth (id, email)
SELECT id, email
FROM auth.users
WHERE email IN (
  SELECT rp.email
  FROM reurb_profiles rp
  LEFT JOIN auth.users au ON rp.email = au.email
  WHERE au.id IS NULL
    AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
);

-- 4) Mapear os recém-criados
UPDATE reurb_profiles rp
SET auth_user_id = tna.id
FROM temp_new_auth tna
WHERE rp.email = tna.email;

-- 5) Verificação final - status completo
SELECT 
    COUNT(*) as total_perfis,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth,
    COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) as com_auth_user_id,
    COUNT(CASE WHEN au.id IS NULL THEN 1 END) as sem_auth,
    COUNT(CASE WHEN rp.auth_user_id IS NULL THEN 1 END) as sem_mapeamento
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email;

-- 6) Status final
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) = COUNT(*) 
        THEN '🎉 TODOS OS USUÁRIOS MAPEADOS COM SUCESSO!'
        ELSE CONCAT('⚠️ AINDA EXISTEM ', 
                 COUNT(CASE WHEN rp.auth_user_id IS NULL THEN 1 END), 
                 ' USUÁRIOS SEM MAPEAMENTO')
    END as status_final
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email;

-- 7) Estatísticas por grupo (final)
SELECT 
    rp.grupo_acesso,
    COUNT(*) as total_perfis,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth_users,
    COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) as com_mapeamento,
    COUNT(CASE WHEN rp.auth_user_id IS NULL THEN 1 END) as sem_mapeamento,
    ROUND(
        (COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as percentual_mapeamento
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
GROUP BY rp.grupo_acesso
ORDER BY total_perfis DESC;

-- 8) Lista final de usuários prontos para login
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso,
    CASE 
        WHEN au.id IS NOT NULL AND rp.auth_user_id IS NOT NULL THEN '✅ PRONTO PARA LOGIN'
        WHEN au.id IS NULL THEN '❌ SEM AUTH'
        ELSE '⚠️ PROBLEMA NO MAPEAMENTO'
    END as status_login
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
ORDER BY status_login DESC, rp.grupo_acesso, rp.email;