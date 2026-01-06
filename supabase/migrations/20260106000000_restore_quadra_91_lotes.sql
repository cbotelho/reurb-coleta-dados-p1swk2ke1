-- Migration to restore missing lots for Quadra 91 in Loteamento Marabaixo 1
-- Creates a unique index to support idempotent inserts via ON CONFLICT

-- 1. Ensure a unique constraint exists on (quadra_id, name) to allow ON CONFLICT updates
CREATE UNIQUE INDEX IF NOT EXISTS idx_reurb_properties_quadra_name 
ON reurb_properties (quadra_id, name);

DO $$
DECLARE
    v_project_id UUID;
    v_quadra_id UUID;
BEGIN
    -- 2. Identify the Project ID for "Loteamento Marabaixo 1"
    -- Trying exact ID first, then fallback to name lookup
    IF EXISTS (SELECT 1 FROM reurb_projects WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') THEN
        v_project_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    ELSE
        SELECT id INTO v_project_id FROM reurb_projects WHERE name = 'Loteamento Marabaixo 1' LIMIT 1;
    END IF;

    -- 3. Identify the Quadra ID for "Quadra 91" within the project
    IF v_project_id IS NOT NULL THEN
        SELECT id INTO v_quadra_id 
        FROM reurb_quadras 
        WHERE project_id = v_project_id AND name = 'Quadra 91' 
        LIMIT 1;

        -- 4. Insert or Update Lots
        IF v_quadra_id IS NOT NULL THEN
            INSERT INTO reurb_properties (quadra_id, name, area, status)
            VALUES 
                (v_quadra_id, 'Lote 168', '2128.65m²', 'pending'),
                (v_quadra_id, 'Lote 178', '243.3m²', 'pending'),
                (v_quadra_id, 'Lote 188', '253.87m²', 'pending'),
                (v_quadra_id, 'Lote 198', '266.03m²', 'pending'),
                (v_quadra_id, 'Lote 208', '241.47m²', 'pending'),
                (v_quadra_id, 'Lote 218', '247.69m²', 'pending'),
                (v_quadra_id, 'Lote 228', '258.82m²', 'pending'),
                (v_quadra_id, 'Lote 839', '15520.43m²', 'pending'),
                (v_quadra_id, 'Lote 849', '270.74m²', 'pending'),
                (v_quadra_id, 'Lote 859', '240.91m²', 'pending'),
                (v_quadra_id, 'Lote 869', '258.64m²', 'pending'),
                (v_quadra_id, 'Lote 879', '260.17m²', 'pending'),
                (v_quadra_id, 'Lote 889', '255.14m²', 'pending'),
                (v_quadra_id, 'Lote 899', '252.96m²', 'pending'),
                (v_quadra_id, 'Lote 909', '355.63m²', 'pending')
            ON CONFLICT (quadra_id, name) 
            DO UPDATE SET 
                area = EXCLUDED.area,
                status = 'pending',
                updated_at = NOW();
                
            RAISE NOTICE 'Restored 15 lots for Quadra 91';
        ELSE
            RAISE NOTICE 'Quadra 91 not found for project %', v_project_id;
        END IF;
    ELSE
        RAISE NOTICE 'Project Loteamento Marabaixo 1 not found';
    END IF;
END $$;
