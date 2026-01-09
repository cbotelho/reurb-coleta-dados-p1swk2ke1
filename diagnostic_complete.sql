-- DIAGNÓSTICO COMPLETO - O QUE ACONTECEU?
-- Execute para entender a perda de dados

-- 1. Listar TODAS as tabelas do schema public
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name LIKE '%reurb%' THEN 'REURB'
        ELSE 'OUTRA'
    END as categoria
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY 
    CASE 
        WHEN table_name LIKE '%reurb%' THEN 1
        ELSE 2
    END,
    table_name;

-- 2. Verificar contagem exata de cada tabela REURB
SELECT 
    'TABELA' as tipo,
    table_name,
    COALESCE(
        (SELECT COUNT(*)::text FROM information_schema.columns 
         WHERE table_name = t.table_name AND table_schema = 'public'),
        '0 colunas'
    ) as colunas,
    CASE 
        WHEN table_name = 'reurb_projects' THEN (SELECT COUNT(*) FROM reurb_projects)
        WHEN table_name = 'reurb_quadras' THEN (SELECT COUNT(*) FROM reurb_quadras)
        WHEN table_name = 'reurb_properties' THEN (SELECT COUNT(*) FROM reurb_properties)
        WHEN table_name = 'reurb_owners' THEN (SELECT COUNT(*) FROM reurb_owners)
        WHEN table_name = 'reurb_profiles' THEN (SELECT COUNT(*) FROM reurb_profiles)
        ELSE 0
    END as registros
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name LIKE '%reurb%'
ORDER BY table_name;

-- 3. Verificar se há tabelas com nomes similares
SELECT 
    table_name,
    'POSSÍVEL ALTERNATIVA' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (
        table_name LIKE '%projeto%' 
        OR table_name LIKE '%project%'
        OR table_name LIKE '%urban%'
    )
ORDER BY table_name;

-- 4. Verificar logs do Supabase (se disponível)
SELECT 
    'VERIFICAR MANUALMENTE' as instrucao,
    'Dashboard > Settings > Logs' as onde_procurar;

-- 5. Verificar relacionamentos quebrados
SELECT 
    'QUADRAS ÓRFÃS' as status,
    COUNT(*) as total
FROM reurb_quadras q
WHERE parent_item_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM reurb_projects p 
        WHERE p.id = q.parent_item_id
    );

-- 6. Verificar lotes órfãos
SELECT 
    'LOTES ÓRFÃOS' as status,
    COUNT(*) as total
FROM reurb_properties l
WHERE parent_item_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM reurb_quadras q 
        WHERE q.id = l.parent_item_id
    );

-- 7. Sugerir ações de recuperação
SELECT 
    'AÇÃO SUGERIDA' as proximo_passo,
    '1. Verificar se há backup automático' as passo1,
    '2. Restaurar do backup do Supabase' as passo2,
    '3. Recriar dados manualmente' as passo3,
    '4. Entrar em contato com suporte Supabase' as passo4;
