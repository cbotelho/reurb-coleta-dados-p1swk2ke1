-- ============================================================================
-- FORÇAR REMOÇÃO DAS POLÍTICAS ANTIGAS CONFLITANTES
-- ============================================================================

-- REMOVER TODAS as políticas antigas da tabela reurb_surveys
DROP POLICY IF EXISTS "Authenticated delete surveys" ON public.reurb_surveys;
DROP POLICY IF EXISTS "Authenticated insert surveys" ON public.reurb_surveys;
DROP POLICY IF EXISTS "Authenticated read access surveys" ON public.reurb_surveys;
DROP POLICY IF EXISTS "Authenticated update surveys" ON public.reurb_surveys;

-- Verificar se foram removidas
SELECT policyname FROM pg_policies 
WHERE tablename = 'reurb_surveys' 
AND policyname LIKE 'Authenticated%';

-- Se ainda existirem, use este comando mais agressivo:
-- DO $$ 
-- DECLARE 
--   pol RECORD;
-- BEGIN
--   FOR pol IN 
--     SELECT policyname FROM pg_policies 
--     WHERE tablename = 'reurb_surveys' 
--     AND policyname LIKE 'Authenticated%'
--   LOOP
--     EXECUTE format('DROP POLICY IF EXISTS %I ON public.reurb_surveys', pol.policyname);
--   END LOOP;
-- END $$;

-- Confirmar que apenas as novas políticas existem:
SELECT policyname, cmd, roles FROM pg_policies 
WHERE tablename = 'reurb_surveys'
ORDER BY policyname;
