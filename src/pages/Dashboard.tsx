import { useEffect, useState, useRef } from 'react'
import { useSync } from '@/contexts/SyncContext'
import { api } from '@/services/api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Folder,
  Map as MapIcon,
  AlertTriangle,
  Loader2,
  DownloadCloud,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { GoogleMap, GoogleMapHandle } from '@/components/GoogleMap'
import { db } from '@/services/db'
import { Project, Lote, MapKey, MarkerIconType, DashboardStats } from '@/types'
import { getBoundsCoordinates } from '@/utils/geoUtils'
import { toast } from 'sonner'

export default function Dashboard() {
  const { isOnline, triggerSync, isSyncing } = useSync()
  const mapRef = useRef<GoogleMapHandle>(null)
  const [activeKey, setActiveKey] = useState<MapKey | undefined>()
  const [projects, setProjects] = useState<Project[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    collected: 0,
    synced: 0,
    pending: 0,
    pendingImages: 0,
    totalProjects: 0,
    pendingSurveys: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const key = db.getActiveMapKey()
    setActiveKey(key)
  }, [isOnline]) // Reload when connectivity changes

  const loadDashboardData = async () => {
    try {
      const s = await api.getDashboardStats()
      setStats(s)
      const p = await api.getProjects()
      setProjects(p)
      const l = await api.getAllLotes()
      setLotes(l)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFullDownload = async () => {
    try {
      await triggerSync(true)
      // Reload local state after sync
      loadDashboardData()
    } catch (e) {
      toast.error('Erro no download de dados')
    }
  }

  // Prepare markers for map
  const projectMarkers = projects
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      lat: parseFloat(String(p.latitude).replace(',', '.')),
      lng: parseFloat(String(p.longitude).replace(',', '.')),
      title: `Projeto: ${p.name}`,
      id: p.local_id,
      color: '#7c3aed',
      icon: 'flag' as MarkerIconType,
    }))
    .filter((m) => !isNaN(m.lat) && !isNaN(m.lng) && m.lat !== 0 && m.lng !== 0)

  const loteMarkers = lotes
    .filter((l) => l.latitude && l.longitude)
    .map((l) => ({
      lat: parseFloat(String(l.latitude).replace(',', '.')),
      lng: parseFloat(String(l.longitude).replace(',', '.')),
      title: l.name,
      status: l.sync_status,
      id: l.local_id,
      color: l.sync_status === 'synchronized' ? '#22c55e' : '#f97316',
      icon: 'circle' as MarkerIconType,
    }))
    .filter((m) => !isNaN(m.lat) && !isNaN(m.lng) && m.lat !== 0 && m.lng !== 0)

  const allMarkers = [...projectMarkers, ...loteMarkers]

  const handleMapLoad = () => {
    setTimeout(() => {
      if (mapRef.current && allMarkers.length > 0) {
        const points = getBoundsCoordinates(lotes, [], projects)
        if (points.length > 0) {
          mapRef.current.fitBounds(points)
        }
      }
    }, 500)
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Painel de Controle
          </h1>
          <p className="text-gray-500">Resumo da coleta de dados REURB.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {isOnline && (
            <Button
              onClick={handleFullDownload}
              disabled={isSyncing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DownloadCloud className="h-4 w-4 mr-2" />
              )}
              Baixar Dados (Offline)
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projetos Ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos Locais
            </CardTitle>
            <Folder className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Disponíveis offline
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/projetos" className="w-full">
              <Button
                variant="ghost"
                className="w-full justify-between text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                Ver Lista <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Lotes Coletados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lotes Cadastrados
            </CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.collected}
            </div>
            <p className="text-xs text-muted-foreground mt-1">No dispositivo</p>
          </CardContent>
          <CardFooter>
            <Link to="/projetos" className="w-full">
              <Button
                variant="ghost"
                className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Navegar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Pendentes */}
        <Card
          className={
            stats.pending > 0 || stats.pendingSurveys > 0
              ? 'border-orange-200 bg-orange-50'
              : ''
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sincronização Pendente
            </CardTitle>
            <AlertTriangle
              className={
                stats.pending > 0 || stats.pendingSurveys > 0
                  ? 'h-4 w-4 text-orange-500'
                  : 'h-4 w-4 text-gray-400'
              }
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.pending + (stats.pendingSurveys || 0)}
            </div>
            <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
              <span>
                {stats.pending} Lotes / {stats.pendingSurveys || 0} Vistorias
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/sincronizacao" className="w-full">
              <Button
                variant="ghost"
                className="w-full justify-between text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                Sincronizar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Lotes Sincronizados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sincronizados
            </CardTitle>
            <UploadCloud className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.synced}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Seguros na nuvem
            </p>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-gray-400 w-full text-right">
              {stats.lastSync
                ? `Última sync: ${new Date(stats.lastSync).toLocaleTimeString()}`
                : 'Nunca'}
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Mapa Geral</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/mapa">
              <MapIcon className="w-4 h-4 mr-2" />
              Ver Mapa Completo
            </Link>
          </Button>
        </div>
        <Card className="overflow-hidden border-2 border-slate-100 shadow-md">
          <div className="h-[400px] w-full bg-slate-50 relative">
            {activeKey ? (
              <GoogleMap
                ref={mapRef}
                apiKey={activeKey.key}
                mapId={activeKey.mapId}
                markers={allMarkers}
                className="h-full w-full"
                onMapLoad={handleMapLoad}
                presentationMode
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="bg-yellow-100 p-4 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mapa Não Configurado
                  </h3>
                  <p className="text-gray-500 max-w-sm mt-1">
                    Adicione uma Chave de API do Google Maps nas configurações
                    para visualizar o mapa geográfico.
                  </p>
                </div>
                <Button asChild variant="default" className="mt-4">
                  <Link to="/configuracoes">Configurar Agora</Link>
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
