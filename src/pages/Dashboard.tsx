import { useEffect } from 'react'
import { useSync } from '@/contexts/SyncContext'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Wifi,
  WifiOff,
  UploadCloud,
  Database,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { isOnline, isSyncing, stats, triggerSync, refreshStats } = useSync()

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, Entrevistador!
          </h1>
          <p className="text-gray-500">Resumo da coleta de dados.</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm self-start">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700">
            Status: {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lotes Coletados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Lotes Coletados
            </CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.collected}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Armazenados localmente
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/projetos" className="w-full">
              <Button
                variant="ghost"
                className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Ver Projetos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Lotes Sincronizados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lotes Sincronizados
            </CardTitle>
            <UploadCloud className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.synced}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.lastSync
                ? `Última sincronização: ${new Date(stats.lastSync).toLocaleTimeString()}`
                : 'Nunca sincronizado'}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              className="w-full justify-start text-green-600 cursor-default hover:bg-transparent"
            >
              Dados seguros no servidor
            </Button>
          </CardFooter>
        </Card>

        {/* Pendentes */}
        <Card
          className={
            stats.pending > 0 ? 'border-orange-200 bg-orange-50/50' : ''
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes de Sincronização
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.pending}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ImageIcon className="h-3 w-3" />
              {stats.pendingImages} imagens pendentes
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={triggerSync}
              disabled={isSyncing || stats.pending === 0 || !isOnline}
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/projetos">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2 border-dashed border-2"
            >
              <Folder className="h-6 w-6 text-blue-500" />
              <span>Acessar Projetos</span>
            </Button>
          </Link>
          <Link to="/sincronizacao">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2 border-dashed border-2"
            >
              <RefreshCw className="h-6 w-6 text-orange-500" />
              <span>Ver Status de Sincronização</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
