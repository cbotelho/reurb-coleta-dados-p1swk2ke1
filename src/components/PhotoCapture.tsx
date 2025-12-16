import React, { useState } from 'react'
import { Camera, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PhotoCaptureProps {
  initialPhotos?: string[]
  onPhotosChange: (photos: string[]) => void
}

export function PhotoCapture({
  initialPhotos = [],
  onPhotosChange,
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const newPhotos: string[] = []
      Array.from(files).forEach((file) => {
        // Create a fake local URL or base64.
        // For persistence in localStorage, we really need Base64, but for demo of "Offline" logic
        // without crashing localStorage quota, we will use a compressed version or object URL if ephemeral.
        // Spec says: "Offline First... saved to SQLite". I will try Base64.
        const reader = new FileReader()
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // In a real app we'd resize here.
            setPhotos((prev) => {
              const updated = [...prev, reader.result as string]
              onPhotosChange(updated)
              return updated
            })
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index)
    setPhotos(updated)
    onPhotosChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
            multiple
          />
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
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
          />
          <Button
            type="button"
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Galeria
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
          >
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
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
    </div>
  )
}
