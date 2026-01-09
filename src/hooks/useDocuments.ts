import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '@/services/documentService';
import { ReurbDocument } from '@/types/reurb.types';
import { toast } from 'sonner';

export function useDocuments(projectId: string) {
  const queryClient = useQueryClient();

  // Query para listar documentos
  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ReurbDocument[]>({
    queryKey: ['documents', projectId],
    queryFn: () => documentService.listDocuments(projectId),
    enabled: !!projectId,
  });

  // Mutation para upload de documento
  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentService.uploadDocument(file, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao enviar documento:', error);
      toast.error(`Erro ao enviar documento: ${error.message}`);
    },
  });

  // Mutation para exclusão de documento
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documentService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Documento excluído com sucesso');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir documento:', error);
      toast.error(`Erro ao excluir documento: ${error.message}`);
    },
  });

  // Mutation para atualizar status do documento
  const updateStatusMutation = useMutation({
    mutationFn: ({
      documentId,
      status,
      observacoes,
    }: {
      documentId: string;
      status: 'pendente' | 'aprovado' | 'rejeitado';
      observacoes?: string;
    }) => documentService.updateDocumentStatus(documentId, status, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Status do documento atualizado');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  // Função para baixar documento
  const downloadDocument = async (document: ReurbDocument) => {
    try {
      const blob = await documentService.downloadDocument(document.caminho_arquivo);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.nome_arquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  return {
    documents,
    isLoading,
    error,
    refetch,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateDocumentStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    downloadDocument,
  };
}
