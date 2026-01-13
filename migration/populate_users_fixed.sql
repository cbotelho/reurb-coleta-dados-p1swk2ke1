-- Script corrigido para popular a tabela reurb_profiles

-- Limpar registros existentes (exceto admins principais)
DELETE FROM reurb_profiles 
WHERE email NOT IN ('cbotelho.80@urbanus.tec.br', 'victoriareis14@gmail.com');

-- Inserir usuários com estrutura consistente (exatamente 10 valores por linha)
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
(gen_random_uuid(), 'Externo Editar', 'fernanda.souza', 'Fernanda', 'Cardoso Sarges Da Rocha Souza', 'Prodemarches973@gmail.com', NULL, '2025-12-17 06:10:00', 'Ativo', 'Carlos Botelho', '2025-12-11 15:17:00'),

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

-- Usuário 41: Victoria Carvalho (já existe, apenas atualizar)
(gen_random_uuid(), 'Administrador', 'vitoria.carvalho', 'Victoria Reis', 'Carvalho', 'victoriareis14@gmail.com', 'user_9_1760982220.png', '2026-01-07 13:36:00', 'Ativo', 'Carlos Botelho', '2025-10-20 14:43:00');

-- Verificar se os dados foram inseridos corretamente
SELECT 
    grupo_acesso,
    nome_usuario,
    nome,
    sobrenome,
    email,
    situacao,
    criado_por,
    created_at
FROM reurb_profiles 
ORDER BY created_at DESC
LIMIT 10;
