import React, { useState } from 'react'
import { FileUp, File, X, Loader2, Download, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DocumentItem {
  id: string
  name: string
  size: number
  type: string
  url?: string
  data?: string // base64 para armazenamento offline
  uploadedAt?: Date | string
}

interface DocumentUploadProps {
  initialDocuments?: DocumentItem[]
  onDocumentsChange: (documents: DocumentItem[]) => void
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  disabled?: boolean
}

export function DocumentUpload({
  initialDocuments = [],
  onDocumentsChange,
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  disabled = false,
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 2048
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️'
    } else if (type.includes('pdf')) {
      return '📄'
    } else if (type.includes('word') || type.includes('document')) {
      return '📝'
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return '📊'
    }
    return '📎'
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (documents.length + files.length > maxFiles) {
      alert(`Você pode enviar no máximo ${maxFiles} documentos`)
      return
    }

    setUploading(true)

    try {
      const newDocuments: DocumentItem[] = []

      for (const file of Array.from(files)) {
        // Validar tipo
        if (!acceptedTypes.includes(file.type)) {
          alert(`Tipo de arquivo não aceito: ${file.name}`)
          continue
        }

        // Validar tamanho
        const maxSizeBytes = maxSizeMB * 2048 * 2048
        if (file.size > maxSizeBytes) {
          alert(
            `Arquivo muito grande: ${file.name}. Tamanho máximo: ${maxSizeMB}MB`
          )
          continue
        }

        // Converter para base64 para armazenamento offline
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result)
            } else {
              reject(new Error('Erro ao ler arquivo'))
            }
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const doc: DocumentItem = {
          id: `doc-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          uploadedAt: new Date(),
        }

        newDocuments.push(doc)
      }

      const updated = [...documents, ...newDocuments]
      setDocuments(updated)
      onDocumentsChange(updated)
    } catch (error) {
      console.error('Erro ao processar documentos:', error)
      alert('Erro ao processar documentos')
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ''
    }
  }

  const removeDocument = (id: string) => {
    const updated = documents.filter((doc) => doc.id !== id)
    setDocuments(updated)
    onDocumentsChange(updated)
    setDeleteTarget(null)
  }

  const downloadDocument = (doc: DocumentItem) => {
    if (doc.data) {
      // Criar link temporário para download
      const link = document.createElement('a')
      link.href = doc.data
      link.download = doc.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (doc.url) {
      window.open(doc.url, '_blank')
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          disabled
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer',
          uploading && 'opacity-50'
        )}
      >
        <div className="relative">
          <input
            type="file"
            accept={acceptedTypes.join(',')}
            className={cn(
              'absolute inset-0 w-full h-full opacity-0 z-10',
              disabled || uploading ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
            onChange={handleFileChange}
            multiple
            disabled={disabled || uploading || documents.length >= maxFiles}
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            ) : (
              <FileUp className="h-10 w-10 text-blue-500" />
            )}
            <div>
              <p className="font-medium text-sm">
                {uploading
                  ? 'Processando documentos...'
                  : 'Clique ou arraste documentos aqui'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Máximo {maxFiles} arquivos, até {maxSizeMB}MB cada
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, Imagens, Word, Excel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Documentos */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Documentos Anexados ({documents.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Ícone */}
                    <div className="text-2xl">{getFileIcon(doc.type)}</div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.size)}
                        </span>
                        {doc.uploadedAt && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(doc)}
                        disabled={disabled}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(doc.id)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Alert para confirmar exclusão */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este documento? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && removeDocument(deleteTarget)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
