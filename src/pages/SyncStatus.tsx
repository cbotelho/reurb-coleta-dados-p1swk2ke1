import { useEffect, useState } from 'react'
import { useSync } from '@/contexts/SyncContext'
import { db } from '@/services/db'
import { SyncLogEntry } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCw,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SyncStatus() {
  const { isOnline, isSyncing, stats, triggerSync, refreshStats } = useSync()
  const [logs, setLogs] = useState<SyncLogEntry[]>([])

  useEffect(() => {
    setLogs(db.getLogs())
    const interval = setInterval(() => {
      setLogs(db.getLogs())
      refreshStats()
    }, 2000)
    return () => clearInterval(interval)
  }, [refreshStats])

  const handleManualSync = () => {
    triggerSync()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sucesso':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Falha':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'Iniciado':
        return <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={cn(
            isOnline
              ? 'border-green-200 bg-green-50/50'
              : 'border-red-200 bg-red-50/50',
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conectividade
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-8 w-8 text-green-600" />
            ) : (
              <WifiOff className="h-8 w-8 text-red-600" />
            )}
            <div>
              <div className="text-lg font-bold">
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Pronto para sincronizar' : 'Verifique sua conexão'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resumo de Pendências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Itens para enviar
                </p>
              </div>
              <Button
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline || stats.pending === 0}
                className="bg-blue-600"
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Histórico de Sincronização</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex items-start gap-3 hover:bg-slate-50"
                  >
                    <div className="mt-1">{getStatusIcon(log.status)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm">{log.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{log.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum registro de atividade.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
