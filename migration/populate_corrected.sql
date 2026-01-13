-- Script corrigido para popular tabela reurb_profiles
-- Sobrenomes unificados conforme CSV original

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
-- Usuário 16: Gessyca Barreiros
(gen_random_uuid(), 'SEHAB', 'gessyca.barreiros', 'Gessyca', 'Karinne Picanço Barreiros', 'gessyca.ka@gmail.com', NULL, '2025-11-06 05:34:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:50:00'),

-- Usuário 17: Ivana Neves
(gen_random_uuid(), 'SEHAB', 'ivana.neves', 'Ivana', 'Rosa Das Neves', 'meninaabencoadaivana@gmail.com', NULL, '2025-11-23 18:46:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:41:00'),

-- Usuário 18: Ivone Santos
(gen_random_uuid(), 'SEHAB', 'ivone.santos', 'Ivone', 'Silva dos Santos', 'ivoneserrana@gmail.com', NULL, '2025-11-04 16:14:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:37:00'),

-- Usuário 19: Janaína Almeida
(gen_random_uuid(), 'SEHAB', 'janaina.almeida', 'Janaína', 'Almeida', 'janainasoaresalmeida66@gmail.com', 'user_16_1763548185.png', '2026-01-07 13:21:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:35:00'),

-- Usuário 20: José Ubirajara
(gen_random_uuid(), 'Técnicos Amapá Terra', 'jose.ubirajara', 'José Ubirajara Malvão', 'Júnior', 'juniormalvao@gmail.com', 'user_3_1760981257.png', '2025-10-27 09:20:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:27:00'),

-- Usuário 21: Jussara Amanajás
(gen_random_uuid(), 'SEHAB', 'jussara.amanajas', 'Jussara', 'da Silva Tavares Amanajás', 'jdasilvatavares@gmail.com', 'user_22_1762764266.png', '2026-01-05 10:12:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:45:00'),

-- Usuário 22: Karla Lobato
(gen_random_uuid(), 'SEHAB', 'karla.lobato', 'Karla', 'Alencar', 'karla-brandao2024@outlook.com', 'user_14_1767702635.png', '2026-01-07 13:06:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:28:00'),

-- Usuário 23: Karlla Jesus
(gen_random_uuid(), 'Técnicos Amapá Terra', 'karlla.jesus', 'Karlla Tatiane de', 'Jesus', 'karllatatianne40@gmail.com', 'user_6_1760981787.png', NULL, 'Ativo', 'Carlos Botelho', '2025-10-20 14:36:00'),

-- Usuário 24: Luciana Sousa
(gen_random_uuid(), 'SEHAB', 'luciana.sousa', 'Luciana', 'Costa de Sousa', 'costasousa2017@hotmail.com', 'user_17_1767702830.png', '2026-01-06 16:00:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:36:00'),

-- Usuário 25: Luis Otavio
(gen_random_uuid(), 'Next Ambiente', 'luis.otavio', 'Luis', 'Otavio Campo', 'luisotavio@gmail.com', NULL, '2025-11-09 09:10:00', 'Ativo', 'Carlos Botelho', '2025-11-07 09:19:00'),

-- Usuário 26: Manoel Ferreira
(gen_random_uuid(), 'Técnicos Amapá Terra', 'manoel.ferreira', 'Manoel Martinho T.', 'Ferreira', 'martinho-ap4@hotmail.com', 'user_7_1761665345.png', '2026-01-06 11:35:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:38:00'),

-- Usuário 27: Marcilene Guimarães
(gen_random_uuid(), 'SEHAB', 'marcilene.guimaraes', 'Macilene', 'Guimarães', 'macileneguimaraes757@gmail.com', 'user_24_1762297126.png', '2025-12-22 17:31:00', 'Ativo', 'Carlos Reis Carvalho', '2025-11-04 15:46:00'),

-- Usuário 28: Marineia Santos
(gen_random_uuid(), 'SEHAB', 'marineia.santos', 'Marineia', 'da Silva', 'Santos', 'neiasantos44.ab@gmail.com', NULL, '2026-01-05 10:12:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:48:00'),

-- Usuário 29: Michell Cardoso
(gen_random_uuid(), 'Técnicos Amapá Terra', 'michell.cardoso', 'Michell Gleison', 'Sáles Cardoso', 'michell.gleison.cardoso@gmail.com', 'user_8_1761840467.png', '2026-01-06 10:50:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:41:00'),

-- Usuário 30: Naldo Rocha
(gen_random_uuid(), 'Externo', 'naldo.rocha', 'Naldo', 'Rocha', 'naldo.rocha@gmail.com', NULL, '2025-12-15 22:14:00', 'Ativo', 'Carlos Botelho', '2025-12-15 22:09:00'),

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

-- Usuário 41: Victoria Carvalho
(gen_random_uuid(), 'Administrador', 'vitoria.carvalho', 'Victoria Reis', 'Carvalho', 'victoriareis14@gmail.com', 'user_9_1760982220.png', '2026-01-07 13:36:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:43:00');

-- Verificar total inserido
SELECT COUNT(*) as total_usuarios FROM reurb_profiles;

-- Verificar por grupo
SELECT 
    grupo_acesso,
    COUNT(*) as quantidade
FROM reurb_profiles 
GROUP BY grupo_acesso 
ORDER BY quantidade DESC;
