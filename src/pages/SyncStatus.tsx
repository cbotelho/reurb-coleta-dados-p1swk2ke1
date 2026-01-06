import { useEffect } from 'react'
import { useSync } from '@/contexts/SyncContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Upload,
  FileText,
} from 'lucide-react'
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
              : 'border-orange-200 bg-orange-50/50',
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
              <WifiOff className="h-8 w-8 text-orange-600" />
            )}
            <div>
              <div className="text-lg font-bold">
                {isOnline ? 'Conectado ao Servidor' : 'Modo Offline'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? 'Sincronização disponível'
                  : 'Dados serão salvos no dispositivo'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sincronização Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {stats.pending + (stats.pendingSurveys || 0)}
                  </span>
                  <span className="text-sm text-muted-foreground">itens</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Upload className="w-3 h-3" /> {stats.pending} Lotes
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {stats.pendingSurveys || 0}{' '}
                    Vistorias
                  </span>
                </div>
              </div>
              <Button
                onClick={() => triggerSync(true)}
                disabled={isSyncing || !isOnline}
                className="bg-blue-600"
              >
                {isSyncing ? (
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Status dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="text-sm text-muted-foreground">Lotes Totais</div>
              <div className="text-2xl font-bold">{stats.collected}</div>
            </div>
            <div className="p-4 border rounded-lg bg-green-50 border-green-100">
              <div className="text-sm text-green-700">Sincronizados</div>
              <div className="text-2xl font-bold text-green-800">
                {stats.synced}
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-orange-50 border-orange-100">
              <div className="text-sm text-orange-700">Pendentes</div>
              <div className="text-2xl font-bold text-orange-800">
                {stats.pending}
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="text-sm text-muted-foreground">
                Imagens Pendentes
              </div>
              <div className="text-2xl font-bold">{stats.pendingImages}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
