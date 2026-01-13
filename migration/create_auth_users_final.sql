-- Script final para criar usuários na auth.users
-- Senha padrão: Q1w2e3r4#@

-- Verificar usuários existentes na auth.users
SELECT email, id, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- Verificar usuários que precisam de auth
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso,
    CASE 
        WHEN au.id IS NOT NULL THEN 'Auth OK'
        ELSE 'Sem Auth'
    END as status_auth
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE au.id IS NULL
AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
ORDER BY rp.email;

-- Criar usuários apenas para quem não existe na auth.users
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
AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com');

-- Verificar quantos usuários foram criados
SELECT COUNT(*) as novos_usuarios_criados FROM auth.users 
WHERE created_at = NOW() AND email_confirmed_at IS NOT NULL;

-- Atualizar IDs na reurb_profiles APENAS para usuários que não tinham auth antes
UPDATE reurb_profiles 
SET id = (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = reurb_profiles.email
    AND au.email_confirmed_at IS NOT NULL
)
WHERE email IN (
    SELECT rp.email 
    FROM reurb_profiles rp
    LEFT JOIN auth.users au ON rp.email = au.email
    WHERE au.id IS NOT NULL
    AND rp.id != au.id  -- Apenas se o ID for diferente
)
AND email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com');

-- Verificar correspondência final
SELECT 
    COUNT(*) as total_perfil,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth,
    COUNT(CASE WHEN au.id IS NULL THEN 1 END) as sem_auth
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email;

-- Lista final de usuários sem auth (se houver)
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE au.id IS NULL
AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
ORDER BY rp.email;

-- Estatísticas por grupo
SELECT 
    rp.grupo_acesso,
    COUNT(*) as total,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth,
    COUNT(CASE WHEN au.id IS NULL THEN 1 END) as sem_auth
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
GROUP BY rp.grupo_acesso
ORDER BY total DESC;
