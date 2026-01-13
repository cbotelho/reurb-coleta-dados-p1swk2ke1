-- RECUPERAÇÃO COMPLETA A PARTIR DE CSV
-- Execute este script no Supabase SQL Editor após ter os dados do CSV

-- 1. ESTRUTURA ESPERADA DAS TABELAS
-- Baseado na análise anterior dos relacionamentos

-- 2. LIMPEZA DAS TABELAS (se existirem)
TRUNCATE TABLE reurb_projects RESTART IDENTITY CASCADE;
TRUNCATE TABLE reurb_quadras RESTART IDENTITY CASCADE;
TRUNCATE TABLE reurb_properties RESTART IDENTITY CASCADE;

-- 3. INSERT DOS PROJETOS (do CSV)
-- Formato esperado: id,name,description,latitude,longitude,image_url,created_at,updated_at,created_by,city,state,status
-- Exemplo de INSERT para projetos:
INSERT INTO reurb_projects (
    id, name, description, latitude, longitude, image_url, 
    created_at, updated_at, created_by, city, state, status,
    auto_update_map, last_map_update, tags
) VALUES 
(
    'uuid-projeto-1', 
    'Nome do Projeto 1', 
    'Descrição do projeto 1',
    -2.4567, 
    -54.1234,
    'https://exemplo.com/imagem1.jpg',
    '2024-01-01 10:00:00',
    '2024-01-01 10:00:00',
    1,
    'Cidade 1',
    'Estado 1',
    'ativo',
    false,
    '2024-01-01 10:00:00',
    ARRAY['tag1', 'tag2']
),
(
    'uuid-projeto-2', 
    'Nome do Projeto 2', 
    'Descrição do projeto 2',
    -2.7890, 
    -54.5678,
    'https://exemplo.com/imagem2.jpg',
    '2024-01-02 11:00:00',
    '2024-01-02 11:00:00',
    1,
    'Cidade 2',
    'Estado 2',
    'ativo',
    false,
    '2024-01-02 11:00:00',
    ARRAY['tag3', 'tag4']
);

-- 4. INSERT DAS QUADRAS (do CSV)
-- Formato esperado: id,name,area,description,parent_item_id,document_url,sync_status,date_added,date_updated
-- IMPORTANTE: parent_item_id deve apontar para o ID do projeto em reurb_projects
INSERT INTO reurb_quadras (
    id, name, area, description, parent_item_id, document_url,
    sync_status, date_added, date_updated
) VALUES 
(
    'uuid-quadra-1',
    'Quadra A',
    '10000',
    'Descrição da quadra A',
    'uuid-projeto-1',  -- Relacionamento correto
    'https://exemplo.com/quadra1.pdf',
    'synchronized',
    1704067200000,
    1704067200000
),
(
    'uuid-quadra-2',
    'Quadra B',
    '15000',
    'Descrição da quadra B',
    'uuid-projeto-1',
    'https://exemplo.com/quadra2.pdf',
    'synchronized',
    1704067200000,
    1704067200000
);

-- 5. INSERT DOS LOTES (do CSV)
-- Formato esperado: id,local_id,sync_status,date_added,date_updated,name,address,area,description,images,latitude,longitude,parent_item_id,status
-- IMPORTANTE: parent_item_id deve apontar para o ID da quadra em reurb_quadras
INSERT INTO reurb_properties (
    id, local_id, sync_status, date_added, date_updated,
    name, address, area, description, images,
    latitude, longitude, parent_item_id, status
) VALUES 
(
    'uuid-lote-1',
    'local-lote-1',
    'synchronized',
    1704067200000,
    1704067200000,
    'Lote 1',
    'Endereço do Lote 1',
    '500',
    'Descrição do lote 1',
    ARRAY['https://exemplo.com/lote1-1.jpg', 'https://exemplo.com/lote1-2.jpg'],
    -2.4567,
    -54.1234,
    'uuid-quadra-1',  -- Relacionamento correto
    'not_surveyed'
),
(
    'uuid-lote-2',
    'local-lote-2',
    'synchronized',
    1704067200000,
    1704067200000,
    'Lote 2',
    'Endereço do Lote 2',
    '600',
    'Descrição do lote 2',
    ARRAY['https://exemplo.com/lote2-1.jpg'],
    -2.4567,
    -54.1234,
    'uuid-quadra-1',
    'not_surveyed'
);

-- 6. VERIFICAÇÃO FINAL
SELECT 
    'PROJETOS RESTAURADOS' as status,
    COUNT(*) as total
FROM reurb_projects
UNION ALL
SELECT 
    'QUADRAS RESTAURADAS' as status,
    COUNT(*) as total
FROM reurb_quadras
UNION ALL
SELECT 
    'LOTES RESTAURADOS' as status,
    COUNT(*) as total
FROM reurb_properties;

-- 7. VERIFICAÇÃO DE RELACIONAMENTOS
SELECT 
    'RELACIONAMENTO PROJETO-QUADRA' as tipo,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) > 0 THEN 'OK'
        ELSE 'ERRO'
    END as status
FROM reurb_quadras q
JOIN reurb_projects p ON q.parent_item_id = p.id
UNION ALL
SELECT 
    'RELACIONAMENTO QUADRA-LOTE' as tipo,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(*) > 0 THEN 'OK'
        ELSE 'ERRO'
    END as status
FROM reurb_properties l
JOIN reurb_quadras q ON l.parent_item_id = q.id;

-- 8. INSTRUÇÕES FINAIS
SELECT 
    'RECUPERAÇÃO CONCLUÍDA' as status,
    'Substitua os VALUES com seus dados reais do CSV' as instrucao,
    'Verifique os relacionamentos antes de executar' as aviso;
