-- Fix reurb-images bucket MIME type restrictions
-- Execute no Supabase SQL Editor

-- 1. Verificar configuração atual do bucket
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'reurb-images';

-- 2. OPÇÃO A: Remover restrições de MIME type (RECOMENDADO)
-- Permite todos os tipos de arquivo
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE name = 'reurb-images';

-- 3. OPÇÃO B (Alternativa): Corrigir lista truncada
-- Se preferir manter restrições, use lista completa
/*
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/bmp',
  'image/tiff'
]
WHERE name = 'reurb-images';
*/

-- 4. Verificar se foi atualizado
SELECT 
  name,
  allowed_mime_types,
  file_size_limit,
  public
FROM storage.buckets 
WHERE name = 'reurb-images';
