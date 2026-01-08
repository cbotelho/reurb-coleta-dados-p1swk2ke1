-- Script para contar valores em cada linha do INSERT

-- Este script ajuda a identificar qual linha tem número incorreto de valores

-- Linha 55 (Erica Vieira): 
-- (gen_random_uuid(), 'SEHAB', 'erica.vieira', 'Erica', 'Vieira', 'Pv343160@gmail.com', NULL, '2025-11-23 16:39:00', 'Ativo', 'Victoria Reis Carvalho', '2025-11-04 16:58:00')
-- Valores: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 = 10 ✓

-- Linha 58 (Fabrícia Pantoja):
-- (gen_random_uuid(), 'SEHAB', 'fabrícia.pantoja', 'Fabrícia', 'Pantoja', 'fabricia@gmail.com', NULL, '2025-12-05 16:16:00', 'Ativo', 'Carlos Botelho', '2025-11-13 17:10:00')
-- Valores: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 = 10 ✓

-- Linha 61 (Fernanda Saraiva):
-- (gen_random_uuid(), 'SEHAB', 'fernanda.saraiva', 'Fernanda', 'da Cruz Saraiva', 'fernandasaraiva2525@gmail.com', NULL, '2026-01-06 09:22:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:23:00')
-- Valores: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 = 10 ✓

-- Linha 64 (Fernanda Souza):
-- (gen_random_uuid(), 'Externo Editar', 'fernanda.souza', 'Fernanda', 'Cardoso Sarges Da Rocha Souza', 'Prodemarches973@gmail.com', NULL, '2025-12-17 06:10:00', 'Ativo', 'Carlos Botelho', '2025-12-11 15:17:00')
-- Valores: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 = 10 ✓

-- Linha 67 (Gessyca Barreiros):
-- (gen_random_uuid(), 'SEHAB', 'gessyca.barreiros', 'Gessyca', 'Karinne Picanço', 'Barreiros', 'gessyca.ka@gmail.com', NULL, '2025-11-06 05:34:00', 'Ativo', 'Carlos Botelho', '2025-11-04 15:50:00')
-- Valores: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 = 10 ✓

-- Todas as linhas parecem ter 10 valores.
-- O erro pode estar em outra parte do script ou em caracteres invisíveis.

-- Vamos executar um teste simples para isolar o problema:
