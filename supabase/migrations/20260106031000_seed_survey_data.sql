-- Seed some addresses for existing properties in Marabaixo 1 (Quadra 91)
WITH quadra_91 AS (
    SELECT q.id FROM reurb_quadras q
    JOIN reurb_projects p ON q.project_id = p.id
    WHERE q.name = 'Quadra 91' AND p.name = 'Marabaixo 1'
    LIMIT 1
)
UPDATE reurb_properties
SET address = 'Rua C, Nº ' || floor(random() * 100 + 1)::text,
    latitude = latitude + (random() * 0.0001 - 0.00005),
    longitude = longitude + (random() * 0.0001 - 0.00005)
WHERE quadra_id IN (SELECT id FROM quadra_91)
AND address IS NULL;

-- Insert a sample survey for a random property in Quadra 91
WITH target_property AS (
    SELECT p.id FROM reurb_properties p
    JOIN reurb_quadras q ON p.quadra_id = q.id
    WHERE q.name = 'Quadra 91'
    LIMIT 1
)
INSERT INTO reurb_surveys (
    property_id,
    form_number,
    survey_date,
    city,
    state,
    applicant_name,
    applicant_cpf,
    applicant_rg,
    applicant_civil_status,
    applicant_profession,
    applicant_income,
    applicant_nis,
    spouse_name,
    spouse_cpf,
    residents_count,
    has_children,
    occupation_time,
    acquisition_mode,
    property_use,
    construction_type,
    roof_type,
    floor_type,
    rooms_count,
    conservation_state,
    fencing,
    water_supply,
    energy_supply,
    sanitation,
    street_paving,
    observations,
    surveyor_name
)
SELECT
    id as property_id,
    'VST-2025-001',
    CURRENT_DATE,
    'Macapá',
    'AP',
    'João da Silva',
    '123.456.789-00',
    '1234567 SPTC/AP',
    'Casado',
    'Pedreiro',
    '2 Salários',
    '12345678901',
    'Maria da Silva',
    '987.654.321-00',
    4,
    TRUE,
    '10 anos',
    'Compra',
    'Residencial',
    'Alvenaria',
    'Telha de Barro',
    'Cerâmica',
    5,
    'Bom',
    'Muro',
    'Rede Pública',
    'Rede Pública',
    'Fossa Séptica',
    'Asfalto',
    'Imóvel em boas condições.',
    'Carlos Botelho'
FROM target_property
WHERE NOT EXISTS (
    SELECT 1 FROM reurb_surveys s WHERE s.property_id = target_property.id
);
