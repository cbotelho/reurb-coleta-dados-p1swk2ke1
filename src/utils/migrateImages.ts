/**
 * Script para migrar imagens base64 existentes no LocalStorage
 * para Supabase Storage
 * 
 * Execute este script no console do navegador após fazer login
 */

import { imageService } from '@/services/imageService'
import { db } from '@/services/db'

export async function migrateBase64ImagesToStorage() {
  console.log('🚀 Iniciando migração de imagens...')
  
  const lotes = db.getAllLotes()
  let totalImages = 0
  let migrated = 0
  let errors = 0
  
  for (const lote of lotes) {
    if (!lote.images || lote.images.length === 0) continue
    
    const base64Images = lote.images.filter(
      img => img.startsWith('data:image/')
    )
    
    if (base64Images.length === 0) {
      console.log(`✅ Lote ${lote.name} já está migrado`)
      continue
    }
    
    totalImages += base64Images.length
    console.log(`📸 Migrando ${base64Images.length} imagens do lote ${lote.name}...`)
    
    try {
      // Upload das imagens base64
      const urls = await imageService.uploadBase64Images(
        base64Images,
        lote.local_id
      )
      
      // Atualizar lote com novas URLs
      const otherImages = lote.images.filter(
        img => !img.startsWith('data:image/')
      )
      
      const updatedImages = [...otherImages, ...urls]
      
      db.saveLote({
        ...lote,
        images: updatedImages
      })
      
      migrated += urls.length
      console.log(`✅ Migradas ${urls.length} imagens do lote ${lote.name}`)
      
    } catch (error) {
      console.error(`❌ Erro ao migrar imagens do lote ${lote.name}:`, error)
      errors += base64Images.length
    }
  }
  
  console.log('\n📊 Resumo da Migração:')
  console.log(`Total de imagens encontradas: ${totalImages}`)
  console.log(`✅ Migradas com sucesso: ${migrated}`)
  console.log(`❌ Erros: ${errors}`)
  console.log('\n🎉 Migração concluída!')
  
  return {
    total: totalImages,
    migrated,
    errors
  }
}

// Para executar no console:
// import { migrateBase64ImagesToStorage } from './src/utils/migrateImages'
// migrateBase64ImagesToStorage()
