import { useEffect } from 'react'
import { useSync } from '@/contexts/SyncContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SyncStatus() {
  const { isOnline, isSyncing, stats, triggerSync, refreshStats } = useSync()

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

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
                {isOnline ? 'Conectado ao Servidor' : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Operando em modo online' : 'Sem conexão'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{stats.synced}</div>
                <p className="text-xs text-muted-foreground">
                  Lotes sincronizados
                </p>
              </div>
              <Button
                onClick={() => triggerSync()}
                disabled={isSyncing || !isOnline}
                className="bg-blue-600"
              >
                {isSyncing ? (
                  <RefreshCw className="animate-spin h-4 w-4" />
                ) : (
                  'Atualizar Dados'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Log de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border border-dashed rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <p>Todos os sistemas operacionais.</p>
            <p className="text-xs">
              O log local foi descontinuado em favor do log do servidor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
