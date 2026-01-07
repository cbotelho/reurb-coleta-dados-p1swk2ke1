-- Add new columns for enhanced dashboard
ALTER TABLE reurb_projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE reurb_projects ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE reurb_projects ADD COLUMN IF NOT EXISTS state TEXT;

-- Update status column to support text values from mockup if needed (text is flexible usually)
-- Ensure we have some data to display matching the mockup
DO $$
BEGIN
    -- Only update if there are rows, to avoid errors on empty DB
    IF EXISTS (SELECT 1 FROM reurb_projects) THEN
        -- Update first project
        UPDATE reurb_projects 
        SET 
            tags = ARRAY['REURB-S', 'SOCIAL', 'URBANO'], 
            city = 'São Paulo', 
            state = 'SP',
            status = 'Em Analise'
        WHERE id IN (SELECT id FROM reurb_projects ORDER BY created_at DESC LIMIT 1);

        -- Update second project if exists
        UPDATE reurb_projects 
        SET 
            tags = ARRAY['REURB-E', 'ESPECIFICO'], 
            city = 'Campinas', 
            state = 'SP',
            status = 'Aprovado'
        WHERE id IN (SELECT id FROM reurb_projects ORDER BY created_at DESC OFFSET 1 LIMIT 1);

        -- Update third project if exists
        UPDATE reurb_projects 
        SET 
            tags = ARRAY['URGENTE', 'MORADIA'], 
            city = 'Belo Horizonte', 
            state = 'MG',
            status = 'Iniciado'
        WHERE id IN (SELECT id FROM reurb_projects ORDER BY created_at DESC OFFSET 2 LIMIT 1);
    END IF;
END $$;
