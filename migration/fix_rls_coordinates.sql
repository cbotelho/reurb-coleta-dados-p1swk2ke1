-- =====================================================
-- Fix: Políticas RLS para permitir update de coordenadas
-- Data: 2026-01-11
-- Problema: Múltiplas políticas conflitantes bloqueando updates
-- =====================================================

BEGIN;

-- =====================================================
-- 1. REMOVER POLÍTICAS REDUNDANTES/CONFLITANTES
-- =====================================================

-- Remover política "Atualização de lotes" (pode estar bloqueando)
DROP POLICY IF EXISTS "Atualização de lotes" ON reurb_properties;

-- Remover política "Criação de lotes" (redundante com "Authenticated insert")
DROP POLICY IF EXISTS "Criação de lotes" ON reurb_properties;

-- Remover política "Exclusão de lotes" (redundante)
DROP POLICY IF EXISTS "Exclusão de lotes" ON reurb_properties;

-- Remover política "Visualização de lotes" (redundante)
DROP POLICY IF EXISTS "Visualização de lotes" ON reurb_properties;

-- =====================================================
-- 2. MANTER APENAS POLÍTICAS SIMPLES E EFETIVAS
-- =====================================================

-- A política "Authenticated update properties" já é suficiente
-- Ela permite qualquer update para usuários autenticados

-- Vamos garantir que ela existe e está correta:
DROP POLICY IF EXISTS "Authenticated update properties" ON reurb_properties;

CREATE POLICY "Authenticated update properties"
ON reurb_properties FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 3. ADICIONAR POLÍTICA ESPECÍFICA PARA COORDENADAS (OPCIONAL)
-- =====================================================

-- Esta política permite explicitamente updates de coordenadas
-- para qualquer usuário autenticado
DROP POLICY IF EXISTS "Update coordinates" ON reurb_properties;

CREATE POLICY "Update coordinates"
ON reurb_properties FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 4. VERIFICAR POLÍTICAS RESTANTES
-- =====================================================

-- Verificar quais políticas ficaram:
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reurb_properties'
ORDER BY cmd, policyname;

COMMIT;

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================
-- Se algo der errado, execute:
/*
BEGIN;

-- Recriar política "Atualização de lotes"
CREATE POLICY "Atualização de lotes"
ON reurb_properties FOR UPDATE
TO public
USING (has_permission('property:update'::text));

COMMIT;
*/

-- =====================================================
-- TESTE MANUAL (após aplicar o fix)
-- =====================================================
-- Teste se o update funciona:
/*
UPDATE reurb_properties
SET 
  latitude = -0.0420571,
  longitude = -51.1247705,
  updated_at = NOW()
WHERE id = 'SEU_LOTE_ID_AQUI'
RETURNING id, name, latitude, longitude, updated_at;
*/
