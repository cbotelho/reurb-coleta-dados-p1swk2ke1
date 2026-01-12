-- Tabela de Pareceres Conclusivos do Assistente Social
-- Vinculada a lotes (reurb_properties) com histórico completo

BEGIN;

-- Criar tabela de pareceres
CREATE TABLE IF NOT EXISTS reurb_social_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referências (cascata obrigatória)
    project_id UUID NOT NULL REFERENCES reurb_projects(id) ON DELETE CASCADE,
    quadra_id UUID NOT NULL REFERENCES reurb_quadras(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES reurb_properties(id) ON DELETE CASCADE,
    
    -- Conteúdo do parecer
    parecer TEXT NOT NULL, -- HTML do editor WYSIWYG
    
    -- Identificação e registro
    numero_registro VARCHAR(50) UNIQUE, -- Ex: "2026/001-REURB-AP"
    
    -- Assinatura eletrônica (hash ou URL)
    assinatura_eletronica TEXT,
    
    -- Informações do assistente social
    nome_assistente_social VARCHAR(255) NOT NULL,
    cress_assistente_social VARCHAR(50), -- Registro profissional CRESS
    email_assistente_social VARCHAR(255),
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status do parecer
    status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, finalizado, revisado, aprovado
    
    -- Versão (para histórico)
    versao INTEGER DEFAULT 1,
    parecer_anterior_id UUID REFERENCES reurb_social_reports(id) ON DELETE SET NULL
);

-- Comentários
COMMENT ON TABLE reurb_social_reports IS 'Pareceres conclusivos elaborados por assistentes sociais para cada lote do REURB';
COMMENT ON COLUMN reurb_social_reports.parecer IS 'Conteúdo do parecer em HTML (editor WYSIWYG)';
COMMENT ON COLUMN reurb_social_reports.numero_registro IS 'Número único do registro do parecer (ex: 2026/001-REURB-AP)';
COMMENT ON COLUMN reurb_social_reports.assinatura_eletronica IS 'Hash ou URL da assinatura digital do assistente social';
COMMENT ON COLUMN reurb_social_reports.cress_assistente_social IS 'Número de registro no Conselho Regional de Serviço Social';
COMMENT ON COLUMN reurb_social_reports.versao IS 'Versão do parecer (incrementa a cada edição)';
COMMENT ON COLUMN reurb_social_reports.parecer_anterior_id IS 'Referência ao parecer anterior (para histórico de versões)';

-- Índices para performance
CREATE INDEX idx_social_reports_property ON reurb_social_reports(property_id);
CREATE INDEX idx_social_reports_quadra ON reurb_social_reports(quadra_id);
CREATE INDEX idx_social_reports_project ON reurb_social_reports(project_id);
CREATE INDEX idx_social_reports_status ON reurb_social_reports(status);
CREATE INDEX idx_social_reports_created_by ON reurb_social_reports(created_by);
CREATE INDEX idx_social_reports_numero_registro ON reurb_social_reports(numero_registro);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_social_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_social_report_timestamp
    BEFORE UPDATE ON reurb_social_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_social_report_timestamp();

-- RLS Policies
ALTER TABLE reurb_social_reports ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (autenticados podem ler, apenas admins/assistentes sociais podem editar)
CREATE POLICY "Usuários autenticados podem visualizar pareceres"
    ON reurb_social_reports FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins e assistentes sociais podem criar pareceres"
    ON reurb_social_reports FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM reurb_profiles 
            WHERE situacao = 'ativo' 
            AND grupo_acesso IN ('Administrador', 'Administradores', 'Assistente Social')
        )
    );

CREATE POLICY "Apenas admins e assistentes sociais podem editar pareceres"
    ON reurb_social_reports FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM reurb_profiles 
            WHERE situacao = 'ativo' 
            AND grupo_acesso IN ('Administrador', 'Administradores', 'Assistente Social')
        )
    );

CREATE POLICY "Apenas admins podem deletar pareceres"
    ON reurb_social_reports FOR DELETE
    USING (
        auth.uid() IN (
            SELECT id FROM reurb_profiles 
            WHERE situacao = 'ativo' 
            AND grupo_acesso IN ('Administrador', 'Administradores')
        )
    );

-- Função para gerar número de registro automático
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TEXT AS $$
DECLARE
    ano TEXT;
    sequencia INTEGER;
    numero TEXT;
BEGIN
    ano := TO_CHAR(NOW(), 'YYYY');
    
    -- Buscar último número do ano
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(numero_registro FROM '^\d{4}/(\d+)-') 
                AS INTEGER
            )
        ), 
        0
    ) INTO sequencia
    FROM reurb_social_reports
    WHERE numero_registro LIKE ano || '/%';
    
    sequencia := sequencia + 1;
    numero := ano || '/' || LPAD(sequencia::TEXT, 3, '0') || '-REURB-AP';
    
    RETURN numero;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_report_number() IS 'Gera número sequencial de registro de pareceres (formato: YYYY/NNN-REURB-AP)';

COMMIT;
