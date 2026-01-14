-- Script para corrigir permissões do Storage (reurb-images)
-- Autor: GitHub Copilot
-- Data: 13/01/2026

-- 1. Garantir que o bucket existe e é público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reurb-images', 
  'reurb-images', 
  true, 
  52428800, -- 50MB limit
  NULL -- Allow all mime types
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  allowed_mime_types = NULL,
  file_size_limit = 52428800;

-- 2. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Imagens são públicas para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar imagens" ON storage.objects;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;

-- 3. Criar políticas permissivas (Simples e Robustas) for 'reurb-images' directory

-- LEITURA: Qualquer um pode ler (já que o bucket é público, mas RLs se aplicam a objetos)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'reurb-images' );

-- UPLOAD: Qualquer usuário autenticado (logado no app)
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'reurb-images' );

-- UPDATE: Qualquer usuário autenticado (para simplificar, ou restringir ao owner)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'reurb-images' );

-- DELETE: Qualquer usuário autenticado
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'reurb-images' );

-- 4. Verificar se a RLS está ativa no storage.objects (normalmente já é padrão no Supabase)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
