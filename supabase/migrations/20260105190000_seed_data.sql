-- Seed Projects
INSERT INTO reurb_projects (id, name, description, status, latitude, longitude, auto_update_map)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Loteamento Marabaixo 1', 'Projeto de regularização fundiária do bairro Marabaixo 1.', 'Em andamento', 0.036161, -51.130895, TRUE),
    ('b1ffcd88-9d0c-5ef9-cc7e-7cc0ce491b22', 'Oiapoque', 'Levantamento inicial da área urbana de Oiapoque.', 'Em andamento', 3.8427, -51.8344, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Seed Quadras for Marabaixo 1
INSERT INTO reurb_quadras (project_id, name, area, status)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name, area, status
FROM (VALUES
    ('Quadra 01', '4500m²', 'synchronized'),
    ('Quadra 02', '3800m²', 'synchronized'),
    ('Quadra 03', '4200m²', 'pending'),
    ('Quadra 04', '4100m²', 'synchronized'),
    ('Quadra 05', '4000m²', 'failed'),
    ('Quadra 06', '3950m²', 'synchronized')
) AS v(name, area, status)
WHERE NOT EXISTS (
    SELECT 1 FROM reurb_quadras WHERE project_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = v.name
);

-- Seed Quadras for Oiapoque
INSERT INTO reurb_quadras (project_id, name, area, status)
SELECT 'b1ffcd88-9d0c-5ef9-cc7e-7cc0ce491b22', name, area, status
FROM (VALUES
    ('Quadra A', '5000m²', 'synchronized'),
    ('Quadra B', '5200m²', 'pending')
) AS v(name, area, status)
WHERE NOT EXISTS (
    SELECT 1 FROM reurb_quadras WHERE project_id = 'b1ffcd88-9d0c-5ef9-cc7e-7cc0ce491b22' AND name = v.name
);
