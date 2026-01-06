-- Restore Lots for Quadra 92 in Loteamento Marabaixo 1
-- Project: Marabaixo 1
-- Quadra: Quadra 92
-- Lots: 20, 50, 60, 70, 80, 125, 170, 180, 190, 200, 210, 230, 240, 285, 335

-- 1. Ensure unique index exists for idempotency (if not already created by previous migration)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reurb_properties_quadra_name 
ON reurb_properties (quadra_id, name);

DO $$
DECLARE
    v_project_id UUID;
    v_quadra_id UUID;
BEGIN
    -- 2. Identify the Project ID for "Marabaixo 1"
    -- Try specific ID first, then fallback to name
    IF EXISTS (SELECT 1 FROM reurb_projects WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') THEN
        v_project_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    ELSE
        SELECT id INTO v_project_id FROM reurb_projects WHERE name LIKE '%Marabaixo 1%' LIMIT 1;
    END IF;

    -- 3. Identify the Quadra ID for "Quadra 92" within the project
    IF v_project_id IS NOT NULL THEN
        SELECT id INTO v_quadra_id 
        FROM reurb_quadras 
        WHERE project_id = v_project_id AND name = 'Quadra 92' 
        LIMIT 1;

        -- 4. Insert or Update Lots
        IF v_quadra_id IS NOT NULL THEN
            INSERT INTO reurb_properties (quadra_id, name, area, status)
            VALUES 
                (v_quadra_id, 'Lote 20', '754.81m²', 'pending'),
                (v_quadra_id, 'Lote 50', '264.32m²', 'pending'),
                (v_quadra_id, 'Lote 60', '239.27m²', 'pending'),
                (v_quadra_id, 'Lote 70', '256.26m²', 'pending'),
                (v_quadra_id, 'Lote 80', '251.57m²', 'pending'),
                (v_quadra_id, 'Lote 125', '488.11m²', 'pending'),
                (v_quadra_id, 'Lote 170', '492.17m²', 'pending'),
                (v_quadra_id, 'Lote 180', '248.11m²', 'pending'),
                (v_quadra_id, 'Lote 190', '252.87m²', 'pending'),
                (v_quadra_id, 'Lote 200', '243.45m²', 'pending'),
                (v_quadra_id, 'Lote 210', '257.61m²', 'pending'),
                (v_quadra_id, 'Lote 230', '992.61m²', 'pending'),
                (v_quadra_id, 'Lote 240', '257.4m²', 'pending'),
                (v_quadra_id, 'Lote 285', '752.64m²', 'pending'),
                (v_quadra_id, 'Lote 335', '255.27m²', 'pending')
            ON CONFLICT (quadra_id, name) 
            DO UPDATE SET 
                area = EXCLUDED.area,
                status = 'pending',
                updated_at = NOW();
                
            RAISE NOTICE 'Restored 15 lots for Quadra 92 in project %', v_project_id;
        ELSE
            RAISE NOTICE 'Quadra 92 not found for project %', v_project_id;
        END IF;
    ELSE
        RAISE NOTICE 'Project Marabaixo 1 not found';
    END IF;
END $$;
