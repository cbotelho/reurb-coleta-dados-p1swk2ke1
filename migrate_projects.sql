-- Script para migrar dados de projetos_reurban para reurb_projects
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, verificar se as tabelas existem
SELECT 'projetos_reurban' as table_name, COUNT(*) as count FROM projetos_reurban
UNION ALL
SELECT 'reurb_projects' as table_name, COUNT(*) as count FROM reurb_projects;

-- 2. Fazer backup dos dados existentes em reurb_projects (se houver)
CREATE TABLE IF NOT EXISTS reurb_projects_backup AS 
SELECT * FROM reurb_projects;

-- 3. Migrar dados de projetos_reurban para reurb_projects
-- Mapeando os campos corretamente
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
FROM projetos_reurban
WHERE id NOT IN (SELECT id FROM reurb_projects); -- Evitar duplicatas

-- 4. Verificar resultado da migração
SELECT 
    'projetos_reurban (origem)' as tabela,
    COUNT(*) as total_registros
FROM projetos_reurban
UNION ALL
SELECT 
    'reurb_projects (destino)' as tabela,
    COUNT(*) as total_registros
FROM reurb_projects;

-- 5. Verificar se os dados foram migrados corretamente
SELECT 
    'Dados migrados' as status,
    COUNT(*) as quantidade
FROM reurb_projects 
WHERE id IN (SELECT id FROM projetos_reurban);

-- 6. Opcional: Remover tabela antiga após confirmação
-- DESCOMENTE A LINHA ABAIXO APENAS DEPOIS DE VERIFICAR QUE TUDO ESTÁ CORRETO
-- DROP TABLE projetos_reurban;

-- 7. Opcional: Limpar backup após confirmação
-- DESCOMENTE A LINHA ABAIXO APENAS DEPOIS DE VERIFICAR QUE TUDO ESTÁ CORRETO
-- DROP TABLE reurb_projects_backup;
