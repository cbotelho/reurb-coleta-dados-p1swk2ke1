-- Parte 1: Inserir usuários 1-15

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

-- Usuário 2: Carlos Botelho (já existe, apenas atualizar)
('13393970-cbeb-4cc0-bee5-4812bafdda9c', 'Administrador', 'carlos.botelho', 'Carlos', 'Botelho', 'cbotelho.80@urbanus.tec.br', 'user_1_1761567503.png', '2026-01-07 17:03:00', 'Ativo', 'Cadastro público', '2025-10-16 00:25:00'),

-- Usuário 3: Carlos Junior
(gen_random_uuid(), 'SEHAB', 'carlos.junior', 'Carlos', 'Junior', 'carlosjraugusto3@gmail.com', 'user_29_1765033393.png', '2026-01-05 12:05:00', 'Ativo', 'Carlos Botelho', '2025-11-04 16:15:00'),

-- Usuário 4: Cezar Pinheiro
(gen_random_uuid(), 'Externo', 'cezar.pinheiro', 'Sylvio Cezar', 'Pinheiro', 'amalemsouza19@gmail.com', NULL, '2025-12-10 13:30:00', 'Ativo', 'Carlos Botelho', '2025-12-08 11:50:00'),

-- Usuário 5: Cleide Santos
(gen_random_uuid(), 'SEHAB', 'cleide.santos', 'Cleide', 'Santos', 'leidesanto77@gmail.com', NULL, '2026-01-07 13:25:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:50:00'),

-- Usuário 6: Cleonice Magalhães
(gen_random_uuid(), 'SEHAB', 'cleonice.magalhaes', 'Cleonice', 'Magalhães', 'cleomaga23@gmail.com', NULL, '2026-01-05 10:16:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:40:00'),

-- Usuário 7: Cristina Almeida
(gen_random_uuid(), 'SEHAB', 'cristina.almeida', 'Cristina', 'Almeida', 'Cristina.jr@hotmail.com', NULL, '2026-01-06 10:52:00', 'Ativo', 'Carlos Botelho', '2025-11-13 17:20:00'),

-- Usuário 8: Edir Neto
(gen_random_uuid(), 'Técnicos Amapá Terra', 'edir.neto', 'Edir Santana Pereira de', 'Queiroz', 'eqneto@nextambient.tech', 'user_10_1760982392.png', '2025-10-21 13:30:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:46:00'),

-- Usuário 9: Edir Next
(gen_random_uuid(), 'Next Ambiente', 'edir.next', 'Edir', 'Next Ambient', 'edirnext@gmail.com', NULL, '2025-11-09 09:24:00', 'Ativo', 'Carlos Botelho', '2025-11-07 09:24:00'),

-- Usuário 10: Emanuele Santos
(gen_random_uuid(), 'SEHAB', 'emanuele.santos', 'Emanuele', 'Oliveira dos Santos', 'emanuelesantosbol@gmail.com', NULL, '2025-12-05 16:24:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:28:00'),

-- Usuário 11: Erasmo Santos
(gen_random_uuid(), 'Técnicos Amapá Terra', 'erasmo.santos', 'Erasmo Carlos', 'Santos', 'erasmocarlosreis20@gmail.com', NULL, '2026-01-05 12:41:00', 'Ativo', 'Victoria Reis Carvalho', '2025-10-31 10:01:00'),

-- Usuário 12: Erica Vieira
(gen_random_uuid(), 'SEHAB', 'erica.vieira', 'Erica', 'Vieira', 'Pv343160@gmail.com', NULL, '2025-11-23 16:39:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 16:58:00'),

-- Usuário 13: Fabrícia Pantoja
(gen_random_uuid(), 'SEHAB', 'fabrícia.pantoja', 'Fabrícia', 'Pantoja', 'fabricia@gmail.com', NULL, '2025-12-05 16:16:00', 'Ativo', 'Carlos Botelho', '2025-11-13 17:10:00'),

-- Usuário 14: Fernanda Saraiva
(gen_random_uuid(), 'SEHAB', 'fernanda.saraiva', 'Fernanda', 'da Cruz Saraiva', 'fernandasaraiva2525@gmail.com', NULL, '2026-01-06 09:22:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:23:00'),

-- Usuário 15: Fernanda Souza
(gen_random_uuid(), 'Externo Editar', 'fernanda.souza', 'Fernanda', 'Cardoso Sarges Da Rocha Souza', 'Prodemarches973@gmail.com', NULL, '2025-12-17 06:10:00', 'Ativo', 'Carlos Botelho', '2025-12-11 15:17:00');

-- Verificar primeira parte
SELECT COUNT(*) as usuarios_inseridos_parte1 FROM reurb_profiles;
