import { useEffect, useState } from 'react'
import { useSync } from '@/contexts/SyncContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Upload,
  FileText,
  Home,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { db } from '@/services/db'
import { Lote, Survey } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SyncStatus() {
  const { isOnline, isSyncing, stats, triggerSync, refreshStats } = useSync()
  const [pendingLotes, setPendingLotes] = useState<Lote[]>([])
  const [pendingSurveys, setPendingSurveys] = useState<Survey[]>([])

  useEffect(() => {
    refreshStats()
    loadPendingItems()
  }, [refreshStats, isSyncing])

  const loadPendingItems = () => {
    const pending = db.getPendingItems()
    setPendingLotes(pending.lotes)
    setPendingSurveys(pending.surveys)
  }

  const handleSync = async () => {
    await triggerSync()
    loadPendingItems()
  }

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
                {isOnline ? 'Conectado' : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? 'Sincronização disponível'
                  : 'Modo desconectado ativo'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fila de Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {pendingLotes.length + pendingSurveys.length}
                  </span>
                  <span className="text-sm text-muted-foreground">itens</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3" /> {pendingLotes.length} Lotes
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" /> {pendingSurveys.length}{' '}
                    Vistorias
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSync}
                disabled={
                  isSyncing ||
                  !isOnline ||
                  (pendingLotes.length === 0 && pendingSurveys.length === 0)
                }
                className="bg-blue-600"
              >
                {isSyncing ? (
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? 'Enviando...' : 'Sincronizar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Itens Pendentes</h3>

        <Tabs defaultValue="surveys">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="surveys">
              Vistorias ({pendingSurveys.length})
            </TabsTrigger>
            <TabsTrigger value="lotes">
              Lotes ({pendingLotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="surveys">
            <Card>
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {pendingSurveys.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                      Todas as vistorias sincronizadas.
                    </div>
                  ) : (
                    pendingSurveys.map((item) => {
                      const date =
                        item.updated_at || item.created_at || Date.now()
                      return (
                        <div key={item.id} className="p-4 hover:bg-slate-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                Vistoria {item.form_number || '(Sem número)'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Requerente: {item.applicant_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                ID Imóvel: {item.property_id.slice(0, 8)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
                                Pendente
                              </span>
                              <Clock className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2 text-right">
                            {new Date(date).toLocaleString()}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="lotes">
            <Card>
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {pendingLotes.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                      Todos os lotes sincronizados.
                    </div>
                  ) : (
                    pendingLotes.map((item) => (
                      <div
                        key={item.local_id}
                        className="p-4 hover:bg-slate-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.address || 'Sem endereço'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Área: {item.area}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.sync_status === 'failed' ? (
                              <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> Erro
                              </span>
                            ) : (
                              <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
                                Pendente
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right">
                          Atualizado em{' '}
                          {new Date(item.date_updated).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
