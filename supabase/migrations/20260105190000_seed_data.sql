-- Seed Projects
INSERT INTO reurb_projects (id, name, description, status, latitude, longitude, auto_update_map)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Loteamento Marabaixo 1', 'Projeto de regularização fundiária do bairro Marabaixo 1.', 'Em andamento', 0.036161, -51.130895, TRUE),
    ('b1ffcd88-9d0c-5ef9-cc7e-7cc0ce491b22', 'Oiapoque', 'Levantamento inicial da área urbana de Oiapoque.', 'Em andamento', 3.8427, -51.8344, FALSE);

-- Seed Quadras for Marabaixo 1
INSERT INTO reurb_quadras (project_id, name, area, status)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 01', '4500m²', 'synchronized'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 02', '3800m²', 'synchronized'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 03', '4200m²', 'pending'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 04', '4100m²', 'synchronized'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 05', '4000m²', 'failed'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 06', '3950m²', 'synchronized');

-- Seed Quadras for Oiapoque
INSERT INTO reurb_quadras (project_id, name, area, status)
VALUES
    ('b1ffcd88-9d0c-5ef9-cc7e-7cc0ce491b22', 'Quadra A', '5000m²', 'synchronized'),
    ('b1ffcd88-9d0c-5ef9-cc7e-7cc0ce491b22', 'Quadra B', '5200m²', 'pending');
