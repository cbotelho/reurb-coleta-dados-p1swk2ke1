-- Script seguro para criar usuários na auth.users
-- Evita duplicatas e atualiza IDs existentes

-- Senha padrão para todos: Q1w2e3r4#@

-- Primeiro, verificar quais usuários já existem na auth.users
SELECT email, id, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

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
SELECT COUNT(*) as novos_usuarios_criados FROM auth.users WHERE email_confirmed_at = NOW();

-- Atualizar IDs na reurb_profiles para corresponder aos auth.users
UPDATE reurb_profiles 
SET id = (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = reurb_profiles.email
)
WHERE email IN (
    SELECT email FROM auth.users WHERE email_confirmed_at IS NOT NULL
);

-- Verificar correspondência final
SELECT 
    COUNT(*) as total_perfil,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth,
    COUNT(CASE WHEN au.id IS NULL THEN 1 END) as sem_auth
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email;

-- Verificar correspondência atual entre tabelas
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
ORDER BY rp.email;
