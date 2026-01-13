-- ============================================================================
-- DIAGNÓSTICO E CORREÇÃO DE PERMISSÕES RLS PARA TÉCNICOS
-- Erro: "Database error querying schema" + 406 em reurb_surveys
-- ============================================================================

-- 1. VERIFICAR SE O USUÁRIO EXISTE EM auth.users E reurb_profiles
-- ============================================================================
SELECT 
  au.id as user_id,
  au.email,
  au.created_at,
  rp.grupo_acesso,
  rp.nome,
  rp.id as profile_id
FROM auth.users au
LEFT JOIN public.reurb_profiles rp ON rp.id = au.id
WHERE au.email = 'ivoneserrana@gmail.com';

-- Se reurb_profiles não existir, criar:
INSERT INTO public.reurb_profiles (id, nome, email, grupo_acesso)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'nome', email),
  email,
  'tecnico'
FROM auth.users
WHERE email = 'ivoneserrana@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.reurb_profiles WHERE id = auth.users.id
);


-- 2. VERIFICAR POLÍTICAS RLS DA TABELA reurb_surveys
-- ============================================================================
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
WHERE tablename = 'reurb_surveys'
ORDER BY policyname;


-- 3. CRIAR/ATUALIZAR POLÍTICAS RLS PARA reurb_surveys
-- ============================================================================

-- REMOVER POLÍTICAS ANTIGAS GENÉRICAS
DROP POLICY IF EXISTS "Authenticated delete surveys" ON public.reurb_surveys;
DROP POLICY IF EXISTS "Authenticated insert surveys" ON public.reurb_surveys;
DROP POLICY IF EXISTS "Authenticated read access surveys" ON public.reurb_surveys;
DROP POLICY IF EXISTS "Authenticated update surveys" ON public.reurb_surveys;

-- Desabilitar RLS temporariamente (apenas para diagnóstico)
-- ALTER TABLE public.reurb_surveys DISABLE ROW LEVEL SECURITY;

-- Ou criar políticas permissivas:

-- Política para SELECT (visualização)
DROP POLICY IF EXISTS "Técnicos podem visualizar todas surveys" ON public.reurb_surveys;
CREATE POLICY "Técnicos podem visualizar todas surveys"
ON public.reurb_surveys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
    AND reurb_profiles.grupo_acesso IN ('tecnico', 'Administrador', 'Administradores', 'Assistente Social', 'gestor', 'analista')
  )
);

-- Política para INSERT (criar vistoria)
DROP POLICY IF EXISTS "Técnicos podem criar surveys" ON public.reurb_surveys;
CREATE POLICY "Técnicos podem criar surveys"
ON public.reurb_surveys
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
    AND reurb_profiles.grupo_acesso IN ('tecnico', 'Administrador', 'Administradores', 'Assistente Social')
  )
);

-- Política para UPDATE (editar vistoria)
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
      reurb_profiles.grupo_acesso IN ('Administrador', 'Administradores', 'Assistente Social')
      OR (
        reurb_profiles.grupo_acesso = 'tecnico' 
        AND reurb_surveys.analise_ia_classificacao IS NULL
      )
    )
  )
);

-- Política para DELETE (excluir)
DROP POLICY IF EXISTS "Apenas admins podem excluir surveys" ON public.reurb_surveys;
CREATE POLICY "Apenas admins podem excluir surveys"
ON public.reurb_surveys
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
    AND reurb_profiles.grupo_acesso IN ('Administrador', 'Administradores')
  )
);


-- 4. VERIFICAR POLÍTICAS DAS OUTRAS TABELAS RELACIONADAS
-- ============================================================================

-- reurb_properties (lotes)
DROP POLICY IF EXISTS "Técnicos podem visualizar lotes" ON public.reurb_properties;
CREATE POLICY "Técnicos podem visualizar lotes"
ON public.reurb_properties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
  )
);

-- reurb_quadras
DROP POLICY IF EXISTS "Técnicos podem visualizar quadras" ON public.reurb_quadras;
CREATE POLICY "Técnicos podem visualizar quadras"
ON public.reurb_quadras
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
  )
);

-- reurb_projects
DROP POLICY IF EXISTS "Técnicos podem visualizar projetos" ON public.reurb_projects;
CREATE POLICY "Técnicos podem visualizar projetos"
ON public.reurb_projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reurb_profiles
    WHERE reurb_profiles.id = auth.uid()
  )
);


-- 5. TESTE FINAL: VERIFICAR SE O USUÁRIO TEM ACESSO
-- ============================================================================
-- Execute como o usuário técnico após login:
-- SELECT * FROM reurb_surveys LIMIT 1;
-- SELECT * FROM reurb_properties LIMIT 1;
-- SELECT * FROM reurb_quadras LIMIT 1;
-- SELECT * FROM reurb_projects LIMIT 1;


-- 6. SE NADA FUNCIONAR: DESABILITAR RLS TEMPORARIAMENTE
-- ============================================================================
-- ⚠️ USAR APENAS PARA TESTE EM DESENVOLVIMENTO
-- ALTER TABLE public.reurb_surveys DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reurb_properties DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reurb_quadras DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reurb_projects DISABLE ROW LEVEL SECURITY;

-- Para reabilitar depois:
-- ALTER TABLE public.reurb_surveys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reurb_properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reurb_quadras ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reurb_projects ENABLE ROW LEVEL SECURITY;


-- 7. VERIFICAR PERMISSÕES DO SCHEMA PUBLIC
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
