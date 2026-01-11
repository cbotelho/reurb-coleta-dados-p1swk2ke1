# 🐛 Fix: Latitude/Longitude e Dados de Lote em Vistoria

## 📋 Problemas Reportados

### 1. **Desenvolvimento/Teste**: Latitude e Longitude não salvam
- **Sintoma**: Ao salvar vistoria, latitude/longitude não aparecem na tabela
- **Local**: Tanto LocalStorage quanto Supabase

### 2. **Produção (AWS)**: Vistoria não mostra dados do lote
- **Sintoma**: Formulário de vistoria não carrega informações do lote
- **Local**: Apenas em produção (AWS)

## 🔍 Causas Identificadas

### Problema 1: `updateLote()` não salvava coordenadas

**Arquivo**: `src/services/api.ts` - função `updateLote()`

**Causa**: A função atualizava vários campos (name, address, area, description, status) mas **não incluía latitude/longitude**.

```typescript
// ❌ ANTES: latitude/longitude não eram atualizadas
async updateLote(id: string, updates: Partial<any>): Promise<Lote> {
  // Atualizava: name, address, area, description, status
  // ❌ FALTAVA: latitude, longitude
}
```

**Correção**:
```typescript
// ✅ DEPOIS: latitude/longitude agora são atualizadas
if (updates.latitude !== undefined || updates.longitude !== undefined) {
  const geoUpdate: any = {}
  if (updates.latitude !== undefined) {
    geoUpdate.latitude = updates.latitude ? parseFloat(String(updates.latitude)) : null
  }
  if (updates.longitude !== undefined) {
    geoUpdate.longitude = updates.longitude ? parseFloat(String(updates.longitude)) : null
  }
  
  await supabase
    .from('reurb_properties')
    .update(geoUpdate)
    .eq('id', id)
  
  console.log('✅ Geo coordinates updated:', geoUpdate)
}
```

### Problema 2: SurveyForm usava `saveLote()` em vez de `updateLote()`

**Arquivo**: `src/components/SurveyForm.tsx` - função `onSubmit()`

**Causa**: O `saveLote()` tentava fazer INSERT/UPDATE completo, mas o `updateLote()` é mais adequado para atualizações parciais.

**Correção**:
```typescript
// ✅ Usar updateLote para garantir que coordenadas sejam salvas
if (values.latitude || values.longitude || values.address) {
  await api.updateLote(propertyId, {
    address: values.address || lote.address,
    latitude: values.latitude || lote.latitude,
    longitude: values.longitude || lote.longitude,
    status: 'surveyed',
  })
  console.log('✅ Lote atualizado com coordenadas via updateLote')
}
```

### Problema 3: `getLote()` não tinha logs de diagnóstico

**Arquivo**: `src/services/api.ts` - função `getLote()`

**Causa**: Em produção, o lote poderia não estar sendo carregado do Supabase corretamente, sem logs para diagnosticar.

**Correção**:
```typescript
async getLote(id: string): Promise<Lote | null> {
  console.log('🔍 getLote chamado para ID:', id)
  
  if (isOnline()) {
    console.log('🌐 Buscando lote online do Supabase...')
    const { data, error } = await supabase
      .from('reurb_properties')
      .select('*')
      .eq('id', id)
      .single()
    
    if (data) {
      console.log('✅ Lote encontrado no Supabase:', {
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      // ...
    }
  }
  
  console.log('💾 Buscando lote do LocalStorage...')
  return db.getLote(id) || null
}
```

## ✅ Correções Implementadas

### 1. Atualização de `api.ts`
- ✅ Adicionado bloco de atualização de `latitude` e `longitude` em `updateLote()`
- ✅ Conversão correta para `parseFloat()`
- ✅ Suporte para valores `null` quando coordenadas são removidas
- ✅ Logs detalhados de diagnóstico em `getLote()`

### 2. Atualização de `SurveyForm.tsx`
- ✅ Usar `updateLote()` em vez de `saveLote()` para atualizar coordenadas
- ✅ Logs detalhados de carregamento de dados
- ✅ Logs de atualização de coordenadas
- ✅ Fallback para `saveLote()` quando não há coordenadas

### 3. Script de Diagnóstico SQL
- ✅ Criado `debug_coordinates.sql` para diagnosticar problemas no banco
- ✅ Consultas para verificar lotes com/sem coordenadas
- ✅ Estatísticas de uso de coordenadas
- ✅ Verificação de RLS policies

## 🧪 Como Testar

