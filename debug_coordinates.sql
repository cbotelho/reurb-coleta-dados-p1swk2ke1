-- =====================================================
-- Diagnóstico de Latitude/Longitude
-- Verifica se coordenadas estão sendo salvas corretamente
-- =====================================================

-- 1. Verificar lotes com coordenadas
SELECT 
  id,
  name,
  address,
  latitude,
  longitude,
  status,
  created_at,
  updated_at
FROM reurb_properties
WHERE latitude IS NOT NULL OR longitude IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

-- 2. Verificar lotes sem coordenadas
SELECT 
  id,
  name,
  address,
  latitude,
  longitude,
  status,
  created_at,
  updated_at
FROM reurb_properties
WHERE latitude IS NULL AND longitude IS NULL
ORDER BY updated_at DESC
LIMIT 20;

-- 3. Estatísticas de coordenadas
SELECT 
  COUNT(*) as total_lotes,
  COUNT(latitude) as com_latitude,
  COUNT(longitude) as com_longitude,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as com_ambas_coordenadas,
  COUNT(*) FILTER (WHERE latitude IS NULL AND longitude IS NULL) as sem_coordenadas,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) / COUNT(*),
    2
  ) as percentual_com_coordenadas
FROM reurb_properties;

-- 4. Verificar lotes vistoriados sem coordenadas
SELECT 
  p.id,
  p.name,
  p.address,
  p.latitude,
  p.longitude,
  p.status,
  s.survey_date,
  s.applicant_name,
  p.updated_at
FROM reurb_properties p
INNER JOIN reurb_surveys s ON s.property_id = p.id
WHERE p.status = 'surveyed' 
  AND (p.latitude IS NULL OR p.longitude IS NULL)
ORDER BY s.survey_date DESC
LIMIT 20;

-- 5. Últimas atualizações de lotes
SELECT 
  id,
  name,
  address,
  latitude,
  longitude,
  status,
  updated_at,
  created_at
FROM reurb_properties
ORDER BY updated_at DESC
LIMIT 10;

-- 6. Verificar tipo de dados das colunas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reurb_properties' 
  AND column_name IN ('latitude', 'longitude', 'address')
ORDER BY ordinal_position;

-- 7. Teste de INSERT/UPDATE (execute manualmente com valores reais)
-- NOTA: NÃO EXECUTE AUTOMATICAMENTE - apenas para referência

-- Exemplo de update de coordenadas:
/*
UPDATE reurb_properties
SET 
  latitude = -0.0420571,
  longitude = -51.1247705,
  address = 'Rua Teste, 123',
  updated_at = NOW()
WHERE id = 'SEU_ID_AQUI'
RETURNING id, name, latitude, longitude, address;
*/

-- 8. Verificar se há triggers ou rules que possam estar impedindo updates
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'reurb_properties';

-- 9. Verificar políticas RLS que possam estar bloqueando updates
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
WHERE tablename = 'reurb_properties';
