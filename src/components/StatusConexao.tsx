import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { syncManager } from '@/services/syncManager';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function StatusConexao() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Você precisa estar online para sincronizar.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncManager.sincronizarTudo();
      if (result.total > 0) {
        if (result.failures === 0) {
          toast.success(`${result.successes} vistorias sincronizadas com sucesso!`);
        } else {
          toast.warning(`${result.successes} enviadas, ${result.failures} falharam.`);
        }
      } else {
        toast.info('Nada para sincronizar.');
      }
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
      toast.error('Erro ao sincronizar.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-2 text-center text-sm flex items-center justify-center gap-2 z-50">
        <Wifi className="h-4 w-4" />
        <span>Online - Sistema Operante</span>
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-6 text-xs bg-white text-green-700 hover:bg-green-50 ml-2"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
             <RefreshCw className="h-3 w-3 animate-spin mr-1" />
          ) : (
             <RefreshCw className="h-3 w-3 mr-1" />
          )}
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Pendentes'}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm flex items-center justify-center gap-2 z-50">
      <WifiOff className="h-4 w-4" />
      <span>Offline - Modo desconectado (Salvando localmente)</span>
    </div>
  );
}
