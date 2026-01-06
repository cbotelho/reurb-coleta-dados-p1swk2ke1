-- Restore lots for remaining Marabaixo 1 quadras
-- Quadras: 93, 94, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 125A

DO $$
DECLARE
    v_project_id UUID;
    v_quadra_record RECORD;
    v_lots_data JSONB;
    v_q_name TEXT;
    v_lote_item JSONB;
    v_lote_name TEXT;
    v_lote_area TEXT;
    v_base_list_113 JSONB;
BEGIN
    -- 1. Get Project ID
    SELECT id INTO v_project_id FROM reurb_projects WHERE name LIKE '%Marabaixo 1%' LIMIT 1;
    IF v_project_id IS NULL THEN
        RAISE NOTICE 'Project Marabaixo 1 not found';
        RETURN;
    END IF;

    -- Define explicit lists and generate implicit ones based on Quadra 113 pattern
    -- Quadra 113 List (39 lots):
    v_base_list_113 := '["10", "20", "30", "40", "50", "60", "70", "80", "100", "110", "113", "120", "130", "140", "150", "185", "195", "205", "215", "250", "260", "270", "280", "290", "300", "310", "320", "330", "340", "350", "360", "370", "380", "390", "400", "435", "455", "465", "500"]';

    v_lots_data := jsonb_build_array(
        jsonb_build_object(
            'quadra', 'Quadra 93', 
            'lots', jsonb_build_array('10', '20', '30', '40', '50', '70', '80', '90', '93', '115', '125', '160', '170', '180', '190', '200', '210', '220', '230', '240', '250', '285', '345', '355')
        ),
        jsonb_build_object(
            'quadra', 'Quadra 94',
            'lots', jsonb_build_array('229', '259', '273', '335', '352', '357', '364', '374', '383', '392', '398', '402', '406', '412', '416', '420', '427', '433', '440', '445', '451', '593')
        ),
        jsonb_build_object(
            'quadra', 'Quadra 112',
            'lots', jsonb_build_array('10', '20', '30', '50', '60', '70', '80', '90', '110', '120', '140', '150', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '445', '455', '465', '490', '500')
        ),
        jsonb_build_object(
            'quadra', 'Quadra 113',
            'lots', v_base_list_113
        ),
        -- Quadra 114 (37 lots): 113 list minus first 2 (10, 20)
        jsonb_build_object(
            'quadra', 'Quadra 114',
            'lots', jsonb_build_array('30', '40', '50', '60', '70', '80', '100', '110', '113', '120', '130', '140', '150', '185', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '435', '455', '465', '500')
        ),
        -- Quadra 115 (38 lots): 113 list minus first 1 (10)
        jsonb_build_object(
            'quadra', 'Quadra 115',
            'lots', jsonb_build_array('20', '30', '40', '50', '60', '70', '80', '100', '110', '113', '120', '130', '140', '150', '185', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '435', '455', '465', '500')
        ),
        -- Quadra 116 (38 lots)
        jsonb_build_object(
            'quadra', 'Quadra 116',
            'lots', jsonb_build_array('20', '30', '40', '50', '60', '70', '80', '100', '110', '113', '120', '130', '140', '150', '185', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '435', '455', '465', '500')
        ),
        -- Quadra 117 (39 lots): Full 113 list
        jsonb_build_object(
            'quadra', 'Quadra 117',
            'lots', v_base_list_113
        ),
        -- Quadra 118 (38 lots)
        jsonb_build_object(
            'quadra', 'Quadra 118',
            'lots', jsonb_build_array('20', '30', '40', '50', '60', '70', '80', '100', '110', '113', '120', '130', '140', '150', '185', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '435', '455', '465', '500')
        ),
        -- Quadra 119 (37 lots): Minus first 2
        jsonb_build_object(
            'quadra', 'Quadra 119',
            'lots', jsonb_build_array('30', '40', '50', '60', '70', '80', '100', '110', '113', '120', '130', '140', '150', '185', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '435', '455', '465', '500')
        ),
        -- Quadra 120 (36 lots): Minus first 3
        jsonb_build_object(
            'quadra', 'Quadra 120',
            'lots', jsonb_build_array('40', '50', '60', '70', '80', '100', '110', '113', '120', '130', '140', '150', '185', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '435', '455', '465', '500')
        ),
        -- Quadra 121 (39 lots): Full list
        jsonb_build_object(
            'quadra', 'Quadra 121',
            'lots', v_base_list_113
        ),
        -- Quadra 122 (37 lots): Minus first 2
        jsonb_build_object(
            'quadra', 'Quadra 122',
            'lots', jsonb_build_array('30', '40', '50', '60', '70', '80', '100', '110', '113', '120', '130', '140', '150', '185', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '435', '455', '465', '500')
        ),
        -- Quadra 123 (39 lots): Full list
        jsonb_build_object(
            'quadra', 'Quadra 123',
            'lots', v_base_list_113
        ),
        -- Quadra 124 (34 lots): Minus first 5
        jsonb_build_object(
            'quadra', 'Quadra 124',
            'lots', jsonb_build_array('60', '70', '80', '100', '110', '113', '120', '130', '140', '150', '185', '195', '205', '215', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '435', '455', '465', '500')
        ),
        jsonb_build_object(
            'quadra', 'Quadra 125',
            'lots', jsonb_build_array('01', '02', '03', '04', '05', '06', '07', '08', '09')
        ),
        jsonb_build_object(
            'quadra', 'Quadra 125A',
            'lots', jsonb_build_array('01', '02', '03', '04', '05', '06', '07')
        )
    );

    -- 3. Loop through Explicit Lists
    FOR v_lote_item IN SELECT * FROM jsonb_array_elements(v_lots_data)
    LOOP
        v_q_name := v_lote_item->>'quadra';
        
        -- Get Quadra ID
        SELECT id INTO v_quadra_record FROM reurb_quadras WHERE project_id = v_project_id AND name = v_q_name LIMIT 1;
        
        IF v_quadra_record.id IS NOT NULL THEN
            FOR v_lote_name IN SELECT jsonb_array_elements_text(v_lote_item->'lots')
            LOOP
                -- Determine Area
                IF v_q_name = 'Quadra 125A' THEN
                    v_lote_area := '178.00m²';
                ELSIF v_q_name = 'Quadra 125' THEN
                    v_lote_area := '162.00m²';
                ELSE
                    v_lote_area := '250.00m²';
                END IF;

                INSERT INTO reurb_properties (quadra_id, name, area, status)
                VALUES (v_quadra_record.id, 'Lote ' || v_lote_name, v_lote_area, 'pending')
                ON CONFLICT (quadra_id, name) DO UPDATE 
                SET area = EXCLUDED.area, updated_at = NOW();
            END LOOP;
        ELSE
             RAISE NOTICE 'Quadra % not found for Marabaixo 1', v_q_name;
        END IF;
    END LOOP;

END $$;
