import { useSync } from '@/contexts/SyncContext'
import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function SyncIndicator() {
  const { isOnline, isSyncing, stats } = useSync()
  const totalPending = stats.pending + (stats.pendingSurveys || 0)
  const hasPending = totalPending > 0

  return (
    <Link
      to="/sincronizacao"
      className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      title={isOnline ? 'Online' : 'Offline'}
    >
      {isSyncing ? (
        <RefreshCw className="h-6 w-6 text-white animate-spin" />
      ) : isOnline ? (
        <Cloud
          className={cn(
            'h-6 w-6',
            hasPending ? 'text-orange-300' : 'text-white',
          )}
        />
      ) : (
        <CloudOff className="h-6 w-6 text-white/70" />
      )}

      {hasPending && !isSyncing && (
        <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white border border-blue-600">
          {totalPending > 9 ? '9+' : totalPending}
        </span>
      )}
    </Link>
  )
}
