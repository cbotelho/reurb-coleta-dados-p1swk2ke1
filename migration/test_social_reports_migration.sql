-- Script para executar a migration de Pareceres Sociais no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se a tabela já existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'reurb_social_reports'
) AS tabela_existe;

-- 2. Se não existir, execute o conteúdo de:
--    supabase/migrations/20260111200000_create_social_reports.sql

-- 3. Após criar, verificar estrutura
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reurb_social_reports'
ORDER BY ordinal_position;

-- 4. Testar função de geração de número de registro
SELECT generate_report_number();

-- 5. Verificar RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reurb_social_reports';

-- 6. Teste básico de insert (substituir IDs reais)
/*
INSERT INTO reurb_social_reports (
    project_id,
    quadra_id,
    property_id,
    parecer,
    nome_assistente_social,
    status
) VALUES (
    'SEU_PROJECT_ID',
    'SEU_QUADRA_ID',
    'SEU_PROPERTY_ID',
    '<p>Parecer de teste</p>',
    'Teste Assistente Social',
    'rascunho'
);
*/

-- 7. Consultar parecer criado
-- SELECT * FROM reurb_social_reports ORDER BY created_at DESC LIMIT 1;
