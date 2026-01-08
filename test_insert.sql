-- Script de teste com apenas 5 usuários para isolar o problema

DELETE FROM reurb_profiles 
WHERE email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com');

INSERT INTO reurb_profiles (
    id,
    grupo_acesso,
    nome_usuario,
    nome,
    sobrenome,
    email,
    foto,
    ultimo_login,
    situacao,
    criado_por,
    created_at
) VALUES
-- Usuário 1: Aldimar Lima
(gen_random_uuid(), 'Externo', 'aldimar.lima', 'Aldimar', 'Lima', 'aldimar-lima@hotmail.com', NULL, '2025-12-09 14:04:00', 'Ativo', 'Carlos Botelho', '2025-12-07 11:47:00'),

-- Usuário 2: Carlos Junior
(gen_random_uuid(), 'SEHAB', 'carlos.junior', 'Carlos', 'Junior', 'carlosjraugusto3@gmail.com', 'user_29_1765033393.png', '2026-01-05 12:05:00', 'Ativo', 'Carlos Botelho', '2025-11-04 16:15:00'),

-- Usuário 3: Cezar Pinheiro
(gen_random_uuid(), 'Externo', 'cezar.pinheiro', 'Sylvio Cezar', 'Pinheiro', 'amalemsouza19@gmail.com', NULL, '2025-12-10 13:30:00', 'Ativo', 'Carlos Botelho', '2025-12-08 11:50:00'),

-- Usuário 4: Cleide Santos
(gen_random_uuid(), 'SEHAB', 'cleide.santos', 'Cleide', 'Santos', 'leidesanto77@gmail.com', NULL, '2026-01-07 13:25:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:50:00'),

-- Usuário 5: Cleonice Magalhães
(gen_random_uuid(), 'SEHAB', 'cleonice.magalhaes', 'Cleonice', 'Magalhães', 'cleomaga23@gmail.com', NULL, '2026-01-05 10:16:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:40:00');

-- Verificar inserção
SELECT COUNT(*) as total_inserido FROM reurb_profiles;
