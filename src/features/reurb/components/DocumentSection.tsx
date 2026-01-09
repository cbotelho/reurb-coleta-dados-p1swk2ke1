// src/features/reurb/components/DocumentSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, Trash2 } from 'lucide-react';

interface DocumentSectionProps {
  projectId: string;
  canUpload: boolean;
  canDelete: boolean;
  canDownload: boolean;
  className?: string;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  projectId,
  canUpload,
  canDelete,
  canDownload,
  className = '',
}) => {
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Implementar lógica de carregamento de documentos aqui

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Documentos do Projeto</CardTitle>
          {canUpload && (
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Enviar Documento
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Carregando documentos...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-2 text-gray-400" />
            <p>Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{doc.tipo_documento}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {canDownload && (
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSection;