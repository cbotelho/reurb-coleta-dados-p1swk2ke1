import { supabase } from '@/lib/supabase/client';
import { ReurbDocument, ReurbDocumentUpload } from '@/types/reurb.types';

export const documentService = {
  // Upload de documento
  async uploadDocument(file: File, projectId: string): Promise<ReurbDocument> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}/${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    // Upload para o storage
    const { error: uploadError } = await supabase.storage
      .from('reurb-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Salvar metadados no banco
    const { data, error: dbError } = await supabase
      .from('reurb_documentos')
      .insert([
        {
          projeto_id: projectId,
          nome_arquivo: file.name,
          caminho_arquivo: filePath,
          tipo_documento: file.type,
          tamanho: file.size,
          status: 'pendente',
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  // Listar documentos do projeto
  async listDocuments(projectId: string): Promise<ReurbDocument[]> {
    const { data, error } = await supabase
      .from('reurb_documentos')
      .select('*')
      .eq('projeto_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Baixar documento
  async downloadDocument(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('reurb-documents')
      .download(filePath);

    if (error) throw error;
    return data;
  },

  // Excluir documento
  async deleteDocument(documentId: string): Promise<void> {
    // Primeiro obtém o caminho do arquivo
    const { data: document, error: fetchError } = await supabase
      .from('reurb_documentos')
      .select('caminho_arquivo')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Remove do storage
    if (document?.caminho_arquivo) {
      const { error: storageError } = await supabase.storage
        .from('reurb-documents')
        .remove([document.caminho_arqufo]);

      if (storageError) {
        console.error('Erro ao remover arquivo do storage:', storageError);
        // Continua mesmo se falhar para tentar remover do banco
      }
    }

    // Remove do banco de dados
    const { error: dbError } = await supabase
      .from('reurb_documentos')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;
  },

  // Atualizar status do documento
  async updateDocumentStatus(
    documentId: string,
    status: 'pendente' | 'aprovado' | 'rejeitado',
    observacoes?: string
  ): Promise<ReurbDocument> {
    const { data, error } = await supabase
      .from('reurb_documentos')
      .update({ status, observacoes })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
