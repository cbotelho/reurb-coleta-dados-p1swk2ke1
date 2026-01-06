-- Restore Quadras for Marabaixo 1 project
-- Project ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 (Loteamento Marabaixo 1)

INSERT INTO reurb_quadras (project_id, name, area, status)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name, area, 'synchronized'
FROM (VALUES
    ('Quadra 91', '21054.45m²'),
    ('Quadra 92', '6006.47m²'),
    ('Quadra 93', '5823.89m²'),
    ('Quadra 94', '45389.41m²'),
    ('Quadra 112', '10235.8m²'),
    ('Quadra 113', '10378.73m²'),
    ('Quadra 114', '10108.42m²'),
    ('Quadra 115', '10135.37m²'),
    ('Quadra 116', '10104.01m²'),
    ('Quadra 117', '10142.43m²'),
    ('Quadra 118', '10200.6m²'),
    ('Quadra 119', '10266.78m²'),
    ('Quadra 120', '10124.91m²'),
    ('Quadra 121', '10084.97m²'),
    ('Quadra 122', '10168.35m²'),
    ('Quadra 123', '10327.71m²'),
    ('Quadra 124', '8792.41m²'),
    ('Quadra 125', '1461.72m²'),
    ('Quadra 125A', '1247.3m²')
) AS v(name, area)
WHERE NOT EXISTS (
    SELECT 1 FROM reurb_quadras 
    WHERE project_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' 
    AND name = v.name
);
