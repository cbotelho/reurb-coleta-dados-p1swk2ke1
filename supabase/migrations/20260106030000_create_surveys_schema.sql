-- Add address column to reurb_properties if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reurb_properties' AND column_name = 'address') THEN
        ALTER TABLE reurb_properties ADD COLUMN address TEXT;
    END IF;
END $$;

-- Create reurb_surveys table
CREATE TABLE IF NOT EXISTS reurb_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES reurb_properties(id) ON DELETE CASCADE,
    form_number TEXT,
    survey_date DATE,
    city TEXT DEFAULT 'Macapá',
    state TEXT DEFAULT 'AP',
    
    -- Applicant
    applicant_name TEXT,
    applicant_cpf TEXT,
    applicant_rg TEXT,
    applicant_civil_status TEXT,
    applicant_profession TEXT,
    applicant_income TEXT,
    applicant_nis TEXT,
    spouse_name TEXT,
    spouse_cpf TEXT,
    
    -- Household
    residents_count INTEGER DEFAULT 0,
    has_children BOOLEAN DEFAULT FALSE,
    
    -- Occupation
    occupation_time TEXT,
    acquisition_mode TEXT,
    property_use TEXT,
    
    -- Characteristics
    construction_type TEXT,
    roof_type TEXT,
    floor_type TEXT,
    rooms_count INTEGER DEFAULT 0,
    conservation_state TEXT,
    fencing TEXT,
    
    -- Infrastructure
    water_supply TEXT,
    energy_supply TEXT,
    sanitation TEXT,
    street_paving TEXT,
    
    -- Meta
    observations TEXT,
    surveyor_name TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for surveys
ALTER TABLE reurb_surveys ENABLE ROW LEVEL SECURITY;

-- Create policies for surveys (Authenticated users)
CREATE POLICY "Authenticated read access surveys" ON reurb_surveys
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert surveys" ON reurb_surveys
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update surveys" ON reurb_surveys
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete surveys" ON reurb_surveys
    FOR DELETE USING (auth.role() = 'authenticated');
