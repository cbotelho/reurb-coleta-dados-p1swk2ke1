import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { api } from '@/services/api'
import { syncService } from '@/services/syncService'
import { db } from '@/services/db'
import { DashboardStats, Survey } from '@/types'
import { toast } from 'sonner'

interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean
  stats: DashboardStats
  triggerSync: (fullDownload?: boolean) => Promise<void>
  refreshStats: () => void
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

// Estado inicial baseado nas propriedades que sabemos que existem
const createInitialStats = (): DashboardStats => {
  const stats: Partial<DashboardStats> = {
    collected: 0,
    synced: 0,
    pending: 0,
    pendingImages: 0,
    totalProjects: 0,
    pendingSurveys: 0,
    lastSync: null,
    totalSurveyed: 0,
    totalFamilies: 0,
    totalContracts: 0,
    totalQuadras: 0,
  };
  
  return stats as DashboardStats;
};

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>(createInitialStats())

  // Declara refreshStats ANTES de ser usada nos useEffects
  const refreshStats = useCallback(async () => {
    try {
      const s = await api.getDashboardStats()
      setStats(s)
    } catch (error) {
      console.error('Failed to refresh stats', error)
    }
  }, [])

  // Initialize and Fetch Config - REMOVIDO getAppConfig
  useEffect(() => {
    const initApp = async () => {
      try {
        // Verifique se a API tem getAppConfig ou outra função de configuração
        // Se não tiver, pode pular esta parte ou usar configuração local
        console.log('Inicializando app...')
        
        // Se precisar de configuração, pode ser hardcoded ou de .env
        const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
        
        if (googleMapsApiKey) {
          const currentSettings = db.getSettings()
          if (currentSettings.googleMapsApiKey !== googleMapsApiKey) {
            db.saveSettings({
              ...currentSettings,
              googleMapsApiKey,
            })
          }
        }
      } catch (e) {
        console.error('Failed to initialize app config', e)
      }
    }

    if (navigator.onLine) {
      initApp()
    }
  }, [])

  // Auto-Sync Sweeper: Monitora conexão e sincroniza vistorias pendentes
  useEffect(() => {
    const syncPendingData = async () => {
      if (!isOnline) return

      const pendingItems = db.getPendingItems()
      const pendingSurveys = pendingItems.surveys as Survey[]

      if (pendingSurveys.length > 0) {
        console.log(`📡 Auto-Sync: Encontradas ${pendingSurveys.length} vistorias pendentes.`)
        
        for (const survey of pendingSurveys) {
          try {
            // Tenta enviar para o servidor
            await api.saveSurvey(survey) 
            
            // Se sucesso, atualiza localmente com as propriedades CORRETAS
            const updatedSurvey: Survey = {
              ...survey,
              sync_status: 'synchronized',
              updated_at: new Date().toISOString()
            }
            
            db.saveSurvey(updatedSurvey)
          } catch (e) {
            console.error('❌ Auto-Sync falhou para vistoria:', survey.id)
            break // Para se houver erro de rede real
          }
        }
        // Atualiza estatísticas após processar fila
        refreshStats()
      }
    }

    syncPendingData()
  }, [isOnline, refreshStats])

  const triggerSync = useCallback(
    async (fullDownload = false) => {
      if (!navigator.onLine) {
        toast.warning('Sem conexão com a internet.')
        return
      }

      setIsSyncing(true)
      try {
        // 0. Update Config - REMOVIDO getAppConfig
        // Se precisar de configuração do servidor, verifique se a API tem outro método
        // como getConfig(), getSettings(), ou similar
        
        // Exemplo alternativo: pegar configuração de variáveis de ambiente
        const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
        
        if (googleMapsApiKey) {
          const s = db.getSettings()
          if (s.googleMapsApiKey !== googleMapsApiKey) {
            db.saveSettings({
              ...s,
              googleMapsApiKey,
            })
          }
        }

        // 1. Push pending changes
        const { successCount, failCount } = await syncService.pushPendingItems()
        if (failCount === 0 && successCount > 0) {
          toast.success('Dados sincronizados com o servidor')
        } else {
          if (successCount > 0)
            toast.success(`${successCount} itens enviados com sucesso.`)
          if (failCount > 0) toast.error(`${failCount} falhas no envio.`)
        }

        // 2. Pull remote data (Full download if requested)
        if (fullDownload) {
          toast.info('Baixando dados do servidor...')
          const counts = await syncService.pullBaseData()
          toast.success(
            `Dados atualizados: ${counts.projects} Projetos, ${counts.quadras} Quadras, ${counts.lotes} Lotes.`,
          )
        } else {
          // Minimal pull
          await api.getProjects()
        }

        await refreshStats()
      } catch (e) {
        console.error(e)
        toast.error('Erro na sincronização.')
      } finally {
        setIsSyncing(false)
      }
    },
    [refreshStats],
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.info('Conexão restaurada. Sincronizando...')
      triggerSync(false)
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Você está offline. Os dados serão salvos localmente.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Carrega estatísticas iniciais
    refreshStats()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [triggerSync, refreshStats])

  return (
    <SyncContext.Provider
      value={{ isOnline, isSyncing, stats, triggerSync, refreshStats }}
    >
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) {
    // Return default values with only properties that definitely exist
    return {
      isOnline: navigator.onLine,
      isSyncing: false,
      stats: createInitialStats(),
      triggerSync: async () => {},
      refreshStats: () => {},
    }
  }
  return context
}