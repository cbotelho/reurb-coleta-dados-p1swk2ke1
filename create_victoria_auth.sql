-- Script para criar auth para Victoria Reis
-- Única usuária que ainda precisa de auth.users

-- Verificar situação atual da Victoria
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso,
    rp.id as perfil_id,
    au.id as auth_id,
    rp.auth_user_id
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE rp.email = 'victoriareis14@gmail.com';

-- Criar auth user para Victoria
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
    'victoriareis14@gmail.com',
    crypt('Q1w2e3r4#', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'victoriareis14@gmail.com'
);

-- Mapear auth_user_id para Victoria
UPDATE reurb_profiles 
SET auth_user_id = (
    SELECT id FROM auth.users WHERE email = 'victoriareis14@gmail.com'
)
WHERE email = 'victoriareis14@gmail.com';

-- Verificação final
SELECT 
    rp.email,
    rp.nome_usuario,
    rp.grupo_acesso,
    au.id as auth_id,
    rp.auth_user_id,
    CASE 
        WHEN au.id IS NOT NULL THEN '❌ SEM AUTH'
        WHEN rp.auth_user_id IS NOT NULL THEN '✅ PRONTO PARA LOGIN'
        ELSE '⚠️ PROBLEMA'
    END as status_final
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE rp.email IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
ORDER BY rp.email;

-- Status geral final
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN au.id IS NOT NULL AND rp.auth_user_id IS NOT NULL THEN 1 END) = COUNT(*) 
        THEN '🎉 TODOS OS USUÁRIOS ESTÃO PRONTOS PARA LOGIN!'
        ELSE CONCAT('⚠️ Ainda existem ', 
                 COUNT(CASE WHEN au.id IS NULL OR rp.auth_user_id IS NULL THEN 1 END), 
                 ' usuários sem acesso completo')
    END as status_sistema
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com');

-- Estatísticas finais por grupo
SELECT 
    rp.grupo_acesso,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN au.id IS NOT NULL AND rp.auth_user_id IS NOT NULL THEN 1 END) as prontos_login,
    ROUND(
        (COUNT(CASE WHEN au.id IS NOT NULL AND rp.auth_user_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1
    ) as percentual_prontos
FROM reurb_profiles rp
LEFT JOIN auth.users au ON rp.email = au.email
WHERE rp.email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com')
GROUP BY rp.grupo_acesso
ORDER BY total_usuarios DESC;
