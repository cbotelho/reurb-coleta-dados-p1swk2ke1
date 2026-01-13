-- Script definitivo para criar usuários na auth.users
-- Seguindo as melhores práticas de segurança
-- Senha padrão: Q1w2e3r4#@

-- 1) Verificar perfil específico que está causando conflito
SELECT id, email, nome_usuario FROM reurb_profiles WHERE id = 'f35e7980-3f92-45fc-a66f-fcefbe4dff8a';

-- 2) Verificar correspondência atual entre perfis e auth.users
SELECT 
    rp.id as perfil_id,
    rp.email,
    au.id as auth_id,
    CASE 
        WHEN au.id IS NULL THEN 'Sem Auth'
        WHEN rp.id = au.id THEN 'IDs Iguais'
        ELSE 'IDs Diferentes'
    END as status
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
ORDER BY status, rp.email;

-- 3) Verificar quem precisa de auth
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso,
    rp.id as perfil_id,
    au.id as auth_id
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE au.id IS NULL
AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
ORDER BY rp.email;

-- 4) Adicionar coluna auth_user_id se não existir (OPÇÃO A - RECOMENDADA)
ALTER TABLE reurb_profiles 
ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- 5) Criar usuários em auth.users e capturar IDs gerados
-- Usando CTE para capturar os IDs retornados
WITH new_users AS (
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
        '00000000-0000-0000-0000-000000000000',
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
    AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
    RETURNING id, email
)
-- 6) Popular auth_user_id usando os IDs retornados
UPDATE reurb_profiles rp
SET auth_user_id = nu.id
FROM new_users nu
WHERE rp.email = nu.email;

-- 7) Para usuários que já tinham auth, popular auth_user_id também
UPDATE reurb_profiles rp
SET auth_user_id = au.id
FROM auth.users au
WHERE rp.email = au.email
AND au.id IS NOT NULL
AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com');

-- 8) Verificar quantos usuários foram criados
SELECT COUNT(*) as novos_usuarios_criados 
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '1 minute'
AND email_confirmed_at IS NOT NULL;

-- 9) Verificação final de correspondência
SELECT 
    COUNT(*) as total_perfil,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth,
    COUNT(CASE WHEN au.id IS NULL THEN 1 END) as sem_auth,
    COUNT(CASE WHEN rp.id = au.id THEN 1 END) as ids_iguais,
    COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) as com_auth_user_id
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email;

-- 10) Estatísticas detalhadas por grupo
SELECT 
    rp.grupo_acesso,
    COUNT(*) as total_perfil,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth,
    COUNT(CASE WHEN au.id IS NULL THEN 1 END) as sem_auth,
    COUNT(CASE WHEN rp.auth_user_id IS NOT NULL THEN 1 END) as com_auth_user_id
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
GROUP BY rp.grupo_acesso
ORDER BY total_perfil DESC;

-- 11) Lista de usuários sem auth (se houver)
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE au.id IS NULL
AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
ORDER BY rp.email;

-- 12) Verificar se há IDs conflitantes (para análise)
SELECT 
    rp1.email AS source_email,
    rp1.id AS source_id,
    au.id AS target_auth_id,
    rp2.email AS existing_email_with_target_id,
    rp2.id AS existing_profile_id
FROM reurb_profiles rp1
JOIN auth.users au ON rp1.email = au.email
LEFT JOIN reurb_profiles rp2 ON rp2.id = au.id
WHERE rp1.id != au.id
AND rp2.id IS NOT NULL
AND rp1.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com');
