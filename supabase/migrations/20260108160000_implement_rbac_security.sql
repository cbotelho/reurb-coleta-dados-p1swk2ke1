-- Migração para implementar RBAC (Role-Based Access Control) e melhorar a segurança
-- Data: 08/01/2026

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS reurb_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    cpf TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'tecnico',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'gestor', 'tecnico', 'analista', 'cidadão'))
);

-- Tabela de permissões
CREATE TABLE reurb_permissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de associação entre funções e permissões
CREATE TABLE reurb_role_permissions (
    role TEXT NOT NULL,
    permission_id INTEGER NOT NULL REFERENCES reurb_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role, permission_id)
);

-- Inserir permissões básicas
INSERT INTO reurb_permissions (name, description) VALUES
    ('project:create', 'Criar novos projetos'),
    ('project:read', 'Visualizar projetos'),
    ('project:update', 'Atualizar projetos'),
    ('project:delete', 'Excluir projetos'),
    ('property:create', 'Criar lotes'),
    ('property:read', 'Visualizar lotes'),
    ('property:update', 'Atualizar lotes'),
    ('property:delete', 'Excluir lotes'),
    ('document:upload', 'Enviar documentos'),
    ('document:validate', 'Validar documentos'),
    ('process:manage', 'Gerenciar processos'),
    ('report:generate', 'Gerar relatórios'),
    ('user:manage', 'Gerenciar usuários'),
    ('settings:manage', 'Gerenciar configurações');

-- Atribuir permissões às funções
-- Administrador tem todas as permissões
INSERT INTO reurb_role_permissions (role, permission_id)
SELECT 'admin', id FROM reurb_permissions;

-- Gestor tem a maioria das permissões, exceto gerenciamento de usuários
INSERT INTO reurb_role_permissions (role, permission_id)
SELECT 'gestor', id FROM reurb_permissions
WHERE name NOT IN ('user:manage');

-- Técnico tem permissões básicas
INSERT INTO reurb_role_permissions (role, permission_id)
SELECT 'tecnico', id FROM reurb_permissions
WHERE name IN (
    'project:read', 'property:read', 'document:upload',
    'process:manage', 'report:generate'
);

-- Analista tem permissões de análise
INSERT INTO reurb_role_permissions (role, permission_id)
SELECT 'analista', id FROM reurb_permissions
WHERE name IN (
    'project:read', 'property:read', 'document:validate',
    'process:manage', 'report:generate'
);

-- Cidadão tem permissões limitadas
INSERT INTO reurb_role_permissions (role, permission_id)
SELECT 'cidadão', id FROM reurb_permissions
WHERE name IN ('project:read', 'document:upload');

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    has_perm BOOLEAN;
BEGIN
    -- Se for super admin, tem todas as permissões
    IF auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'supabase_admin') THEN
        RETURN TRUE;
    END IF;
    
    -- Obtém o papel do usuário
    SELECT role INTO user_role
    FROM reurb_user_profiles
    WHERE user_id = auth.uid();
    
    -- Se não encontrou o perfil, nega acesso
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica se a permissão existe para o papel do usuário
    SELECT EXISTS (
        SELECT 1
        FROM reurb_role_permissions rp
        JOIN reurb_permissions p ON rp.permission_id = p.id
        WHERE rp.role = user_role AND p.name = permission_name
    ) INTO has_perm;
    
    RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar políticas RLS existentes para usar o novo sistema de permissões
-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem ver documentos" ON reurb_documentos;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios documentos" ON reurb_documentos;
DROP POLICY IF EXISTS "Usuários autenticados podem ver processos" ON reurb_processos;
DROP POLICY IF EXISTS "Responsáveis podem gerenciar processos" ON reurb_processos;
DROP POLICY IF EXISTS "Usuários autenticados podem ver laudos" ON reurb_laudos;
DROP POLICY IF EXISTS "Responsáveis podem gerenciar laudos" ON reurb_laudos;

-- Novas políticas para reurb_projects
CREATE POLICY "Visualização de projetos"
    ON reurb_projects FOR SELECT
    USING (has_permission('project:read'));

