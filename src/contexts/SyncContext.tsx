import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { api } from '@/services/api'
import { DashboardStats } from '@/types'
import { toast } from 'sonner'

interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean // Deprecated mostly, but good for loading spinners
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
      // In Online-First mode, sync is just refreshing data
      setIsSyncing(true)
      try {
        await refreshStats()
        toast.success('Dados atualizados')
      } finally {
        setIsSyncing(false)
      }
    },
    [refreshStats],
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial fetch
    refreshStats()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshStats])

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
