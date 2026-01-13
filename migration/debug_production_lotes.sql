-- =====================================================
-- Debug: Verificar status dos lotes em produção
-- Data: 2026-01-11
-- Problema: 10 lotes pendentes em produção, mas vistorias não carregam dados
-- =====================================================

-- 1. Contar lotes totais no Supabase
SELECT 
  COUNT(*) as total_lotes,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as com_coordenadas,
  COUNT(CASE WHEN status = 'surveyed' THEN 1 END) as vistoriados
FROM reurb_properties;

-- 2. Listar últimos 20 lotes criados/atualizados
SELECT 
  id,
  name,
  address,
  latitude,
  longitude,
  status,
  created_at,
  updated_at,
  quadra_id
FROM reurb_properties
ORDER BY updated_at DESC
LIMIT 20;

-- 3. Verificar se existem lotes sem quadra (órfãos)
SELECT 
  COUNT(*) as lotes_orfaos
FROM reurb_properties
WHERE quadra_id IS NULL;

-- 4. Listar lotes órfãos (se existirem)
SELECT 
  id,
  name,
  address,
  status,
  created_at
FROM reurb_properties
WHERE quadra_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar vistorias sem lote correspondente
SELECT 
  COUNT(*) as vistorias_sem_lote
FROM reurb_surveys s
WHERE NOT EXISTS (
  SELECT 1 
  FROM reurb_properties p 
  WHERE p.id = s.property_id
);

-- 6. Listar vistorias órfãs (se existirem)
SELECT 
  s.id,
  s.property_id,
  s.applicant_name,
  s.survey_date,
  s.created_at
FROM reurb_surveys s
WHERE NOT EXISTS (
  SELECT 1 
  FROM reurb_properties p 
  WHERE p.id = s.property_id
)
ORDER BY s.created_at DESC
LIMIT 10;

-- 7. Verificar se há lotes de um usuário específico (se souber o user_id)
-- Descomente e substitua 'USER_ID_AQUI' pelo ID do usuário
/*
SELECT 
  COUNT(*) as lotes_do_usuario
FROM reurb_properties
WHERE created_by = 'USER_ID_AQUI';
*/

-- 8. Verificar últimas atualizações de coordenadas
SELECT 
  id,
  name,
  latitude,
  longitude,
  updated_at
FROM reurb_properties
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 9. Verificar estrutura de quadras e projetos
SELECT 
  pr.name as projeto,
  pr.id as projeto_id,
  COUNT(DISTINCT q.id) as total_quadras,
  COUNT(l.id) as total_lotes
FROM reurb_projects pr
LEFT JOIN reurb_quadras q ON q.project_id = pr.id
LEFT JOIN reurb_properties l ON l.quadra_id = q.id
GROUP BY pr.id, pr.name
ORDER BY pr.updated_at DESC;

-- 10. Buscar lotes por projeto específico (se souber o nome)
-- Descomente e substitua 'NOME_PROJETO' pelo nome do projeto
/*
SELECT 
  l.id,
  l.name as lote,
  l.address,
  l.status,
  l.latitude,
  l.longitude,
  q.name as quadra,
  pr.name as projeto
FROM reurb_properties l
JOIN reurb_quadras q ON q.id = l.quadra_id
JOIN reurb_projects pr ON pr.id = q.project_id
WHERE pr.name ILIKE '%NOME_PROJETO%'
ORDER BY l.name;
*/