CREATE POLICY "Criação de projetos"
    ON reurb_projects FOR INSERT
    WITH CHECK (has_permission('project:create'));

CREATE POLICY "Atualização de projetos"
    ON reurb_projects FOR UPDATE
    USING (has_permission('project:update'));

CREATE POLICY "Exclusão de projetos"
    ON reurb_projects FOR DELETE
    USING (has_permission('project:delete'));

-- Novas políticas para reurb_properties
CREATE POLICY "Visualização de lotes"
    ON reurb_properties FOR SELECT
    USING (has_permission('property:read'));

CREATE POLICY "Criação de lotes"
    ON reurb_properties FOR INSERT
    WITH CHECK (has_permission('property:create'));

CREATE POLICY "Atualização de lotes"
    ON reurb_properties FOR UPDATE
    USING (has_permission('property:update'));

CREATE POLICY "Exclusão de lotes"
    ON reurb_properties FOR DELETE
    USING (has_permission('property:delete'));

-- Novas políticas para reurb_documentos
CREATE POLICY "Visualização de documentos"
    ON reurb_documentos FOR SELECT
    USING (
        has_permission('document:read') OR
        created_by = auth.uid()
    );

CREATE POLICY "Upload de documentos"
    ON reurb_documentos FOR INSERT
    WITH CHECK (has_permission('document:upload'));

CREATE POLICY "Validação de documentos"
    ON reurb_documentos FOR UPDATE
    USING (has_permission('document:validate'));

-- Novas políticas para reurb_processos
CREATE POLICY "Visualização de processos"
    ON reurb_processos FOR SELECT
    USING (has_permission('process:read'));

CREATE POLICY "Gerenciamento de processos"
    ON reurb_processos FOR ALL
    USING (has_permission('process:manage'));

-- Novas políticas para reurb_laudos
CREATE POLICY "Visualização de laudos"
    ON reurb_laudos FOR SELECT
    USING (has_permission('document:read'));

CREATE POLICY "Criação e atualização de laudos"
    ON reurb_laudos FOR ALL
    USING (has_permission('document:validate'));

-- Função para obter o perfil do usuário atual
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS JSONB AS $$
DECLARE
    profile_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', up.id,
        'user_id', up.user_id,
        'full_name', up.full_name,
        'email', u.email,
        'role', up.role,
        'is_active', up.is_active,
        'permissions', (
            SELECT jsonb_agg(p.name)
            FROM reurb_permissions p
            JOIN reurb_role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role = up.role
        )
    ) INTO profile_data
    FROM reurb_user_profiles up
    JOIN auth.users u ON up.user_id = u.id
    WHERE up.user_id = auth.uid();
    
    RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO reurb_user_profiles (user_id, full_name, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::TEXT, 'cidadão')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

-- Adicionar comentários para documentação
COMMENT ON TABLE reurb_user_profiles IS 'Perfis de usuário do sistema com informações adicionais';
COMMENT ON TABLE reurb_permissions IS 'Permissões disponíveis no sistema';
COMMENT ON TABLE reurb_role_permissions IS 'Associação entre funções e permissões';

-- Atualizar a função de atualização de timestamp para incluir as novas tabelas
-- (a função update_updated_at_column já foi criada na migração anterior)

-- Adicionar triggers para as novas tabelas
CREATE TRIGGER update_reurb_user_profiles_updated_at
BEFORE UPDATE ON reurb_user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX idx_reurb_user_profiles_user_id ON reurb_user_profiles(user_id);
CREATE INDEX idx_reurb_user_profiles_role ON reurb_user_profiles(role);
CREATE INDEX idx_reurb_role_permissions_role ON reurb_role_permissions(role);

-- Adicionar permissão para usuários autenticados acessarem as funções
GRANT EXECUTE ON FUNCTION has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile() TO authenticated;

-- Adicionar permissões de leitura para visualizações do sistema
GRANT SELECT ON reurb_permissions TO authenticated;
GRANT SELECT ON reurb_role_permissions TO authenticated;
