-- Seed Data for REURB Application

-- Insert Projects (Marabaixo 1 and Oiapoque)
INSERT INTO public.reurb_projects (id, name, description, status, latitude, longitude, image_url, auto_update_map)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marabaixo 1', 'Projeto de regularização do bairro Marabaixo 1 em Macapá.', 'Em andamento', 0.036161, -51.130895, 'https://img.usecurling.com/p/800/400?q=satellite%20map%20macapa&color=green', true),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Oiapoque', 'Levantamento fundiário na região de Oiapoque.', 'Iniciado', 3.8427, -51.8344, 'https://img.usecurling.com/p/800/400?q=satellite%20map%20forest&color=blue', false)
ON CONFLICT (id) DO NOTHING;

-- Insert Quadras for Marabaixo 1
INSERT INTO public.reurb_quadras (id, project_id, name, area, status)
VALUES
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 01', '5000m²', 'synchronized'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 02', '4800m²', 'synchronized'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quadra 03', '5200m²', 'synchronized')
ON CONFLICT (id) DO NOTHING;

-- Insert Quadras for Oiapoque
INSERT INTO public.reurb_quadras (id, project_id, name, area, status)
VALUES
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Quadra A', '10000m²', 'synchronized')
ON CONFLICT (id) DO NOTHING;

-- Insert Lotes for Quadra 01 (Marabaixo)
INSERT INTO public.reurb_properties (id, quadra_id, name, area, description, latitude, longitude, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Lote 01', '250m²', 'Terreno de esquina, plano, sem edificações.', 0.036261, -51.130995, 'synchronized'),
  ('22222222-2222-2222-2222-222222222222', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Lote 02', '250m²', 'Residencial, casa de alvenaria.', 0.036361, -51.131095, 'synchronized'),
  ('33333333-3333-3333-3333-333333333333', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Lote 03', '250m²', 'Comercial, pequena loja na frente.', 0.036461, -51.131195, 'pending')
ON CONFLICT (id) DO NOTHING;

-- Insert Owners
INSERT INTO public.reurb_owners (property_id, full_name, document, contact)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'João da Silva', '123.456.789-00', '(96) 99123-4567'),
  ('22222222-2222-2222-2222-222222222222', 'Maria Oliveira', '987.654.321-11', '(96) 98123-4567')
ON CONFLICT DO NOTHING;
