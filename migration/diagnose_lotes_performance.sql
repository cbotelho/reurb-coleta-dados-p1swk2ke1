-- Diagnóstico de Lotes Pesados e Índices
-- Data: 14/01/2026

DO $$
DECLARE
    tamanho_tabela_lotes TEXT;
    lotes_com_base64 INTEGER;
    tamanho_medio_linha TEXT;
BEGIN
    SELECT pg_size_pretty(pg_total_relation_size('reurb_properties')) INTO tamanho_tabela_lotes;
    
    -- Verifica se existem imagens Base64 na coluna 'images' (que deve ser JSONB ou Array)
    -- Assumindo que images é um JSONB array e queremos ver se algum elemento tem string gigante
    -- Esta query é aproximada para JSONB
    SELECT COUNT(*) INTO lotes_com_base64
    FROM reurb_properties
    WHERE images::text LIKE '%data:image/%base64%';

    RAISE NOTICE '--- DIAGNÓSTICO DE LOTES ---';
    RAISE NOTICE 'Tamanho Total Tabela reurb_properties: %', tamanho_tabela_lotes;
    RAISE NOTICE 'Lotes com provável Base64: %', lotes_com_base64;
    
    -- Verificar Index
    RAISE NOTICE '--- ÍNDICES EXISTENTES ---';
END $$;

-- Listar índices relevantes
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename IN ('reurb_properties', 'reurb_surveys')
ORDER BY tablename, indexname;
