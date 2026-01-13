-- Script ultra seguro para criar usuários na auth.users
-- Senha padrão: Q1w2e3r4#@

-- Primeiro, verificar qual usuário está causando conflito
SELECT id, email, nome_usuario FROM reurb_profiles WHERE id = 'f35e7980-3f92-45fc-a66f-fcefbe4dff8a';

-- Verificar todos os IDs que já existem em ambas as tabelas
SELECT 
    rp.id as perfil_id,
    rp.email,
    au.id as auth_id,
    CASE 
        WHEN rp.id = au.id THEN 'IDs Iguais'
        WHEN rp.id != au.id THEN 'IDs Diferentes'
        WHEN au.id IS NULL THEN 'Sem Auth'
    END as status
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
ORDER BY status, rp.email;

-- Verificar usuários que precisam de auth (sem conflito)
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
WHERE created_at >= NOW() - INTERVAL '1 minute'
AND email_confirmed_at IS NOT NULL;

-- Atualizar IDs APENAS para usuários que NÃO TINHAM auth antes
-- E que têm IDs diferentes dos auth.users
UPDATE reurb_profiles 
SET id = au.auth_id
FROM (
    SELECT 
        rp.email,
        au.id as auth_id,
        rp.id as perfil_id
    FROM reurb_profiles rp
    LEFT JOIN auth.users au ON rp.email = au.email
    WHERE au.id IS NOT NULL
    AND rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
    AND rp.id != au.id  -- Apenas se IDs forem diferentes
) au
WHERE reurb_profiles.email = au.email;

-- Verificar correspondência final
SELECT 
    COUNT(*) as total_perfil,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as com_auth,
    COUNT(CASE WHEN au.id IS NULL THEN 1 END) as sem_auth,
    COUNT(CASE WHEN rp.id = au.id THEN 1 END) as ids_iguais,
    COUNT(CASE WHEN rp.id != au.id AND au.id IS NOT NULL THEN 1 END) as ids_diferentes
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email;

-- Lista de usuários com IDs diferentes (se houver)
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.id as perfil_id,
    au.id as auth_id,
    CASE 
        WHEN rp.id = au.id THEN 'OK'
        ELSE 'Diferente'
    END as status_id
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE au.id IS NOT NULL
AND rp.id != au.id
ORDER BY rp.email;
