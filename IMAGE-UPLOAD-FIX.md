# 🖼️ Solução: QuotaExceededError no Upload de Imagens

## 🔴 Problema Identificado

O erro `QuotaExceededError: Setting the value of 'reurb_lotes' exceeded the quota` ocorre porque:

1. **LocalStorage tem limite de ~5-10MB** por domínio
2. **Imagens base64 são enormes** (uma foto de 3MB vira ~4MB em base64)
3. **Múltiplas fotos** rapidamente excedem a cota do LocalStorage

## ✅ Solução Implementada

### 1. **Novo Serviço de Upload de Imagens** (`imageService.ts`)

- ✅ Upload direto para **Supabase Storage**
- ✅ **Compressão automática** (max 1200x1200px, 80% quality)
- ✅ Armazena apenas **URLs** no LocalStorage (poucos bytes)
- ✅ Suporte **offline** com URLs temporárias (blob:)
- ✅ Função de migração para imagens base64 existentes

### 2. **PhotoCapture Atualizado**

- ✅ Fix do erro `setState() during render`
- ✅ Upload em background com indicador de progresso
- ✅ Modo offline com URLs temporárias
- ✅ Compressão automática antes do upload
- ✅ Exclusão de imagens do Storage ao remover

### 3. **Storage Bucket Configurado**

- ✅ Bucket `reurb-images` público
- ✅ Limite de 10MB por arquivo
- ✅ Políticas RLS configuradas
- ✅ Suporte para JPEG, PNG, WebP, HEIC

## 🚀 Como Aplicar a Solução

### Passo 1: Executar Migration no Supabase

1. Abra o **SQL Editor** no painel do Supabase
2. Cole o conteúdo de:
   ```
   supabase/migrations/20260111120000_create_storage_bucket_images.sql
   ```
3. Execute o script (botão "Run")

### Passo 2: Verificar Bucket Criado

1. Vá em **Storage** no painel do Supabase
2. Confirme que o bucket `reurb-images` existe
3. Verifique que está configurado como **público**

### Passo 3: Limpar LocalStorage (Opcional)

Se seu LocalStorage já está cheio com imagens base64:

```javascript
// No console do navegador
localStorage.removeItem('reurb_lotes')
// Ou limpar tudo:
localStorage.clear()
```

**⚠️ ATENÇÃO**: Isso apagará dados locais não sincronizados!

### Passo 4: Migrar Imagens Existentes (Opcional)

Se você tem imagens base64 no LocalStorage que deseja manter:

```javascript
// No console do navegador (após fazer login)
import { migrateBase64ImagesToStorage } from './src/utils/migrateImages'
await migrateBase64ImagesToStorage()
```

## 📊 Benefícios da Solução

| Aspecto | Antes (Base64) | Depois (Storage) |
|---------|---------------|------------------|
| **Tamanho no LocalStorage** | ~4MB por foto | ~100 bytes (URL) |
| **Limite prático** | ~2-3 fotos | Ilimitado |
| **Performance** | Lenta (parse JSON) | Rápida (URLs diretas) |
| **Compartilhamento** | Impossível | URLs públicas |
| **Sincronização** | Pesada | Leve |

## 🔧 Uso no Código

### Upload de Imagens

```typescript
import { imageService } from '@/services/imageService'

// Upload único
const url = await imageService.uploadImage(file, propertyId)

// Upload múltiplo com progresso
const urls = await imageService.uploadImages(
  files,
  propertyId,
  (current, total) => {
    console.log(`Enviando ${current} de ${total}`)
  }
)
```

### Componente PhotoCapture

```tsx
<PhotoCapture
  initialPhotos={lote.images || []}
  onPhotosChange={(photos) => setImages(photos)}
  propertyId={lote.local_id}
/>
```

## ⚙️ Configurações

### Limites de Compressão

Ajustar em `imageService.ts`:

```typescript
const maxWidth = 1200  // Largura máxima em pixels
const maxHeight = 1200 // Altura máxima em pixels
const quality = 0.8    // Qualidade (0-1)
```

### Limite de Tamanho do Bucket

Ajustar na migration:

```sql
file_size_limit: 10485760, -- 10MB
```

## 🐛 Troubleshooting

### Erro: "Failed to upload image"

**Causa**: Bucket não existe ou permissões incorretas

**Solução**:
1. Execute a migration novamente
2. Verifique RLS policies no Supabase
3. Confirme que usuário está autenticado

### Erro: "Failed to delete image"

**Causa**: URL inválida ou arquivo já deletado

**Solução**: É seguro ignorar, o sistema continua funcionando

### LocalStorage ainda está cheio

**Causa**: Imagens base64 antigas ainda armazenadas

**Solução**:
1. Execute o script de migração
2. Ou limpe o LocalStorage manualmente

## 📝 Notas Adicionais

### Modo Offline

- ✅ Imagens ficam em URLs temporárias (`blob:`)
- ✅ Upload automático quando voltar online (futuro)
- ⚠️ URLs temporárias **não persistem** após fechar navegador

### Performance

- Compressão ocorre no client (não sobrecarrega servidor)
- Upload paralelo de múltiplas imagens
- Lazy loading de imagens na UI

### Segurança

- Bucket público (imagens visíveis para qualquer um com URL)
- RLS impede uploads não autenticados
- Validação de tipos MIME no servidor

## 🔗 Arquivos Relacionados

- `src/services/imageService.ts` - Serviço principal
- `src/components/PhotoCapture.tsx` - Componente de upload
- `src/pages/LoteForm.tsx` - Formulário de lote
- `supabase/migrations/20260111120000_create_storage_bucket_images.sql` - Migration
- `src/utils/migrateImages.ts` - Script de migração

---

**Status**: ✅ Implementado e testado
**Versão**: 1.4.5
**Data**: 11/01/2026
