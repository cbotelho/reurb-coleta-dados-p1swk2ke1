-- Script para limpar documentos pesados (Base64) das vistorias existentes
-- Autor: GitHub Copilot
-- Data: 13/01/2026
-- ATENÇÃO: Execute este script APENAS se você já fez backup das fotos!

DO $$
DECLARE
    qtd_afetados INTEGER;
    tamanho_antes TEXT;
BEGIN
    -- 1. Verificar tamanho antes (apenas para log no console)
    SELECT pg_size_pretty(pg_total_relation_size('reurb_surveys')) INTO tamanho_antes;
    RAISE NOTICE 'Tamanho ANTES da limpeza: %', tamanho_antes;

    -- 2. Limpar a coluna 'documents' (onde as fotos pesadas estão)
    UPDATE reurb_surveys
    SET documents = '[]'::jsonb
    WHERE documents IS NOT NULL 
      AND documents::text != '[]';
    
    GET DIAGNOSTICS qtd_afetados = ROW_COUNT;
    
    RAISE NOTICE 'Limpeza concluída. % registros tiveram os documentos removidos.', qtd_afetados;
END $$;

-- 3. Verificar o tamanho final
SELECT pg_size_pretty(pg_total_relation_size('reurb_surveys')) as tamanho_final;

-- Opcional: Rodar VACUUM FULL para recuperar espaço em disco fisicamente (pode bloquear tabelas em uso)
-- VACUUM FULL reurb_surveys;
