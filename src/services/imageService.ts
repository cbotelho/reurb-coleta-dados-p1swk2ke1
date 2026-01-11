import { supabase } from '@/lib/supabase/client'

/**
 * Serviço para gerenciar upload de imagens
 * Armazena imagens no Supabase Storage em vez de LocalStorage
 */
export const imageService = {
  /**
   * Comprime uma imagem antes de fazer upload
   * @param file - Arquivo de imagem
   * @param maxWidth - Largura máxima (padrão: 1200px)
   * @param maxHeight - Altura máxima (padrão: 1200px)
   * @param quality - Qualidade da compressão (0-1, padrão: 0.8)
   * @returns Promise<Blob> - Imagem comprimida
   */
  async compressImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.8,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calcular novas dimensões mantendo aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            'image/jpeg',
            quality,
          )
        }
        img.onerror = () => reject(new Error('Failed to load image'))
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  },

  /**
   * Faz upload de uma imagem para o Supabase Storage
   * @param file - Arquivo de imagem
   * @param propertyId - ID da propriedade/lote
   * @param compress - Se deve comprimir a imagem (padrão: true)
   * @returns Promise<string> - URL pública da imagem
   */
  async uploadImage(
    file: File,
    propertyId: string,
    compress: boolean = true,
  ): Promise<string> {
    try {
      console.log('📤 Upload iniciado:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        propertyId,
        compress,
      })

      // Comprimir imagem se necessário
      let fileToUpload: File | Blob = file
      if (compress && file.type.startsWith('image/')) {
        const compressedBlob = await this.compressImage(file)
        console.log('✂️ Imagem comprimida:', {
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          blobType: compressedBlob.type,
        })
        
        // Converter Blob em File com tipo correto
        fileToUpload = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
        
        console.log('📦 File criado:', {
          name: fileToUpload.name,
          type: fileToUpload.type,
          size: fileToUpload.size,
        })
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${propertyId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `property-images/${fileName}`

      console.log('🚀 Enviando para Supabase:', {
        filePath,
        fileToUploadType: fileToUpload.type,
        fileToUploadSize: fileToUpload.size,
        isFile: fileToUpload instanceof File,
        isBlob: fileToUpload instanceof Blob,
      })

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('reurb-images')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg', // Especificar MIME type explicitamente
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('reurb-images').getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  },

  /**
   * Faz upload de múltiplas imagens
   * @param files - Array de arquivos de imagem
   * @param propertyId - ID da propriedade/lote
   * @param onProgress - Callback de progresso (opcional)
   * @returns Promise<string[]> - Array de URLs públicas
   */
  async uploadImages(
    files: File[],
    propertyId: string,
    onProgress?: (current: number, total: number) => void,
  ): Promise<string[]> {
    const urls: string[] = []

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await this.uploadImage(files[i], propertyId)
        urls.push(url)
        if (onProgress) {
          onProgress(i + 1, files.length)
        }
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error)
        // Continua com as próximas imagens mesmo se uma falhar
      }
    }

    return urls
  },

  /**
   * Remove uma imagem do Supabase Storage
   * @param imageUrl - URL da imagem
   * @returns Promise<void>
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extrair o caminho do arquivo da URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/reurb-images/')
      if (pathParts.length < 2) {
        throw new Error('Invalid image URL')
      }
      const filePath = pathParts[1]

      const { error } = await supabase.storage
        .from('reurb-images')
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        throw error
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  },

  /**
   * Remove múltiplas imagens
   * @param imageUrls - Array de URLs de imagens
   * @returns Promise<void>
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
    const filePaths: string[] = []

    for (const imageUrl of imageUrls) {
      try {
        const url = new URL(imageUrl)
        const pathParts = url.pathname.split('/reurb-images/')
        if (pathParts.length >= 2) {
          filePaths.push(pathParts[1])
        }
      } catch (error) {
        console.error('Error parsing image URL:', imageUrl, error)
      }
    }

    if (filePaths.length > 0) {
      const { error } = await supabase.storage
        .from('reurb-images')
        .remove(filePaths)

      if (error) {
        console.error('Delete error:', error)
        throw error
      }
    }
  },

  /**
   * Converte base64 para Blob
   * @param base64 - String base64
   * @returns Blob
   */
  base64ToBlob(base64: string): Blob {
    const arr = base64.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  },

  /**
   * Faz upload de imagens em base64 (fallback para dados existentes)
   * @param base64Images - Array de strings base64
   * @param propertyId - ID da propriedade/lote
   * @returns Promise<string[]> - Array de URLs públicas
   */
  async uploadBase64Images(
    base64Images: string[],
    propertyId: string,
  ): Promise<string[]> {
    const urls: string[] = []

    for (const base64 of base64Images) {
      try {
        // Se já é uma URL, mantém
        if (base64.startsWith('http://') || base64.startsWith('https://')) {
          urls.push(base64)
          continue
        }

        // Converter base64 para Blob
        const blob = this.base64ToBlob(base64)
        const file = new File([blob], `image-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })

        // Upload
        const url = await this.uploadImage(file, propertyId)
        urls.push(url)
      } catch (error) {
        console.error('Error uploading base64 image:', error)
      }
    }

    return urls
  },
}
