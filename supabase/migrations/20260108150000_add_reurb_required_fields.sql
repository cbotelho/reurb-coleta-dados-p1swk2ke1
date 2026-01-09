-- Migração para adicionar campos necessários para a implementação da REURB
-- Data: 08/01/2026

-- Adiciona campos à tabela reurb_projects
ALTER TABLE reurb_projects
ADD COLUMN tipo_reurb TEXT,
ADD COLUMN fases_processo TEXT[],
ADD COLUMN data_limite_conclusao DATE,
ADD COLUMN orgao_responsavel TEXT,
ADD COLUMN status_legal TEXT,
ADD COLUMN documentos_necessarios JSONB DEFAULT '[]'::jsonb,
ADD COLUMN responsavel_id UUID REFERENCES auth.users(id),
ADD COLUMN data_publicacao_edital DATE,
ADD COLUMN numero_processo TEXT,
ADD COLUMN area_total_hectares NUMERIC(15, 2);

-- Adiciona campos à tabela reurb_properties
ALTER TABLE reurb_properties
ADD COLUMN tipo_posse TEXT,
ADD COLUMN situacao_fundiaria TEXT,
ADD COLUMN documentos_comprobatorios JSONB DEFAULT '[]'::jsonb,
ADD COLUMN historico_ocupacao TEXT,
ADD COLUMN restricoes_ambientais TEXT,
ADD COLUMN situacao_cadastral TEXT,
ADD COLUMN area_terreno NUMERIC(15, 2),
ADD COLUMN area_construida NUMERIC(15, 2),
ADD COLUMN matricula_imovel TEXT,
ADD COLUMN data_ocupacao DATE,
ADD COLUMN possui_conflito BOOLEAN DEFAULT false,
ADD COLUMN descricao_conflito TEXT;

-- Cria a tabela de documentos
CREATE TABLE reurb_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento TEXT NOT NULL,
    numero TEXT,
    orgao_emissor TEXT,
    data_emissao DATE,
    data_validade DATE,
    arquivo_url TEXT,
    status_validacao TEXT DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Cria a tabela de processos
CREATE TABLE reurb_processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID REFERENCES reurb_projects(id) ON DELETE CASCADE,
    tipo_processo TEXT NOT NULL,
    numero_processo TEXT NOT NULL,
    orgao_responsavel TEXT,
    status TEXT DEFAULT 'em_analise',
    data_abertura DATE NOT NULL,
    data_conclusao DATE,
    responsavel_id UUID REFERENCES auth.users(id),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(numero_processo)
);

-- Cria a tabela de laudos
CREATE TABLE reurb_laudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID REFERENCES reurb_processos(id) ON DELETE CASCADE,
    tipo_laudo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    responsavel_id UUID REFERENCES auth.users(id),
    data_emissao DATE NOT NULL,
    status TEXT DEFAULT 'rascunho',
    arquivo_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria a tabela de notificações
CREATE TABLE reurb_notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acao_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Cria índices para melhorar performance
CREATE INDEX idx_reurb_projects_tipo_reurb ON reurb_projects(tipo_reurb);
CREATE INDEX idx_reurb_projects_status_legal ON reurb_projects(status_legal);
CREATE INDEX idx_reurb_properties_situacao_fundiaria ON reurb_properties(situacao_fundiaria);
CREATE INDEX idx_reurb_documentos_tipo ON reurb_documentos(tipo_documento);
CREATE INDEX idx_reurb_processos_status ON reurb_processos(status);
CREATE INDEX idx_reurb_laudos_tipo ON reurb_laudos(tipo_laudo);
CREATE INDEX idx_reurb_notificacoes_usuario ON reurb_notificacoes(usuario_id, lida);

-- Adiciona políticas de segurança para as novas tabelas
ALTER TABLE reurb_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_laudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reurb_notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para reurb_documentos
CREATE POLICY "Usuários autenticados podem ver documentos"
    ON reurb_documentos FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem gerenciar seus próprios documentos"
    ON reurb_documentos FOR ALL
    USING (auth.uid() = created_by);

-- Políticas de segurança para reurb_processos
CREATE POLICY "Usuários autenticados podem ver processos"
    ON reurb_processos FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Responsáveis podem gerenciar processos"
    ON reurb_processos FOR ALL
    USING (
        auth.uid() = responsavel_id OR
        EXISTS (
            SELECT 1 FROM reurb_projects p 
            WHERE p.id = projeto_id AND p.created_by = auth.uid()
        )
    );

-- Políticas de segurança para reurb_laudos
CREATE POLICY "Usuários autenticados podem ver laudos"
    ON reurb_laudos FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Responsáveis podem gerenciar laudos"
    ON reurb_laudos FOR ALL
    USING (auth.uid() = responsavel_id);

-- Políticas de segurança para reurb_notificacoes
CREATE POLICY "Usuários podem ver suas notificações"
    ON reurb_notificacoes FOR SELECT
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem gerenciar suas notificações"
    ON reurb_notificacoes FOR ALL
    USING (auth.uid() = usuario_id);

-- Comentários para documentação
COMMENT ON TABLE reurb_projects IS 'Armazena os projetos de regularização fundiária urbana';
COMMENT ON TABLE reurb_properties IS 'Lotes ou imóveis incluídos nos projetos de regularização';
COMMENT ON TABLE reurb_documentos IS 'Documentos necessários para os processos de regularização';
COMMENT ON TABLE reurb_processos IS 'Processos administrativos relacionados à regularização';
COMMENT ON TABLE reurb_laudos IS 'Laudos técnicos emitidos durante a regularização';
COMMENT ON TABLE reurb_notificacoes IS 'Notificações do sistema para os usuários';

-- Atualiza a função de atualização de timestamp se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria triggers para atualização automática de updated_at
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name LIKE 'reurb_%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I', t.table_name, t.table_name);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at
                       BEFORE UPDATE ON %I
                       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', 
                       t.table_name, t.table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
