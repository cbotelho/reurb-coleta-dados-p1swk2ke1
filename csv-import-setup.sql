-- ========================================
-- MIGRAÇÃO: FUNÇÃO DE IMPORTAÇÃO CSV
-- ========================================
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Criar função RPC para buscar colunas das tabelas
CREATE OR REPLACE FUNCTION get_table_columns(table_name_input TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT
  FROM information_schema.columns c
  WHERE 
    c.table_name = table_name_input 
    AND c.table_schema = 'public'
    AND c.table_catalog = current_database()
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Conceder permissões para a função
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO service_role;

-- 2.1. Criar função para verificar permissões de importação
CREATE OR REPLACE FUNCTION can_import_csv(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_grupo TEXT;
BEGIN
  -- Buscar o grupo do usuário logado
  SELECT grupo_acesso INTO user_grupo
  FROM reurb_profiles 
  WHERE id = auth.uid();
  
  -- Se não encontrar perfil, negar
  IF user_grupo IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Administradores podem importar qualquer tabela
  IF user_grupo IN ('Administrador', 'Administradores') THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar permissão específica
  IF EXISTS (
    SELECT 1 FROM reurb_user_groups g
    WHERE g.name = user_grupo 
    AND g.permissions::text LIKE '%edit_projects%'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_import_csv(TEXT) TO authenticated;

-- 3. Verificar se as tabelas existem
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('reurb_quadras', 'reurb_properties') 
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 4. Exemplo de estrutura esperada para CSV de Quadras
/*
CSV de Quadras (reurb_quadras):
- name (obrigatório): Nome da quadra
- project_id (obrigatório): ID do projeto (UUID)
- area: Área da quadra
- description: Descrição
- status: Status da quadra
*/

-- 5. Exemplo de estrutura esperada para CSV de Lotes (reurb_properties)
/*
CSV de Lotes (reurb_properties):
- name (obrigatório): Nome do lote/propriedade
- quadra_id (obrigatório): ID da quadra (UUID)
- address: Endereço
- area: Área do lote
- latitude: Latitude decimal
- longitude: Longitude decimal
- status: Status do lote
*/

-- 6. Verificar políticas RLS (se necessário)
/*
-- Se encontrar problemas de permissão, verifique se existem políticas RLS:
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
WHERE tablename IN ('reurb_quadras', 'reurb_properties');

-- E se necessário, adicionar políticas para permitir insert baseado no grupo_acesso:
-- Para usuários Administradores e Administradores
CREATE POLICY "Enable insert for admin users" ON reurb_quadras
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reurb_profiles 
      WHERE id = auth.uid() 
      AND grupo_acesso IN ('Administrador', 'Administradores')
    )
  );

CREATE POLICY "Enable insert for admin users" ON reurb_properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reurb_profiles 
      WHERE id = auth.uid() 
      AND grupo_acesso IN ('Administrador', 'Administradores')
    )
  );

-- Para usuários com permissão de editar projetos
CREATE POLICY "Enable insert for edit_projects users" ON reurb_quadras
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reurb_profiles p
      JOIN reurb_user_groups g ON g.name = p.grupo_acesso
      WHERE p.id = auth.uid() 
      AND g.permissions::text LIKE '%edit_projects%'
    )
  );

CREATE POLICY "Enable insert for edit_projects users" ON reurb_properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reurb_profiles p
      JOIN reurb_user_groups g ON g.name = p.grupo_acesso
      WHERE p.id = auth.uid() 
      AND g.permissions::text LIKE '%edit_projects%'
    )
  );
*/
