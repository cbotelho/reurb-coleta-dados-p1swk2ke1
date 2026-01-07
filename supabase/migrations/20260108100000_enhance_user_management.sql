-- Enhance reurb_profiles table with additional fields
ALTER TABLE IF EXISTS public.reurb_profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public.reurb_profiles(id);

-- Insert specific user groups
INSERT INTO reurb_user_groups (name, description, permissions)
VALUES 
  ('Externo', 'Acesso para usuários externos', '["view_only"]'::jsonb),
  ('Administrador', 'Acesso administrativo completo', '["all"]'::jsonb),
  ('SEHAB', 'Secretaria de Habitação', '["edit_projects", "view_reports"]'::jsonb),
  ('Técnicos Amapá Terra', 'Equipe técnica', '["edit_projects"]'::jsonb),
  ('Next Ambiente', 'Consultoria ambiental', '["view_only"]'::jsonb),
  ('Externo Editar', 'Acesso externo com permissão de edição', '["edit_projects"]'::jsonb)
ON CONFLICT DO NOTHING;
