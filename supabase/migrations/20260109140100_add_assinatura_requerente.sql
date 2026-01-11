-- Migration: Add assinatura_requerente field to reurb_surveys
-- Date: 2026-01-09
-- Description: Adiciona campo TEXT para armazenar a assinatura do requerente (base64)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reurb_surveys'
          AND column_name = 'assinatura_requerente'
    ) THEN
        ALTER TABLE reurb_surveys ADD COLUMN assinatura_requerente TEXT;
        COMMENT ON COLUMN reurb_surveys.assinatura_requerente IS 'Assinatura digital do requerente em formato base64 (data URL)';
    END IF;
END $$;
