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
import { DashboardStats } from '@/types'
import { toast } from 'sonner'

interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean
  stats: DashboardStats
  triggerSync: (fullDownload?: boolean) => Promise<void>
  refreshStats: () => void
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    collected: 0,
    synced: 0,
    pending: 0,
    pendingImages: 0,
    totalProjects: 0,
    pendingSurveys: 0,
  })

  // Initialize and Fetch Config
  useEffect(() => {
    const initApp = async () => {
      try {
        // Fetch System Configuration (API Keys, etc)
        const config = await api.getAppConfig()
        if (config.google_maps_api_key) {
          const currentSettings = db.getSettings()
          // Only update if different to avoid redundant saves or unnecessary effects
          if (currentSettings.googleMapsApiKey !== config.google_maps_api_key) {
            db.saveSettings({
              ...currentSettings,
              googleMapsApiKey: config.google_maps_api_key,
            })
            // Force a slight delay reload or just let React updates handle it via props
            // Ideally components read from db or context.
            // Since we are not exposing settings in SyncContext, we rely on db.getSettings()
            // being called in components or useEffects there.
          }
        }
      } catch (e) {
        console.error('Failed to initialize system config', e)
      }
    }

    if (navigator.onLine) {
      initApp()
    }
  }, [])

  const refreshStats = useCallback(async () => {
    try {
      const s = await api.getDashboardStats()
      setStats(s)
    } catch (error) {
      console.error('Failed to refresh stats', error)
    }
  }, [])

  const triggerSync = useCallback(
    async (fullDownload = false) => {
      if (!navigator.onLine) {
        toast.warning('Sem conexão com a internet.')
        return
      }

      setIsSyncing(true)
      try {
        // 0. Update Config during sync
        const config = await api.getAppConfig()
        if (config.google_maps_api_key) {
          const s = db.getSettings()
          if (s.googleMapsApiKey !== config.google_maps_api_key) {
            db.saveSettings({
              ...s,
              googleMapsApiKey: config.google_maps_api_key,
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
    // Return default values instead of throwing error to prevent crashes
    return {
      isOnline: navigator.onLine,
      isSyncing: false,
      stats: {
        collected: 0,
        synced: 0,
        pending: 0,
        pendingImages: 0,
        totalProjects: 0,
        lastSync: Date.now(),
        pendingSurveys: 0,
        totalSurveyed: 0,
        totalFamilies: 0,
        totalContracts: 0,
        totalQuadras: 0,
      },
      triggerSync: async () => {},
      refreshStats: () => {},
    }
  }
  return context
}
