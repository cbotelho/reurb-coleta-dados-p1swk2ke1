-- Parte 2: Inserir usuários 16-30

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
(gen_random_uuid(), 'SEHAB', 'gessyca.barreiros', 'Gessyca', 'Karinne Picanço', 'Barreiros', 'gessyca.ka@gmail.com', NULL, '2025-11-06 05:34:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:50:00'),

-- Usuário 17: Ivana Neves
(gen_random_uuid(), 'SEHAB', 'ivana.neves', 'Ivana', 'Rosa Das', 'Neves', 'meninaabencoadaivana@gmail.com', NULL, '2025-11-23 18:46:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:41:00'),

-- Usuário 18: Ivone Santos
(gen_random_uuid(), 'SEHAB', 'ivone.santos', 'Ivone', 'Silva dos', 'Santos', 'ivoneserrana@gmail.com', NULL, '2025-11-04 16:14:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:37:00'),

-- Usuário 19: Janaína Almeida
(gen_random_uuid(), 'SEHAB', 'janaina.almeida', 'Janaína', 'Almeida', 'janainasoaresalmeida66@gmail.com', 'user_16_1763548185.png', '2026-01-07 13:21:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:35:00'),

-- Usuário 20: José Ubirajara
(gen_random_uuid(), 'Técnicos Amapá Terra', 'jose.ubirajara', 'José Ubirajara', 'Malão Júnior', 'Juniormalvao@gmail.com', 'user_3_1760981257.png', '2025-10-27 09:20:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:27:00'),

-- Usuário 21: Jussara Amanajás
(gen_random_uuid(), 'SEHAB', 'jussara.amanajas', 'Jussara', 'da Silva Tavares', 'Amanajás', 'jdasilvatavares@gmail.com', 'user_22_1762764266.png', '2026-01-05 10:12:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:45:00'),

-- Usuário 22: Karla Lobato
(gen_random_uuid(), 'SEHAB', 'karla.lobato', 'Karla', 'Alencar', 'karla-brandao2024@outlook.com', 'user_14_1767702635.png', '2026-01-07 13:06:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:28:00'),

-- Usuário 23: Karlla Jesus
(gen_random_uuid(), 'Técnicos Amapá Terra', 'karlla.jesus', 'Karlla Tatiane de', 'Jesus', 'karllatatianne40@gmail.com', 'user_6_1760981787.png', NULL, 'Ativo', 'Carlos Botelho', '2025-10-20 14:36:00'),

-- Usuário 24: Luciana Sousa
(gen_random_uuid(), 'SEHAB', 'luciana.sousa', 'Luciana', 'Costa de', 'Sousa', 'costasousa2017@hotmail.com', 'user_17_1767702830.png', '2026-01-06 16:00:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 15:36:00'),

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
(gen_random_uuid(), 'Externo', 'naldo.rocha', 'Naldo', 'Rocha', 'naldo.rocha@gmail.com', NULL, '2025-12-15 22:14:00', 'Ativo', 'Carlos Botelho', '2025-12-15 22:09:00');

-- Verificar segunda parte
SELECT COUNT(*) as usuarios_inseridos_parte2 FROM reurb_profiles;
