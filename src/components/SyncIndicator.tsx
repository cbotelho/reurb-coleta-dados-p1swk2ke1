import { useSync } from '@/contexts/SyncContext'
import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function SyncIndicator() {
  const { isOnline, isSyncing, stats } = useSync()
  const hasPending = stats.pending > 0

  return (
    <Link
      to="/sincronizacao"
      className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
    >
      {isSyncing ? (
        <RefreshCw className="h-6 w-6 text-white animate-spin" />
      ) : isOnline ? (
        <Cloud
          className={cn(
            'h-6 w-6 text-white',
            hasPending ? 'text-orange-300' : '',
          )}
        />
      ) : (
        <CloudOff className="h-6 w-6 text-white/70" />
      )}

      {hasPending && !isSyncing && (
        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-orange-500 border-2 border-blue-600 animate-pulse" />
      )}
    </Link>
  )
}
