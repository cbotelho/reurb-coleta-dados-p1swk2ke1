import { useEffect, useState } from 'react'
import { useSync } from '@/contexts/SyncContext'
import { api } from '@/services/api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Wifi,
  WifiOff,
  Folder,
  Map as MapIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  DownloadCloud,
  FileText,
  Home,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Project, DashboardStats } from '@/types'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

export default function Dashboard() {
  const { isOnline, triggerSync, isSyncing, stats: syncStats } = useSync()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats>(syncStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [isOnline])

  const loadDashboardData = async () => {
    try {
      const s = await api.getDashboardStats()
      setStats(s)
      const p = await api.getProjects()
      setProjects(p)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    await triggerSync(false)
    loadDashboardData()
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )

  const surveyProgress =
    stats.collected > 0
      ? ((stats.totalSurveyed || 0) / stats.collected) * 100
      : 0
  const pendingTotal = stats.pending + (stats.pendingSurveys || 0)

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Olá, Vistoriador</h1>
        <p className="text-gray-500 text-sm">
          Bem-vindo ao painel de campo do SisReurb.
        </p>
      </div>

      {/* Sync Status Card */}
      <Card
        className={
          isOnline
            ? 'bg-gradient-to-br from-white to-blue-50 border-blue-100'
            : 'bg-gradient-to-br from-white to-orange-50 border-orange-100'
        }
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={
                isOnline
                  ? 'p-2 bg-green-100 rounded-full'
                  : 'p-2 bg-orange-100 rounded-full'
              }
            >
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-orange-600" />
              )}
            </div>
            <div>
              <div className="font-semibold">
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <div className="text-xs text-muted-foreground">
                {pendingTotal > 0
                  ? `${pendingTotal} itens pendentes`
                  : 'Tudo sincronizado'}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            variant={hasPending(stats) ? 'default' : 'outline'}
            className={
              hasPending(stats)
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : ''
            }
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadCloud className="h-4 w-4" />
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Total Lotes
              </span>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{stats.collected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                Vistoriados
              </span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">
                  {stats.totalSurveyed || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Progresso Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={surveyProgress} className="h-2" />
          <p className="text-xs text-right mt-2 text-muted-foreground">
            {surveyProgress.toFixed(0)}% Concluído
          </p>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Meus Projetos</h2>
          <Link
            to="/projetos"
            className="text-sm text-blue-600 hover:underline"
          >
            Ver Todos
          </Link>
        </div>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">
              Nenhum projeto encontrado.
            </div>
          ) : (
            projects.slice(0, 3).map((project) => (
              <Link
                key={project.local_id}
                to={`/projetos/${project.local_id}`}
                className="block"
              >
                <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Folder className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(project.date_added).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function hasPending(stats: DashboardStats) {
  return stats.pending + (stats.pendingSurveys || 0) > 0
}
