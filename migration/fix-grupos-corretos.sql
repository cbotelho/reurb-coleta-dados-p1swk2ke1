-- ============================================================================
-- ATUALIZAR POLÍTICAS RLS COM GRUPOS CORRETOS
-- Grupos identificados: Administrador, Técnicos Amapá Terra, SEHAB, Externo, Next Ambiente
-- ============================================================================

-- 1. Atualizar perfil do usuário ivoneserrana@gmail.com
UPDATE public.reurb_profiles
SET grupo_acesso = 'Técnicos Amapá Terra'
WHERE email = 'ivoneserrana@gmail.com';

-- Verificar:
SELECT email, grupo_acesso FROM reurb_profiles WHERE email = 'ivoneserrana@gmail.com';


-- 2. RECRIAR POLÍTICAS RLS COM GRUPOS CORRETOS
-- ============================================================================

-- SELECT (visualização)
DROP POLICY IF EXISTS "Técnicos podem visualizar todas surveys" ON public.reurb_surveys;
CREATE POLICY "Técnicos podem visualizar todas surveys"
ON public.reurb_surveys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
    AND reurb_profiles.grupo_acesso IN (
      'Técnicos Amapá Terra', 
      'Administrador', 
      'SEHAB', 
      'Next Ambiente'
    )
  )
);

-- INSERT (criar vistoria)
DROP POLICY IF EXISTS "Técnicos podem criar surveys" ON public.reurb_surveys;
CREATE POLICY "Técnicos podem criar surveys"
ON public.reurb_surveys
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
    AND reurb_profiles.grupo_acesso IN (
      'Técnicos Amapá Terra',
      'Administrador',
      'SEHAB',
      'Next Ambiente'
    )
  )
);

-- UPDATE (editar vistoria - técnicos só se não tiver análise IA)
DROP POLICY IF EXISTS "Técnicos podem editar suas surveys" ON public.reurb_surveys;
CREATE POLICY "Técnicos podem editar suas surveys"
ON public.reurb_surveys
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
    AND (
      reurb_profiles.grupo_acesso IN ('Administrador', 'SEHAB')
      OR (
        reurb_profiles.grupo_acesso = 'Técnicos Amapá Terra'
        AND reurb_surveys.analise_ia_classificacao IS NULL
      )
    )
  )
);

-- DELETE (apenas admins)
DROP POLICY IF EXISTS "Apenas admins podem excluir surveys" ON public.reurb_surveys;
CREATE POLICY "Apenas admins podem excluir surveys"
ON public.reurb_surveys
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
    AND reurb_profiles.grupo_acesso = 'Administrador'
  )
);


-- 3. VERIFICAR POLÍTICAS DAS OUTRAS TABELAS
-- ============================================================================

-- reurb_properties (lotes)
DROP POLICY IF EXISTS "Técnicos podem visualizar lotes" ON public.reurb_properties;
CREATE POLICY "Técnicos podem visualizar lotes"
ON public.reurb_properties FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
  )
);

-- reurb_quadras
DROP POLICY IF EXISTS "Técnicos podem visualizar quadras" ON public.reurb_quadras;
CREATE POLICY "Técnicos podem visualizar quadras"
ON public.reurb_quadras FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
  )
);

-- reurb_projects
DROP POLICY IF EXISTS "Técnicos podem visualizar projetos" ON public.reurb_projects;
CREATE POLICY "Técnicos podem visualizar projetos"
ON public.reurb_projects FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
  )
);


-- 4. CONFIRMAR POLÍTICAS ATUALIZADAS
-- ============================================================================
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('reurb_surveys', 'reurb_properties', 'reurb_quadras', 'reurb_projects')
ORDER BY tablename, cmd;


-- 5. TESTAR LOGIN
-- ============================================================================
-- Agora tente fazer login com:
-- Email: ivoneserrana@gmail.com
-- Senha: Reurb1234@
