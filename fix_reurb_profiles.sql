-- Script para corrigir a tabela reurb_profiles removendo campos duplicados

-- Primeiro, verificar se a tabela existe e sua estrutura
DO $$
BEGIN
    -- Remover as dependências (constraints) se existirem
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reurb_user_group_membership_user_id_fkey'
        AND table_name = 'reurb_user_group_membership'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_user_group_membership DROP CONSTRAINT reurb_user_group_membership_user_id_fkey';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reurb_audit_processes_user_id_fkey'
        AND table_name = 'reurb_audit_processes'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_audit_processes DROP CONSTRAINT reurb_audit_processes_user_id_fkey';
    END IF;
END $$;

-- Criar uma tabela temporária com a estrutura correta
CREATE TABLE IF NOT EXISTS reurb_profiles_temp AS 
SELECT 
    id,
    grupo_acesso,
    nome_usuario,
    nome,
    sobrenome,
    email,
    foto,
    ultimo_login,
    situacao,
    criado_por,
    created_at,
    updated_at
FROM reurb_profiles;

-- Remover a tabela original com CASCADE para remover dependências
DROP TABLE IF EXISTS reurb_profiles CASCADE;

-- Renomear a tabela temporária para o nome original
ALTER TABLE reurb_profiles_temp RENAME TO reurb_profiles;

-- Garantir que o campo id seja primary key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'PRIMARY KEY'
        AND table_name = 'reurb_profiles'
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_profiles ADD PRIMARY KEY (id)';
    END IF;
END $$;

-- Recriar as chaves estrangeiras se as tabelas existirem
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reurb_user_group_membership'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_user_group_membership 
        ADD CONSTRAINT reurb_user_group_membership_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES reurb_profiles(id) ON DELETE CASCADE';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'reurb_audit_processes'
    ) THEN
        EXECUTE 'ALTER TABLE reurb_audit_processes 
        ADD CONSTRAINT reurb_audit_processes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES reurb_profiles(id) ON DELETE SET NULL';
    END IF;
END $$;

-- Recriar as políticas RLS
ALTER TABLE public.reurb_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.reurb_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.reurb_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.reurb_profiles;

-- Criar novas políticas
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.reurb_profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.reurb_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.reurb_profiles FOR UPDATE USING (auth.uid() = id);

-- Recriar o trigger para atualizar a data de atualização
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_reurb_profiles_modtime ON public.reurb_profiles;

-- Criar trigger para atualizar a data de atualização
CREATE TRIGGER update_reurb_profiles_modtime
BEFORE UPDATE ON public.reurb_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Recriar o trigger para criação automática de perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.reurb_profiles (
    id, 
    nome_usuario,
    nome,
    sobrenome,
    email,
    grupo_acesso,
    situacao,
    created_at
  ) VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    '',
    NEW.email,
    'Externo', -- Grupo de acesso padrão
    'Ativo',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar trigger para novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
