-- RPC Function para buscar colunas de uma tabela
-- Permite que o frontend descubra dinamicamente as colunas disponíveis
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

-- Grant para que authenticated users possam usar
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(TEXT) TO service_role;
