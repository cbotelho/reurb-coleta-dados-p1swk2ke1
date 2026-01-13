import { useState, useEffect } from 'react';
import { offlineService } from '@/services/offlineService';
import { syncManager } from '@/services/syncManager';
import { Button } from '@/components/ui/button';
import { CloudUpload, Wifi, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PainelSincronizacao() {
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const atualizarContagem = async () => {
    const lista = await offlineService.listarPendentes();
    setTotalPendentes(lista.length);
  };

  useEffect(() => {
    atualizarContagem();
    // Atualiza a cada 2 segundos para dar feedback rápido após salvar
    const interval = setInterval(atualizarContagem, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSincronizar = async () => {
    if (!navigator.onLine) {
       toast.error("Sem conexão de internet! Conecte-se ao Wi-Fi.");
       return;
    }

    setIsSyncing(true);
    try {
      const result = await syncManager.sincronizarTudo();
       if (result.total > 0) {
        if (result.failures === 0) {
          toast.success(`${result.successes} vistorias sincronizadas com sucesso!`);
        } else {
          toast.warning(`${result.successes} enviadas, ${result.failures} falharam. Tente novamente.`);
        }
      } else {
        toast.info('Todas as vistorias já estão sincronizadas.');
      }
      await atualizarContagem();
    } catch (e) {
      console.error(e);
      toast.error("Erro na sincronização. Verifique sua conexão.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (totalPendentes === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 p-4 mb-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
            <CloudUpload className="text-amber-700 h-5 w-5" />
        </div>
        <div>
            <p className="text-sm font-bold text-amber-900">
                {totalPendentes} {totalPendentes === 1 ? 'vistoria pendente' : 'vistorias pendentes'} no celular
            </p>
            <p className="text-xs text-amber-700">
                Não gaste seus dados! Sincronize quando tiver Wi-Fi.
            </p>
        </div>
      </div>
      
      <Button 
        onClick={handleSincronizar}
        disabled={isSyncing}
        size="sm"
        className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white gap-2 font-semibold shadow-md"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            Sincronizar Agora (Wi-Fi)
          </>
        )}
      </Button>
    </div>
  );
}
