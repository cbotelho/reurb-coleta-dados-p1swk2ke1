-- RECUPERAÇÃO CORRETA - USANDO CAMPOS CERTOS
-- Baseado na estrutura real das tabelas

-- 1. Verificar situação atual
SELECT 
    'reurb_projects' as tabela,
    COUNT(*) as projetos
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

-- 2. Verificar quadras órfãs (com project_id inválido)
SELECT 
    'QUADRAS ÓRFÃS' as status,
    COUNT(*) as total
FROM reurb_quadras q
WHERE project_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM reurb_projects p 
        WHERE p.id = q.project_id
    );

-- 3. Verificar lotes órfãos (com quadra_id inválido)
SELECT 
    'LOTES ÓRFÃOS' as status,
    COUNT(*) as total
FROM reurb_properties l
WHERE quadra_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM reurb_quadras q 
        WHERE q.id = l.quadra_id
    );

-- 4. Se houver dados em projetos_reurban (backup), migrar agora
-- NOTA: Esta parte só funciona se a tabela ainda existir em algum lugar
DO $$
BEGIN
    -- Verificar se a tabela projetos_reurban existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projetos_reurban'
    ) THEN
        -- Migrar projetos
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
        WHERE id NOT IN (SELECT id FROM reurb_projects);
        
        -- Atualizar quadras para apontar para projetos migrados
        UPDATE reurb_quadras q
        SET project_id = p.id
        FROM projetos_reurban p
        WHERE q.project_id = p.id::text;
        
        RAISE NOTICE 'Dados de projetos_reurban migrados com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela projetos_reurban não encontrada. Dados precisarão ser recriados manualmente.';
    END IF;
END $$;

-- 5. Resultado final
SELECT 
    'RECUPERAÇÃO CONCLUÍDA' as status,
    'Verifique os resultados acima' as mensagem;
