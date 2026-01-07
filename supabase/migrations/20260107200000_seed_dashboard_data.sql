-- Seed data for Dashboard Charts and Activity Feed

-- 1. Ensure we have some Contracts (Titulos) distributed over the last 6 months
DO $$
DECLARE 
    prop_id UUID;
    i INT;
BEGIN
    -- Get some property IDs
    FOR prop_id IN SELECT id FROM reurb_properties LIMIT 50 LOOP
        -- Randomly decide to create a contract
        IF (random() > 0.5) THEN
            INSERT INTO reurb_contracts (property_id, status, created_at, updated_at)
            VALUES (
                prop_id, 
                'issued', 
                NOW() - (floor(random() * 180) || ' days')::INTERVAL, 
                NOW()
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- 2. Update Surveys to have spread out dates for "Cadastros" chart
UPDATE reurb_surveys 
SET created_at = NOW() - (floor(random() * 180) || ' days')::INTERVAL
WHERE created_at > NOW() - INTERVAL '1 day'; -- Only update recently created/seeded ones to avoid messing up real data if any

-- 3. Seed Audit Processes for Activity Feed
INSERT INTO reurb_audit_processes (target_type, target_id, action, details, user_id, created_at)
SELECT 
    'property',
    (SELECT id FROM reurb_properties LIMIT 1),
    'Novo cadastro realizado',
    'Cadastro do lote ' || floor(random() * 100),
    (SELECT id FROM reurb_profiles LIMIT 1),
    NOW() - INTERVAL '5 minutes'
WHERE NOT EXISTS (SELECT 1 FROM reurb_audit_processes WHERE action = 'Novo cadastro realizado');

INSERT INTO reurb_audit_processes (target_type, target_id, action, details, user_id, created_at)
SELECT 
    'project',
    (SELECT id FROM reurb_projects LIMIT 1),
    'Dossiê aprovado pela IA',
    'Análise automática concluída com sucesso',
    (SELECT id FROM reurb_profiles LIMIT 1),
    NOW() - INTERVAL '12 minutes'
WHERE NOT EXISTS (SELECT 1 FROM reurb_audit_processes WHERE action = 'Dossiê aprovado pela IA');

INSERT INTO reurb_audit_processes (target_type, target_id, action, details, user_id, created_at)
SELECT 
    'project',
    (SELECT id FROM reurb_projects LIMIT 1),
    'Edital Vila Sul publicado',
    'Publicação no diário oficial',
    NULL, -- System action
    NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM reurb_audit_processes WHERE action = 'Edital Vila Sul publicado');

INSERT INTO reurb_audit_processes (target_type, target_id, action, details, user_id, created_at)
SELECT 
    'property',
    (SELECT id FROM reurb_properties LIMIT 1),
    'Foto de campo anexada',
    'Atualização visual do imóvel',
    (SELECT id FROM reurb_profiles LIMIT 1),
    NOW() - INTERVAL '2 hours'
WHERE NOT EXISTS (SELECT 1 FROM reurb_audit_processes WHERE action = 'Foto de campo anexada');
