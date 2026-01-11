import React, { useState, useEffect } from 'react'
import { Camera, Image as ImageIcon, X, Loader2, Upload, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { imageService } from '@/services/imageService'
import { useToast } from '@/hooks/use-toast'
import { useSync } from '@/contexts/SyncContext'

interface PhotoCaptureProps {
  initialPhotos?: string[]
  onPhotosChange: (photos: string[]) => void
  propertyId?: string // ID do lote para organizar uploads
}

export function PhotoCapture({
  initialPhotos = [],
  onPhotosChange,
  propertyId = 'temp',
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const { toast } = useToast()
  const { isOnline } = useSync()

  // Sincroniza estado interno com props inicial (sem causar re-render infinito)
  useEffect(() => {
    if (initialPhotos.length !== photos.length || 
        !initialPhotos.every((photo, index) => photo === photos[index])) {
      setPhotos(initialPhotos)
    }
  }, [initialPhotos])

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Se offline, gera URLs locais temporárias
    if (!isOnline) {
      const tempUrls: string[] = []
      Array.from(files).forEach((file) => {
        const objectUrl = URL.createObjectURL(file)
        tempUrls.push(objectUrl)
      })

      const updated = [...photos, ...tempUrls]
      setPhotos(updated)
      onPhotosChange(updated)

      toast({
        title: 'Modo Offline',
        description:
          'Fotos salvas localmente. Serão enviadas quando voltar online.',
        className: 'bg-orange-50 border-orange-200 text-orange-800',
      })
      return
    }

    // Se online, faz upload para Supabase
    setUploading(true)
    setUploadProgress({ current: 0, total: files.length })

    try {
      const urls = await imageService.uploadImages(
        Array.from(files),
        propertyId,
        (current, total) => {
          setUploadProgress({ current, total })
        },
      )

      const updated = [...photos, ...urls]
      setPhotos(updated)
      onPhotosChange(updated)

      toast({
        title: 'Upload Concluído',
        description: `${urls.length} foto(s) enviada(s) com sucesso!`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Erro no Upload',
        description: 'Falha ao enviar algumas imagens. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(null)
      // Limpar input para permitir selecionar as mesmas fotos novamente
      event.target.value = ''
    }
  }

  const removePhoto = async (index: number) => {
    const photoUrl = photos[index]
    
    // Se for URL do Supabase e online, tenta deletar
    if (
      isOnline &&
      photoUrl &&
      (photoUrl.includes('supabase.co') || photoUrl.startsWith('http'))
    ) {
      try {
        await imageService.deleteImage(photoUrl)
      } catch (error) {
        console.error('Error deleting image:', error)
        // Continua removendo da lista mesmo se falhar no servidor
      }
    }

    // Se for URL temporária (blob:), revoga
    if (photoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(photoUrl)
    }

    const updated = photos.filter((_, i) => i !== index)
    setPhotos(updated)
    onPhotosChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
            multiple
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Tirar Foto
          </Button>
        </div>

        <div className="relative">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
            multiple
            disabled={uploading}
          />
          <Button
            type="button"
            variant="secondary"
            className="flex items-center gap-2"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            Galeria
          </Button>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
            <CloudOff className="h-4 w-4" />
            <span>Modo Offline</span>
          </div>
        )}
      </div>

      {uploadProgress && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Upload className="h-4 w-4 text-blue-600 animate-pulse" />
          <span className="text-sm text-blue-800">
            Enviando {uploadProgress.current} de {uploadProgress.total} fotos...
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {photos.map((photo, index) => (
          <div
            key={`${photo}-${index}`}
            className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
          >
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
              disabled={uploading}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Nenhuma foto anexada.
        </p>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {photos.length} foto{photos.length > 1 ? 's' : ''} anexada
          {photos.length > 1 ? 's' : ''}
          {!isOnline && ' (local)'}
        </p>
      )}
    </div>
  )
}