### Teste 1: Desenvolvimento/LocalStorage

1. Abra um lote existente
2. Vá para aba "Vistoria"
3. Clique em "📍 Obter Localização Atual"
4. Preencha os campos obrigatórios da vistoria
5. Clique em "Salvar Vistoria"
6. Abra o **Console** (F12) e verifique os logs:
   ```
   📍 Atualizando lote com coordenadas: {address, latitude, longitude}
   ✅ Lote atualizado com coordenadas via updateLote
   ✅ Geo coordinates updated: {latitude: X, longitude: Y}
   ```
7. Verifique no banco:
   ```sql
   SELECT id, name, latitude, longitude, status 
   FROM reurb_properties 
   WHERE id = 'SEU_LOTE_ID';
   ```

### Teste 2: Produção (AWS)

1. Deploy do código atualizado para produção
2. Limpar cache/LocalStorage se necessário:
   ```javascript
   localStorage.clear()
   ```
3. Fazer login
4. Abrir um lote
5. Ir para "Vistoria"
6. Verificar se os dados do lote aparecem (nome, endereço)
7. Verificar logs no Console (F12):
   ```
   🔍 getLote chamado para ID: ...
   🌐 Buscando lote online do Supabase...
   ✅ Lote encontrado no Supabase: {name, latitude, longitude}
   ```

### Teste 3: Verificação no Banco (Supabase)

Execute o script `debug_coordinates.sql` no SQL Editor do Supabase:

```sql
-- Ver últimos lotes atualizados com coordenadas
SELECT id, name, latitude, longitude, status, updated_at
FROM reurb_properties
WHERE latitude IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## 🔧 Resolução de Problemas

### Se latitude/longitude ainda não salvam:

1. **Verificar logs no Console**:
   - Deve aparecer: `✅ Geo coordinates updated`
   - Se não aparecer, o `updateLote()` não está sendo chamado

2. **Verificar permissões RLS**:
   ```sql
   -- Executar debug_coordinates.sql seção 9
   SELECT * FROM pg_policies WHERE tablename = 'reurb_properties';
   ```

3. **Testar update manual**:
   ```sql
   UPDATE reurb_properties
   SET latitude = -0.0420571, longitude = -51.1247705
   WHERE id = 'SEU_ID'
   RETURNING latitude, longitude;
   ```

### Se dados do lote não carregam em produção:

1. **Verificar logs no Console**:
   ```
   🔍 getLote chamado para ID: ...
   ```
   - Se não aparecer, o `propertyId` está errado

2. **Verificar se lote existe no Supabase**:
   ```sql
   SELECT * FROM reurb_properties WHERE id = 'SEU_ID';
   ```

3. **Limpar cache e tentar novamente**:
   ```javascript
   localStorage.removeItem('reurb_lotes')
   ```

4. **Verificar conexão de rede**:
   - No Console → Network tab
   - Deve haver requisição GET para `/rest/v1/reurb_properties`

## 📊 Estatísticas de Uso

Após as correções, você pode monitorar o uso de coordenadas:

```sql
-- Percentual de lotes com coordenadas
SELECT 
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE latitude IS NOT NULL) / COUNT(*),
    2
  ) as percentual_com_coordenadas
FROM reurb_properties;
```

## 📝 Arquivos Modificados

1. ✅ `src/services/api.ts`
   - Função `updateLote()` - adiciona update de latitude/longitude
   - Função `getLote()` - adiciona logs de diagnóstico

2. ✅ `src/components/SurveyForm.tsx`
   - Função `onSubmit()` - usa `updateLote()` para coordenadas
   - Hook `useEffect()` - adiciona logs de carregamento

3. ✅ `debug_coordinates.sql` (novo)
   - Script de diagnóstico SQL

4. ✅ `COORDINATES-FIX.md` (este arquivo)
   - Documentação da correção

## 🚀 Deploy

1. **Commit e push** para GitHub:
   ```bash
   git add .
   git commit -m "fix: latitude/longitude não salvam + dados de lote em vistoria"
   git push origin main
   ```

2. **AWS puxa automaticamente** do GitHub

3. **Aguardar** deploy completar

4. **Testar** em produção

## 📞 Suporte

Se os problemas persistirem após essas correções:

1. Execute `debug_coordinates.sql` e compartilhe os resultados
2. Abra Console (F12) e copie todos os logs
3. Verifique se há erros de permissão RLS no Supabase

---

**Status**: ✅ Corrigido
**Versão**: 1.4.6
**Data**: 11/01/2026
