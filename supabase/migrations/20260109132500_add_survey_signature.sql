DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reurb_surveys'
          AND column_name = 'surveyor_signature'
    ) THEN
        ALTER TABLE reurb_surveys ADD COLUMN surveyor_signature TEXT;
    END IF;
END $$;
