-- =====================================================
-- Fix: Limpar dados duplicados e inválidos
-- Data: 2026-01-11
-- Problemas:
-- 1. Vistorias duplicadas para o mesmo lote
-- 2. Lotes com parent_item_id inválido (quad-5, quad-10)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFICAR VISTORIAS DUPLICADAS
-- =====================================================

-- Contar vistorias por lote
SELECT 
  property_id,
  COUNT(*) as total_vistorias,
  MAX(created_at) as ultima_vistoria,
  MIN(created_at) as primeira_vistoria
FROM reurb_surveys
GROUP BY property_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 2. MANTER APENAS A VISTORIA MAIS RECENTE
-- =====================================================

-- Para cada lote com vistorias duplicadas, manter apenas a mais recente
WITH vistorias_duplicadas AS (
  SELECT 
    id,
    property_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY created_at DESC) as rn
  FROM reurb_surveys
)
DELETE FROM reurb_surveys
WHERE id IN (
  SELECT id 
  FROM vistorias_duplicadas 
  WHERE rn > 1
);

-- Verificar quantas foram removidas
SELECT 
  'Vistorias removidas' as acao,
  (SELECT COUNT(*) FROM reurb_surveys) as vistorias_restantes;

-- =====================================================
-- 3. VERIFICAR LOTES COM UUID INVÁLIDO
-- =====================================================

-- Listar lotes com parent_item_id que não é UUID válido
SELECT 
  id,
  name,
  quadra_id::text,
  address,
  created_at,
  LENGTH(quadra_id::text) as tamanho_id
FROM reurb_properties
WHERE quadra_id IS NOT NULL
  AND (
    LENGTH(quadra_id::text) != 36  -- UUID tem 36 caracteres
    OR quadra_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
ORDER BY created_at DESC;

-- =====================================================
-- 4. CORRIGIR LOTES COM UUID INVÁLIDO
-- =====================================================

-- Opção A: Remover lotes com UUID inválido (dados de seed)
-- Descomente se tiver certeza que são dados de teste:
/*
DELETE FROM reurb_properties
WHERE quadra_id IS NOT NULL
  AND (
    LENGTH(quadra_id::text) != 36
    OR quadra_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );
*/

-- Opção B: Definir quadra_id como NULL para lotes órfãos
-- Isso permite que os lotes existam mas sem vínculo com quadra
UPDATE reurb_properties
SET quadra_id = NULL
WHERE quadra_id IS NOT NULL
  AND (
    LENGTH(quadra_id::text) != 36
    OR quadra_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

-- =====================================================
-- 5. VERIFICAR RESULTADO
-- =====================================================

-- Verificar se ainda existem problemas
SELECT 
  'Lotes com UUID válido' as status,
  COUNT(*) as total
FROM reurb_properties
WHERE quadra_id IS NOT NULL
  AND LENGTH(quadra_id::text) = 36;

SELECT 
  'Lotes órfãos' as status,
  COUNT(*) as total
FROM reurb_properties
WHERE quadra_id IS NULL;

SELECT 
  'Vistorias únicas por lote' as status,
  COUNT(DISTINCT property_id) as lotes_com_vistoria
FROM reurb_surveys;

-- =====================================================
-- 6. VERIFICAR LOTE 110 ESPECIFICAMENTE
-- =====================================================

-- Dados do lote 110
SELECT 
  id,
  name,
  address,
  latitude,
  longitude,
  quadra_id,
  status,
  created_at,
  updated_at
FROM reurb_properties
WHERE id = '17cdeaad-df28-4fda-b92b-2b5bd3189bb7';

-- Vistoria do lote 110 (deve ter apenas 1 agora)
SELECT 
  id,
  property_id,
  applicant_name,
  applicant_cpf,
  form_number,
  survey_date,
  created_at,
  updated_at
FROM reurb_surveys
WHERE property_id = '17cdeaad-df28-4fda-b92b-2b5bd3189bb7'
ORDER BY created_at DESC;

COMMIT;

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================
-- ROLLBACK;
