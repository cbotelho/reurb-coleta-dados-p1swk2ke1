-- Parte 3: Inserir usuários 31-41

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
-- Usuário 31: Neuriani Santos
(gen_random_uuid(), 'Técnicos Amapá Terra', 'neuriani.santos', 'Neuriani Monte dos', 'Santos', 'nmonte667@gmail.com', 'user_4_1760981484.png', '2026-01-06 08:50:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:31:00'),

-- Usuário 32: Ozi Araujo
(gen_random_uuid(), 'SEHAB', 'ozi.araujo', 'Ozi', 'Araujo', 'oziaraujo20@gmail.com', 'user_26_1762284679.png', '2025-12-09 08:17:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:49:00'),

-- Usuário 33: Quelson Teixeira
(gen_random_uuid(), 'SEHAB', 'quelson.teixeira', 'Quelson', 'Teixeira', 'quelson@gmail.com', NULL, '2026-01-06 09:43:00', 'Ativo', 'Carlos Botelho', '2025-11-13 17:16:00'),

-- Usuário 34: Raphael Farias
(gen_random_uuid(), 'Técnicos Amapá Terra', 'raphael.farias', 'Raphael Neves de', 'Farias', 'raphaelneves250@gmail.com', 'user_5_1760981675.png', '2025-10-21 19:58:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:34:00'),

-- Usuário 35: Raquely Torres
(gen_random_uuid(), 'SEHAB', 'raquely.torres', 'Raquely', 'Torres', 'torresraquely7@gmail.com', NULL, '2025-12-05 11:52:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:46:00'),

-- Usuário 36: Requerente Externo
(gen_random_uuid(), 'Externo', 'Requerente', 'Requerente', 'Externo', 'Requerente@gmail.com', NULL, NULL, 'Ativo', 'Carlos Botelho', '2025-12-07 10:58:00'),

-- Usuário 37: Rosilene Santos
(gen_random_uuid(), 'SEHAB', 'rosilene.santos', 'Rosilene', 'Santos', 'rosyysantosap@gmail.com', NULL, '2025-11-22 00:09:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-14 09:29:00'),

-- Usuário 38: Rosimeire Peretti
(gen_random_uuid(), 'SEHAB', 'rosimeire.peretti', 'Rosimeire', 'Dias de Mendonça', 'Peretti', 'rosedperetti@gmail.com', NULL, '2026-01-07 12:41:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:22:00'),

-- Usuário 39: Samilly Barbosa
(gen_random_uuid(), 'SEHAB', 'samilly.barbosa', 'Samilly', 'Beatriz Dos Santos', 'Barbosa', 'samillysilva2023@gmail.com', NULL, '2025-12-04 12:19:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:44:00'),

-- Usuário 40: Susteno Junior
(gen_random_uuid(), 'Next Ambiente', 'susteno.junior', 'Susteno', 'Junior', 'susteno@gmail.com', NULL, '2025-11-09 09:37:00', 'Ativo', 'Carlos Botelho', '2025-11-07 09:17:00'),

-- Usuário 41: Victoria Carvalho (já existe, apenas atualizar)
(gen_random_uuid(), 'Administrador', 'vitoria.carvalho', 'Victoria Reis', 'Carvalho', 'victoriareis14@gmail.com', 'user_9_1760982220.png', '2026-01-07 13:36:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:43:00');

-- Verificar terceira parte e total
SELECT COUNT(*) as usuarios_inseridos_parte3 FROM reurb_profiles;

-- Verificar total geral
SELECT 
    grupo_acesso,
    COUNT(*) as quantidade
FROM reurb_profiles 
GROUP BY grupo_acesso 
ORDER BY quantidade DESC;
