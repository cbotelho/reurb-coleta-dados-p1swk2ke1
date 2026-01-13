import { supabase } from '@/lib/supabase/client';
import { offlineService, OfflineVistoria } from './offlineService';
import { toast } from 'sonner';

export const syncManager = {
  async sincronizarTudo() {
    const pendentes = await offlineService.listarPendentes();

    if (pendentes.length === 0) {
      return { total: 0, successes: 0, failures: 0 };
    }

    let successes = 0;
    let failures = 0;

    for (const item of pendentes) {
      try {
        console.log(`Iniciando sincronização do item ${item.id}...`);
        
        // 1. Upload da foto (se houver)
        let fotoUrl = null;
        if (item.fotoBlob) {
          const fileExt = item.fotoBlob.type.split('/')[1] || 'jpg';
          const fileName = `${item.id}.${fileExt}`;
          const filePath = `vistorias/${fileName}`;

          const { data, error: storageError } = await supabase.storage
            .from('fotos_vistorias') // Verifique se este bucket existe ou use o correto
            .upload(filePath, item.fotoBlob, {
              upsert: true
            });

          if (storageError) {
            console.error('Erro no upload da foto:', storageError);
            // Se falhar upload, não paramos, tentamos enviar dados sem foto?
            // Ou falhamos o item todo? Melhor falhar o item.
            throw new Error(`Erro upload foto: ${storageError.message}`);
          }

          // Obter URL pública
          const { data: publicUrlData } = supabase.storage
            .from('fotos_vistorias')
            .getPublicUrl(filePath);
            
          fotoUrl = publicUrlData.publicUrl;
        }

        // 2. Preparar payload para reurb_surveys
        // Mesclar dados do formulário com a URL da foto (se a tabela tiver esse campo)
        // Nota: O schema atual em api.ts não mostra um campo 'url_foto' direto na raiz, 
        // mas sim 'documents' ou 'photos' (se existir). 
        // Vamos assumir que 'documents' é o lugar correto ou o campo específico se existir.
        
        const payload = { ...item.dados };
        
        // Remover campos que não devem ir se forem vazios ou locais
        delete payload.id; // Deixar o banco gerar ou usar o ID se for UUID
        
        // Se tiver foto, onde salvar? Vamos tentar injetar em 'documents' se for array
        if (fotoUrl) {
           // Lógica específica do projeto para salvar foto
           // Se o campo for documents JSONB
           const doc = {
             id: crypto.randomUUID(),
             name: 'Foto Vistoria Offline',
             url: fotoUrl,
             type: item.fotoBlob?.type || 'image/jpeg',
             uploadedAt: new Date().toISOString()
           };
           
           if (Array.isArray(payload.documents)) {
             payload.documents.push(doc);
           } else {
             payload.documents = [doc];
           }
        }
        
        // Garantir property_id
        if (!payload.property_id) {
            throw new Error('Item sem property_id');
        }

        // 3. Inserir no Supabase
        const { error: dbError } = await supabase
          .from('reurb_surveys')
          .insert(payload);

        if (dbError) throw dbError;

        // 4. Sucesso: Remover do local
        await offlineService.removerDoCelular(item.id);
        successes++;
        console.log(`Item ${item.id} sincronizado com sucesso.`);

      } catch (error) {
        console.error(`Falha ao sincronizar item ${item.id}:`, error);
        failures++;
        // Não removemos do offline para tentar depois
      }
    }

    return { total: pendentes.length, successes, failures };
  }
};
