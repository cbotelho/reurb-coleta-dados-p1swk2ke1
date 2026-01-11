-- Migration: Add documents field to reurb_surveys
-- Date: 2026-01-09
-- Description: Adiciona campo JSONB para armazenar documentos anexados às vistorias

-- Adicionar coluna documents à tabela reurb_surveys
ALTER TABLE reurb_surveys
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN reurb_surveys.documents IS 'Array JSON de documentos anexados à vistoria (RG, CPF, comprovantes, fotos, etc). Estrutura: [{id, name, size, type, data, url, uploadedAt}]';

-- Index para melhorar performance de queries em documents
CREATE INDEX IF NOT EXISTS idx_reurb_surveys_documents ON reurb_surveys USING gin (documents);
