-- Script para testar se a API de usuários está funcionando
-- Verificar dados que serão retornados pela API

-- 1) Verificar estrutura da tabela reurb_profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reurb_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2) Verificar dados de exemplo (primeiros 5 usuários)
SELECT 
    id,
    nome_usuario,
    nome,
    sobrenome,
    email,
    foto,
    grupo_acesso,
    situacao,
    criado_por,
    created_at,
    updated_at
FROM reurb_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 3) Verificar grupos únicos
SELECT DISTINCT grupo_acesso, COUNT(*) as quantidade
FROM reurb_profiles 
WHERE grupo_acesso IS NOT NULL
GROUP BY grupo_acesso 
ORDER BY quantidade DESC;

-- 4) Verificar usuários ativos vs inativos
SELECT 
    situacao,
    COUNT(*) as quantidade
FROM reurb_profiles 
GROUP BY situacao 
ORDER BY quantidade DESC;

-- 5) Verificar se há dados nulos que possam causar problemas
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN nome IS NULL OR nome = '' THEN 1 END) as sem_nome,
    COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as sem_email,
    COUNT(CASE WHEN grupo_acesso IS NULL OR grupo_acesso = '' THEN 1 END) as sem_grupo,
    COUNT(CASE WHEN nome_usuario IS NULL OR nome_usuario = '' THEN 1 END) as sem_username
FROM reurb_profiles;
