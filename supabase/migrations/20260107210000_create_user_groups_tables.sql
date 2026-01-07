-- Create table for User Groups
CREATE TABLE IF NOT EXISTS reurb_user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for User Group Membership (Many-to-Many)
CREATE TABLE IF NOT EXISTS reurb_user_group_membership (
  user_id UUID NOT NULL REFERENCES reurb_profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES reurb_user_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

-- Insert default groups
INSERT INTO reurb_user_groups (name, description, permissions)
SELECT 'Administradores', 'Acesso total ao sistema e gerenciamento', '["all"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM reurb_user_groups WHERE name = 'Administradores');

INSERT INTO reurb_user_groups (name, description, permissions)
SELECT 'Vistoriadores', 'Equipe de campo para coleta de dados', '["edit_projects"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM reurb_user_groups WHERE name = 'Vistoriadores');

INSERT INTO reurb_user_groups (name, description, permissions)
SELECT 'Analistas', 'Análise jurídica e documental', '["view_reports", "edit_projects"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM reurb_user_groups WHERE name = 'Analistas');

-- Migration to migrate existing roles to groups (Optional/Best Effort)
-- Mapping: super_admin/admin -> Administradores, operator -> Vistoriadores
DO $$
DECLARE
    admin_group_id UUID;
    operator_group_id UUID;
BEGIN
    SELECT id INTO admin_group_id FROM reurb_user_groups WHERE name = 'Administradores';
    SELECT id INTO operator_group_id FROM reurb_user_groups WHERE name = 'Vistoriadores';

    -- Insert admins
    INSERT INTO reurb_user_group_membership (user_id, group_id)
    SELECT id, admin_group_id FROM reurb_profiles 
    WHERE role IN ('admin', 'super_admin')
    ON CONFLICT DO NOTHING;

    -- Insert operators
    INSERT INTO reurb_user_group_membership (user_id, group_id)
    SELECT id, operator_group_id FROM reurb_profiles 
    WHERE role = 'operator'
    ON CONFLICT DO NOTHING;
END $$;
