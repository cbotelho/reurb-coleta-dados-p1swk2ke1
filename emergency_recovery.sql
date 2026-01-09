-- SCRIPT DE EMERGÊNCIA - RECUPERAÇÃO DE DADOS
-- Execute IMEDIATAMENTE no Supabase SQL Editor

-- 1. Verificar o que aconteceu com as tabelas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%reurb%'
ORDER BY table_name;

-- 2. Verificar se os dados ainda existem em alguma tabela
SELECT 'projetos_reurban' as tabela, COUNT(*) as total FROM projetos_reurban
UNION ALL
SELECT 'reurb_projects' as tabela, COUNT(*) as total FROM reurb_projects
UNION ALL
SELECT 'reurb_quadras' as tabela, COUNT(*) as total FROM reurb_quadras
UNION ALL
SELECT 'reurb_properties' as tabela, COUNT(*) as total FROM reurb_properties;

-- 3. Se projetos_reurban ainda tiver dados, migrar URGENTE
INSERT INTO reurb_projects (
    id,
    name,
    description,
    latitude,
    longitude,
    image_url,
    created_at,
    updated_at,
    created_by,
    city,
    state,
    status,
    auto_update_map,
    last_map_update,
    tags
)
SELECT 
    id,
    COALESCE(name, 'Projeto ' || id) as name,
    COALESCE(description, '') as description,
    latitude,
    longitude,
    COALESCE(image_url, '') as image_url,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at,
    created_by,
    city,
    state,
    status,
    auto_update_map,
    last_map_update,
    COALESCE(tags, ARRAY[]::text[]) as tags
FROM projetos_reurban;

-- 4. Verificar relacionamentos das quadras
SELECT 
    'quadras_orfas' as status,
    COUNT(*) as total
FROM reurb_quadras q
WHERE NOT EXISTS (
    SELECT 1 FROM projetos_reurban p WHERE p.id = q.parent_item_id
    UNION
    SELECT 1 FROM reurb_projects p WHERE p.id = q.parent_item_id
);

-- 5. Tentar recuperar quadras perdidas
-- Atualizar parent_item_id para apontar para reurb_projects
UPDATE reurb_quadras 
SET parent_item_id = (
    SELECT id FROM reurb_projects 
    WHERE id = (
        SELECT parent_item_id::text FROM reurb_quadras q2 
        WHERE q2.id = reurb_quadras.id 
        LIMIT 1
    )::uuid
)
WHERE parent_item_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM reurb_projects p 
        WHERE p.id = reurb_quadras.parent_item_id
    );

-- 6. Verificar resultado final
SELECT 
    'projetos_reurban' as origem,
    COUNT(*) as projetos_origem
FROM projetos_reurban
UNION ALL
SELECT 
    'reurb_projects' as destino,
    COUNT(*) as projetos_destino
FROM reurb_projects
UNION ALL
SELECT 
    'reurb_quadras' as tabela,
    COUNT(*) as quadras
FROM reurb_quadras
UNION ALL
SELECT 
    'reurb_properties' as tabela,
    COUNT(*) as lotes
FROM reurb_properties;
