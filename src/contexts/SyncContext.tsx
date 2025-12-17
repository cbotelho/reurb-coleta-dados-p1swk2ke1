import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { db } from '@/services/db'
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
    db.logActivity('Sistema', 'Iniciado', 'Iniciando sincronização...')
    toast({
      title: 'Sincronização iniciada',
      description: 'Enviando dados para o servidor...',
    })

    try {
      const pending = db.getPendingItems()
      let successCount = 0
      let failCount = 0

      // Simulate network delay and processing for lots
      for (const lote of pending.lotes) {
        await new Promise((resolve) => setTimeout(resolve, 800)) // Mock delay per item

        // Mock 90% success rate
        const success = Math.random() > 0.1

        if (success) {
          const remoteId = Math.floor(Math.random() * 10000) + 1000
          db.updateLoteStatus(lote.local_id, 'synchronized', remoteId)
          db.logActivity(
            'Lote',
            'Sucesso',
            `Lote ${lote.field_338} sincronizado com sucesso (ID Remoto: ${remoteId}).`,
          )
          successCount++
        } else {
          db.updateLoteStatus(lote.local_id, 'failed')
          db.logActivity(
            'Lote',
            'Falha',
            `Falha ao sincronizar lote ${lote.field_338}.`,
          )
          failCount++
        }
      }

      refreshStats()

      if (failCount > 0) {
        notificationService.send(
          'Falha na Sincronização',
          `${failCount} itens falharam ao enviar. Verifique sua conexão.`,
          'error',
        )
      } else if (successCount > 0) {
        notificationService.send(
          'Sincronização Concluída',
          `${successCount} itens enviados com sucesso.`,
          'success',
        )
      } else if (successCount === 0 && pending.lotes.length === 0) {
        toast({
          title: 'Tudo atualizado',
          description: 'Não há itens pendentes para sincronizar.',
        })
      }
    } catch (error) {
      console.error(error)
      notificationService.send(
        'Erro Crítico',
        'Falha inesperada na sincronização.',
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
      const pending = db.getPendingItems()
      if (pending.lotes.length > 0 && !isSyncing) {
        triggerSync()
      }
    }, 60000 * 5) // Every 5 minutes
    return () => clearInterval(interval)
  }, [isOnline, isSyncing, triggerSync])

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
