import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { File, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { documentService } from '@/services/documentService';

type FileWithPreview = File & {
  preview: string;
  progress?: number;
  error?: string;
};

interface DocumentUploaderProps {
  projectId: string;
  onUploadSuccess?: (document: any) => void;
  className?: string;
  accept?: {
    [key: string]: string[];
  };
  maxSize?: number; // in bytes (default: 10MB)
  maxFiles?: number;
}

export function DocumentUploader({
  projectId,
  onUploadSuccess,
  className,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.jpeg', '.jpg', '.png'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      // Handle rejected files
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0].code === 'file-too-large') {
          toast({
            title: 'Arquivo muito grande',
            description: `O arquivo ${rejection.file.name} excede o tamanho máximo de ${maxSize / 1024 / 1024}MB`,
            variant: 'destructive',
          });
        } else if (rejection.errors[0].code === 'file-invalid-type') {
          toast({
            title: 'Tipo de arquivo não suportado',
            description: `O tipo do arquivo ${rejection.file.name} não é suportado`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao adicionar arquivo',
            description: `Não foi possível adicionar o arquivo ${rejection.file.name}`,
            variant: 'destructive',
          });
        }
        return;
      }

      // Add preview to accepted files
      const filesWithPreview = acceptedFiles.map((file) => {
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
          progress: 0,
        });
        return fileWithPreview;
      });

      setFiles((prevFiles) => [...prevFiles, ...filesWithPreview].slice(0, maxFiles));
    },
    [maxSize, maxFiles, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled: isUploading || files.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedFiles: any[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress
        setFiles((prevFiles) =>
          prevFiles.map((f, idx) =>
            idx === i ? { ...f, progress: 10, error: undefined } : f
          )
        );

        try {
          const uploadedFile = await documentService.uploadDocument(file, projectId);
          
          // Update progress to 100% on success
          setFiles((prevFiles) =>
            prevFiles.map((f, idx) =>
              idx === i ? { ...f, progress: 100 } : f
            )
          );
          
          uploadedFiles.push(uploadedFile);
          
          if (onUploadSuccess) {
            onUploadSuccess(uploadedFile);
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          setFiles((prevFiles) =>
            prevFiles.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    error: 'Erro ao enviar o arquivo. Tente novamente.',
                    progress: 0,
                  }
                : f
            )
          );
          
          toast({
            title: 'Erro no upload',
            description: `Não foi possível enviar o arquivo ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      // Clear successfully uploaded files
      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.progress !== 100 && !file.error)
      );

      if (uploadedFiles.length > 0) {
        toast({
          title: 'Upload concluído',
          description: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up object URLs to avoid memory leaks
  React.useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          (isUploading || files.length >= maxFiles) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {isDragActive ? (
              <p>Solte os arquivos aqui...</p>
            ) : (
              <p>
                Arraste e solte arquivos aqui, ou clique para selecionar
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {`Formatos suportados: ${Object.values(accept)
              .flat()
              .join(', ')}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {`Tamanho máximo: ${maxSize / 1024 / 1024}MB por arquivo`}
          </p>
          {maxFiles > 1 && (
            <p className="text-xs text-muted-foreground">
              {`Máximo de ${maxFiles} arquivos`}
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Arquivos selecionados</h4>
            <span className="text-xs text-muted-foreground">
              {files.length} de {maxFiles} arquivos
            </span>
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={file.name + index}
                className="border rounded-md p-3 text-sm relative"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <File className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="font-medium truncate">{file.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    {file.error ? (
                      <div className="flex items-center mt-1 text-destructive text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>{file.error}</span>
                      </div>
                    ) : file.progress === 100 ? (
                      <div className="flex items-center mt-1 text-green-600 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Enviado com sucesso</span>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <Progress
                          value={file.progress || 0}
                          className="h-1.5"
                        />
                        <div className="text-right text-xs text-muted-foreground mt-0.5">
                          {file.progress || 0}%
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={uploadFiles}
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? 'Enviando...' : `Enviar ${files.length} arquivo(s)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentUploader;
