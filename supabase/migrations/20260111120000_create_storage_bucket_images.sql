-- =====================================================
-- Migration: Create Supabase Storage Bucket for Images
-- Date: 2026-01-11
-- Description: Creates storage bucket for property images
--              with proper RLS policies
-- =====================================================

BEGIN;

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reurb-images',
  'reurb-images',
  true, -- public bucket for easy access
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS Policies for Storage Bucket
-- =====================================================

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reurb-images' AND
  auth.uid() IS NOT NULL
);

-- Policy: Allow authenticated users to update their images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'reurb-images' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'reurb-images' AND auth.uid() IS NOT NULL);

-- Policy: Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reurb-images' AND auth.uid() IS NOT NULL);

-- Policy: Allow public read access to images (since bucket is public)
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reurb-images');

-- =====================================================
-- Additional: Create table to track image metadata (optional)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reurb_image_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES reurb_properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT unique_storage_path UNIQUE(storage_path)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_image_metadata_property_id 
ON reurb_image_metadata(property_id);

CREATE INDEX IF NOT EXISTS idx_image_metadata_uploaded_at 
ON reurb_image_metadata(uploaded_at DESC);

-- RLS for image metadata table
ALTER TABLE reurb_image_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view image metadata"
ON reurb_image_metadata FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert image metadata"
ON reurb_image_metadata FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their image metadata"
ON reurb_image_metadata FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their image metadata"
ON reurb_image_metadata FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

COMMIT;

-- =====================================================
-- Rollback (if needed)
-- =====================================================
-- BEGIN;
-- DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'reurb-images';
-- DROP TABLE IF EXISTS reurb_image_metadata;
-- COMMIT;
