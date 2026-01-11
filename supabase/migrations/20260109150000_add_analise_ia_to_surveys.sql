-- Migration: Add AI analysis fields to reurb_surveys
-- Date: 2026-01-09
-- Description: Adiciona campos para análise jurídica automática REURB-S/E pela IA SisReub Insight

DO $$
BEGIN
    -- Campo de classificação (REURB-S ou REURB-E)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reurb_surveys'
          AND column_name = 'analise_ia_classificacao'
    ) THEN
        ALTER TABLE reurb_surveys ADD COLUMN analise_ia_classificacao TEXT;
        COMMENT ON COLUMN reurb_surveys.analise_ia_classificacao IS 'Classificação gerada pela IA: REURB-S (Social) ou REURB-E (Específico)';
    END IF;

    -- Campo de parecer técnico
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reurb_surveys'
          AND column_name = 'analise_ia_parecer'
    ) THEN
        ALTER TABLE reurb_surveys ADD COLUMN analise_ia_parecer TEXT;
        COMMENT ON COLUMN reurb_surveys.analise_ia_parecer IS 'Parecer técnico gerado pela IA com fundamentação legal (Art. 13, Lei 13.465/2017)';
    END IF;

    -- Campo de próximo passo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reurb_surveys'
          AND column_name = 'analise_ia_proximo_passo'
    ) THEN
        ALTER TABLE reurb_surveys ADD COLUMN analise_ia_proximo_passo TEXT;
        COMMENT ON COLUMN reurb_surveys.analise_ia_proximo_passo IS 'Próximos passos administrativos sugeridos pela IA';
    END IF;

    -- Campo de timestamp da geração
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reurb_surveys'
          AND column_name = 'analise_ia_gerada_em'
    ) THEN
        ALTER TABLE reurb_surveys ADD COLUMN analise_ia_gerada_em TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN reurb_surveys.analise_ia_gerada_em IS 'Data e hora em que a análise da IA foi gerada';
    END IF;
END $$;
