-- Análise simples e segura do banco de dados

-- 1. Listar todas as tabelas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2. Estrutura da tabela reurb_profiles
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'reurb_profiles' AND table_schema = 'public' ORDER BY ordinal_position;

-- 3. Verificar se há campos duplicados na reurb_profiles
SELECT column_name, COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'reurb_profiles' 
    AND table_schema = 'public'
    AND (column_name LIKE '%data%' OR column_name LIKE '%nome%' OR column_name LIKE '%status%' OR column_name LIKE '%role%')
GROUP BY column_name
ORDER BY column_name;

-- 4. Contagem de registros nas principais tabelas
SELECT 'reurb_profiles' as table_name, COUNT(*) as record_count FROM reurb_profiles
UNION ALL
SELECT 'reurb_projects' as table_name, COUNT(*) as record_count FROM reurb_projects
UNION ALL
SELECT 'reurb_quadras' as table_name, COUNT(*) as record_count FROM reurb_quadras
UNION ALL
SELECT 'reurb_properties' as table_name, COUNT(*) as record_count FROM reurb_properties
UNION ALL
SELECT 'reurb_surveys' as table_name, COUNT(*) as record_count FROM reurb_surveys;
