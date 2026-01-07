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

-- Function to seed users if they don't exist
DO $$
DECLARE
    grp_externo UUID;
    grp_admin UUID;
    grp_sehab UUID;
    grp_tecnicos UUID;
    grp_next UUID;
    grp_ext_edit UUID;
    new_user_id UUID;
    i INT;
BEGIN
    SELECT id INTO grp_externo FROM reurb_user_groups WHERE name = 'Externo';
    SELECT id INTO grp_admin FROM reurb_user_groups WHERE name = 'Administrador';
    SELECT id INTO grp_sehab FROM reurb_user_groups WHERE name = 'SEHAB';
    SELECT id INTO grp_tecnicos FROM reurb_user_groups WHERE name = 'Técnicos Amapá Terra';
    SELECT id INTO grp_next FROM reurb_user_groups WHERE name = 'Next Ambiente';
    SELECT id INTO grp_ext_edit FROM reurb_user_groups WHERE name = 'Externo Editar';

    -- Generate 41 users (mocking the list as explicit list was not provided in prompt text, ensuring requirement of 41 users is met)
    -- We will distribute them among groups
    FOR i IN 1..41 LOOP
        new_user_id := gen_random_uuid();
        
        -- Insert into auth.users (simulated for migration, in real scenarios use auth api)
        -- Note: We can't easily insert into auth.users from migration without knowing encryption.
        -- So we will insert into reurb_profiles directly assuming auth.users existence or just for profile listing demonstration.
        -- Ideally, seed data should use Supabase Auth API or a dedicated seed script.
        -- Here we insert into profiles to populate the table.
        
        INSERT INTO public.reurb_profiles (id, username, first_name, last_name, email, full_name, role, status, created_at)
        VALUES (
            new_user_id,
            'usuario.teste.' || i,
            'Usuario',
            'Teste ' || i,
            'usuario' || i || '@exemplo.com',
            'Usuario Teste ' || i,
            'user',
            CASE WHEN i % 5 = 0 THEN 'inactive' ELSE 'active' END,
            NOW() - (i || ' days')::INTERVAL
        );

        -- Assign Groups based on index
        INSERT INTO reurb_user_group_membership (user_id, group_id)
        VALUES (
            new_user_id,
            CASE 
                WHEN i <= 5 THEN grp_admin
                WHEN i <= 15 THEN grp_sehab
                WHEN i <= 25 THEN grp_tecnicos
                WHEN i <= 30 THEN grp_next
                WHEN i <= 35 THEN grp_ext_edit
                ELSE grp_externo
            END
        );
    END LOOP;
END $$;
