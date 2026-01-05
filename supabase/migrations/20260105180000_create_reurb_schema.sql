-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. reurb_projects
CREATE TABLE reurb_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Em andamento',
    created_by UUID REFERENCES auth.users(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url TEXT,
    auto_update_map BOOLEAN DEFAULT FALSE,
    last_map_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. reurb_quadras
CREATE TABLE reurb_quadras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES reurb_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    area TEXT,
    document_url TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'synchronized',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. reurb_properties (Lotes)
CREATE TABLE reurb_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quadra_id UUID REFERENCES reurb_quadras(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    area TEXT,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT DEFAULT 'pending',
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. reurb_owners
CREATE TABLE reurb_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES reurb_properties(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    document TEXT,
    contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. reurb_contracts
CREATE TABLE reurb_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES reurb_properties(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft',
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. reurb_audit_processes
CREATE TABLE reurb_audit_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL, -- 'project', 'property'
    target_id UUID NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. reurb_map_layers
CREATE TABLE reurb_map_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES reurb_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'geojson', 'kml'
    data JSONB NOT NULL,
    visible BOOLEAN DEFAULT TRUE,
    z_index INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. reurb_project_checkpoints
CREATE TABLE reurb_project_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES reurb_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE reurb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_quadras ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_audit_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_map_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_project_checkpoints ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for demo: Authenticated users can read all, Owners can edit)
-- In a real app, we might use a dedicated reurb_user_profiles table or RBAC.

-- Projects
CREATE POLICY "Public read access for projects" ON reurb_projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can insert projects" ON reurb_projects
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update projects" ON reurb_projects
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Owners can delete projects" ON reurb_projects
    FOR DELETE USING (auth.uid() = created_by);

-- Quadras (Cascading access based on project usually, simplified here to authenticated for read, insert for auth)
CREATE POLICY "Authenticated read access quadras" ON reurb_quadras
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert quadras" ON reurb_quadras
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update quadras" ON reurb_quadras
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Properties
CREATE POLICY "Authenticated read access properties" ON reurb_properties
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert properties" ON reurb_properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update properties" ON reurb_properties
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Owners, Contracts, Audit, Map Layers, Checkpoints (Similar generic access for authenticated users for this iteration)
CREATE POLICY "Authenticated all access owners" ON reurb_owners
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all access contracts" ON reurb_contracts
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all access audit" ON reurb_audit_processes
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all access map layers" ON reurb_map_layers
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated all access checkpoints" ON reurb_project_checkpoints
    FOR ALL USING (auth.role() = 'authenticated');
