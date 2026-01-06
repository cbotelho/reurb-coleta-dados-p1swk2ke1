import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { api } from '@/services/api'
import { syncService } from '@/services/syncService'
import { DashboardStats } from '@/types'
import { toast } from 'sonner'

interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean
  stats: DashboardStats
  triggerSync: (force?: boolean) => Promise<void>
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

  const refreshStats = useCallback(async () => {
    try {
      const s = await api.getDashboardStats()
      setStats(s)
    } catch (error) {
      console.error('Failed to refresh stats', error)
    }
  }, [])

  const triggerSync = useCallback(
    async (force = false) => {
      if (!isOnline) {
        toast.warning('Sem conexão com a internet.')
        return
      }

      setIsSyncing(true)
      try {
        // Push local changes
        const { successCount, failCount } = await syncService.pushPendingItems()
        if (successCount > 0)
          toast.success(`${successCount} itens sincronizados.`)
        if (failCount > 0) toast.error(`${failCount} falhas na sincronização.`)

        // Pull remote changes
        await syncService.pullProjects()
        // We could pull everything but it might be heavy. For now just projects/stats.

        await refreshStats()
      } catch (e) {
        console.error(e)
        toast.error('Erro na sincronização.')
      } finally {
        setIsSyncing(false)
      }
    },
    [isOnline, refreshStats],
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.info('Conexão restaurada. Tentando sincronizar...')
      triggerSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Você está offline. Os dados serão salvos localmente.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial fetch
    refreshStats()
    // Initial sync check
    if (navigator.onLine) {
      // Optional: auto-pull on start?
      // syncService.pullProjects()
    }

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
  if (!context) throw new Error('useSync must be used within a SyncProvider')
  return context
}
