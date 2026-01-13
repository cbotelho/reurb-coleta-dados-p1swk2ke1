-- Script para criar usuários na tabela auth.users
-- Senha padrão para todos: Q1w2e3r4#@

-- Importante: Este script deve ser executado por um usuário com permissões de admin

-- Função para criar usuário no auth.users
-- Usaremos a função auth.sign_up do Supabase ou inserção direta na auth.users

-- Opção 1: Inserção direta na auth.users (requer permissões de service_role)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_token_current,
    confirmed_at,
    deleted_at,
    name
) VALUES
-- Usuário 1: Aldimar Lima
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aldimar-lima@hotmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 2: Carlos Junior
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carlosjraugusto3@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 3: Cezar Pinheiro
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'amalemsouza19@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 4: Cleide Santos
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leidesanto77@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 5: Cleonice Magalhães
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cleomaga23@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 6: Cristina Almeida
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'Cristina.jr@hotmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 7: Edir Neto
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eqneto@nextambient.tech', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 8: Edir Next
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'edirnext@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 9: Emanuele Santos
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emanuelesantosbol@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 10: Erasmo Santos
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'erasmocarlosreis20@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 11: Erica Vieira
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'Pv343160@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 12: Fabrícia Pantoja
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fabricia@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 13: Fernanda Saraiva
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fernandasaraiva2525@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 14: Fernanda Souza
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'Prodemarches973@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 15: Gessyca Barreiros
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gessyca.ka@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 16: Ivana Neves
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meninaabencoadaivana@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 17: Ivone Santos
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ivoneserrana@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 18: Janaína Almeida
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'janainasoaresalmeida66@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 19: José Ubirajara
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juniormalvao@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 20: Jussara Amanajás
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jdasilvatavares@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 21: Karla Lobato
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karla-brandao2024@outlook.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 22: Karlla Jesus
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'karllatatianne40@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 23: Luciana Sousa
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'costasousa2017@hotmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 24: Luis Otavio
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'luisotavio@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 25: Manoel Ferreira
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'martinho-ap4@hotmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 26: Marcilene Guimarães
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'macileneguimaraes757@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 27: Marineia Santos
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'neiasantos44.ab@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 28: Michell Cardoso
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'michell.gleison.cardoso@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 29: Naldo Rocha
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'naldo.rocha@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 30: Neuriani Santos
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nmonte667@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 31: Ozi Araujo
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'oziaraujo20@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 32: Quelson Teixeira
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'quelson@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 33: Raphael Farias
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'raphaelneves250@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 34: Raquely Torres
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'torresraquely7@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 35: Requerente Externo
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'Requerente@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 36: Rosilene Santos
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rosyysantosap@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 37: Rosimeire Peretti
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rosedperetti@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 38: Samilly Barbosa
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'samillysilva2023@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

-- Usuário 39: Susteno Junior
(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'susteno@gmail.com', crypt('Q1w2e3r4#', gen_salt('bf')), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{}', '{}', false, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Verificar usuários criados
SELECT COUNT(*) as usuarios_auth_criados FROM auth.users WHERE email_confirmed_at IS NOT NULL;

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

-- Verificar correspondência
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
ORDER BY rp.email;
