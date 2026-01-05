import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { db } from '@/services/db'
import { syncService } from '@/services/syncService'
import { DashboardStats } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { notificationService } from '@/services/notification'

interface SyncContextType {
  isOnline: boolean
  isSyncing: boolean
  stats: DashboardStats
  triggerSync: () => Promise<void>
  refreshStats: () => void
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>(db.getDashboardStats())
  const { toast } = useToast()

  const refreshStats = useCallback(() => {
    setStats(db.getDashboardStats())
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      notificationService.send(
        'Conectado',
        'Conexão com internet restabelecida.',
        'success',
      )
      // Auto pull when back online
      triggerSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      notificationService.send(
        'Sem Conexão',
        'O aplicativo está operando em modo offline.',
        'warning',
      )
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Sem conexão',
        description: 'Você está offline. Conecte-se para sincronizar.',
        variant: 'destructive',
      })
      return
    }
    if (isSyncing) return

    setIsSyncing(true)
    db.logActivity(
      'Sistema',
      'Iniciado',
      'Iniciando sincronização com nuvem...',
    )
    toast({
      title: 'Sincronização iniciada',
      description: 'Trocando dados com o servidor...',
    })

    try {
      // 1. Pull Remote Data
      const pCount = await syncService.pullProjects()
      const qCount = await syncService.pullQuadras()
      const lCount = await syncService.pullLotes()

      db.logActivity(
        'Sistema',
        'Sucesso',
        `Recebidos: ${pCount} projetos, ${qCount} quadras, ${lCount} lotes.`,
      )

      // 2. Push Local Data
      const { successCount, failCount } = await syncService.pushPendingItems()

      refreshStats()

      if (failCount > 0) {
        notificationService.send(
          'Falha na Sincronização',
          `${failCount} itens falharam ao enviar.`,
          'error',
        )
      } else if (successCount > 0) {
        notificationService.send(
          'Sincronização Concluída',
          `${successCount} itens enviados. Dados atualizados.`,
          'success',
        )
      } else {
        toast({
          title: 'Tudo atualizado',
          description: 'Dados sincronizados com sucesso.',
        })
      }
    } catch (error) {
      console.error(error)
      notificationService.send(
        'Erro na Sincronização',
        'Falha ao comunicar com o servidor Supabase.',
        'error',
      )
    } finally {
      setIsSyncing(false)
      refreshStats()
    }
  }, [isOnline, isSyncing, refreshStats, toast])

  // Auto-sync interval if online
  useEffect(() => {
    if (!isOnline) return
    const interval = setInterval(() => {
      triggerSync()
    }, 60000 * 5) // Every 5 minutes
    return () => clearInterval(interval)
  }, [isOnline, triggerSync])

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
