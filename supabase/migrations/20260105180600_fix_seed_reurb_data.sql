-- Seed Data
-- Note: UUIDs are hardcoded for relationships
-- Fixed UUIDs from previous failed migration

INSERT INTO reurb_projects (id, name, description, status, latitude, longitude, image_url)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marabaixo 1', 'Projeto de regularização do bairro Marabaixo 1.', 'Em andamento', 0.036161, -51.130895, 'https://img.usecurling.com/p/400/250?q=city%20map&color=blue'),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Oiapoque', 'Levantamento fundiário Oiapoque.', 'Iniciado', 3.8427, -51.8344, 'https://img.usecurling.com/p/400/250?q=forest%20map&color=green');

INSERT INTO reurb_quadras (id, project_id, name, area)
VALUES
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 01', '5000m²'),
    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 02', '4800m²'),
    ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Quadra A', '10000m²');

INSERT INTO reurb_properties (id, quadra_id, name, area, description, latitude, longitude, status)
VALUES
    ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Lote 01', '250m²', 'Terreno plano.', 0.036261, -51.130995, 'synchronized'),
    ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Lote 02', '250m²', 'Casa construída.', 0.036361, -51.131095, 'synchronized'),
    ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380b88', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Lote 15', '300m²', 'Comercial.', 0.036461, -51.131195, 'pending');

INSERT INTO reurb_owners (property_id, full_name, document)
VALUES
    ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'João da Silva', '123.456.789-00'),
    ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Maria Oliveira', '987.654.321-11');
