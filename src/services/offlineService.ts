import localforage from 'localforage';

// Configuração do banco local
localforage.config({
  name: 'REURB_Offline',
  storeName: 'vistorias_pendentes',
  description: 'Armazenamento offline de vistorias pendentes de sincronização'
});

export interface OfflineVistoria {
  id: string;
  dados: any;
  fotoBlob: Blob | File | null;
  timestamp: string;
  tentativas: number;
}

export const offlineService = {
  // Salva a vistoria no celular
  async salvarVistoriaOffline(dados: any, foto: File | Blob | null) {
    const id = crypto.randomUUID();
    
    const registro: OfflineVistoria = {
      id,
      dados,
      fotoBlob: foto, 
      timestamp: new Date().toISOString(),
      tentativas: 0
    };

    try {
      await localforage.setItem(id, registro);
      console.log(`Vistoria ${id} salva offline com sucesso.`);
      return id;
    } catch (error) {
      console.error('Erro ao salvar vistoria offline:', error);
      throw error;
    }
  },

  // Busca tudo que está pendente no celular
  async listarPendentes(): Promise<OfflineVistoria[]> {
    const pendentes: OfflineVistoria[] = [];
    try {
      await localforage.iterate((value: OfflineVistoria, key, iterationNumber) => {
        pendentes.push(value);
      });
      return pendentes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Erro ao listar pendentes:', error);
      return [];
    }
  },

  // Busca um item específico
  async getItem(id: string): Promise<OfflineVistoria | null> {
    return await localforage.getItem<OfflineVistoria>(id);
  },

  // Deleta do celular após sincronizar
  async removerDoCelular(id: string) {
    try {
      await localforage.removeItem(id);
      console.log(`Item ${id} removido do armazenamento local.`);
    } catch (error) {
      console.error(`Erro ao remover item ${id}:`, error);
    }
  },
  
  // Limpa todo o armazenamento (cuidado!)
  async limparTudo() {
    await localforage.clear();
  }
};
