-- Script simples para corrigir apenas os campos duplicados da tabela reurb_profiles

-- Primeiro, verificar se há campos duplicados e removê-los
DO $$
BEGIN
    -- Remover campo data_cadastro se existir (duplicado com created_at)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reurb_profiles' 
        AND column_name = 'data_cadastro'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_profiles DROP COLUMN IF EXISTS data_cadastro';
    END IF;
    
    -- Remover campo data_atualizacao se existir (duplicado com updated_at)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reurb_profiles' 
        AND column_name = 'data_atualizacao'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_profiles DROP COLUMN IF EXISTS data_atualizacao';
    END IF;
    
    -- Remover campo username se existir (duplicado com nome_usuario)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reurb_profiles' 
        AND column_name = 'username'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_profiles DROP COLUMN IF EXISTS username';
    END IF;
    
    -- Remover campo full_name se existir (duplicado com nome)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reurb_profiles' 
        AND column_name = 'full_name'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_profiles DROP COLUMN IF EXISTS full_name';
    END IF;
    
    -- Remover campo role se existir (duplicado com grupo_acesso)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reurb_profiles' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_profiles DROP COLUMN IF EXISTS role';
    END IF;
    
    -- Remover campo status se existir (duplicado com situacao)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reurb_profiles' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_profiles DROP COLUMN IF EXISTS status';
    END IF;
END $$;

-- Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reurb_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
