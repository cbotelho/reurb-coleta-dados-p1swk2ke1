import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '@/services/db'
import { exporter } from '@/utils/exporter'
import { geoExporter } from '@/utils/geoExporter'
import { useAuth } from '@/contexts/AuthContext'
import { Project, Quadra, AppSettings } from '@/types'
import { Button } from '@/components/ui/button'
import { ProjectMapUpdateDialog } from '@/components/ProjectMapUpdateDialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  FileSpreadsheet,
  Globe,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export default function ProjetoDetails() {
  const { projectId } = useParams()
  const { hasPermission } = useAuth()
  const [project, setProject] = useState<Project | undefined>()
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [isUpdatingMap, setIsUpdatingMap] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(db.getSettings())

  useEffect(() => {
    setSettings(db.getSettings())
  }, [])

  useEffect(() => {
    if (projectId) {
      const p = db.getProject(projectId)
      setProject(p)
      if (p) {
        setQuadras(db.getQuadrasByProject(projectId))

        // Simulate auto-update check on load
        if (p.auto_update_map && p.last_map_update) {
          const hoursSinceUpdate =
            (Date.now() - p.last_map_update) / (1000 * 60 * 60)
          if (hoursSinceUpdate > 24) {
            handleForceMapUpdate(p)
          }
        }
      }
    }
  }, [projectId])

  const handleForceMapUpdate = async (p: Project) => {
    setIsUpdatingMap(true)
    // Simulate update
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const updated = db.updateProject({
      ...p,
      last_map_update: Date.now(),
    })
    setProject(updated)
    setIsUpdatingMap(false)
    toast.success('Mapa atualizado automaticamente.')
  }

  const handleExport = (type: 'csv' | 'excel' | 'kml' | 'geojson') => {
    if (!project) return
    const projectQuadras = db.getQuadrasByProject(project.local_id)
    const projectQuadraIds = projectQuadras.map((q) => q.local_id)
    const allLotes = db
      .getAllLotes()
      .filter((l) => projectQuadraIds.includes(l.parent_item_id))
      .map((l) => ({
        ...l,
        projectName: project.field_348,
        quadraName: projectQuadras.find((q) => q.local_id === l.parent_item_id)
          ?.field_329,
      }))

    if (type === 'kml') {
      geoExporter.exportProjectKML(project, allLotes)
      return
    }
    if (type === 'geojson') {
      geoExporter.exportProjectGeoJSON(project, allLotes)
      return
    }

    const columns = [
      { key: 'local_id', label: 'ID' },
      { key: 'field_338', label: 'Nome do Lote' },
      { key: 'quadraName', label: 'Quadra' },
      { key: 'projectName', label: 'Projeto' },
      { key: 'field_339', label: 'Área' },
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' },
      { key: 'sync_status', label: 'Status' },
    ]

    if (type === 'csv') {
      exporter.toCSV(allLotes, `lotes_${project.field_348}.csv`, columns)
    } else {
      exporter.toExcel(allLotes, `lotes_${project.field_348}.xls`, columns)
    }
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/projetos">Voltar para Projetos</Link>
        </Button>
      </div>
    )
  }

  const getProjectImageUrl = (imageName?: string) => {
    if (
      settings.googleMapsApiKey &&
      project.latitude &&
      project.longitude &&
      project.latitude !== '0' &&
      project.longitude !== '0'
    ) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${project.latitude},${project.longitude}&zoom=16&size=800x400&maptype=satellite&key=${settings.googleMapsApiKey}`
    }

    if (!imageName)
      return 'https://img.usecurling.com/p/800/400?q=city%20map&color=blue'
    if (imageName.startsWith('http')) return imageName
    return `https://img.usecurling.com/p/800/400?q=project%20map&color=blue`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/projetos">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Loteamento {project.field_348}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                ID: {project.id}
              </Badge>
              <Badge
                variant={
                  project.sync_status === 'synchronized'
                    ? 'secondary'
                    : 'default'
                }
              >
                {project.sync_status === 'synchronized'
                  ? 'Sincronizado'
                  : 'Pendente'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {hasPermission('all') && (
            <ProjectMapUpdateDialog
              project={project}
              onUpdate={(updatedProject) => setProject(updatedProject)}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Dados
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Formatos Tabulares</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Dados Geográficos</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('kml')}>
                <Globe className="w-4 h-4 mr-2" /> KML (Google Earth)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('geojson')}>
                <MapPin className="w-4 h-4 mr-2" /> GeoJSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" asChild>
            <Link to={`/relatorios/${project.local_id}`}>
              <Printer className="w-4 h-4 mr-2" />
              Relatório Avançado
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-video w-full bg-muted relative group">
              <img
                src={getProjectImageUrl(project.field_351)}
                alt={`Mapa do ${project.field_348}`}
                className="w-full h-full object-cover"
              />
              {project.auto_update_map && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-blue-600 hover:bg-blue-700">
                    Auto Update
                  </Badge>
                </div>
              )}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleForceMapUpdate(project)}
                  disabled={isUpdatingMap}
                >
                  {isUpdatingMap ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Atualizar
                </Button>
              </div>
            </div>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Informações Gerais</CardTitle>
                {project.last_map_update && (
                  <span className="text-xs text-muted-foreground">
                    Mapa atualizado:{' '}
                    {format(
                      new Date(project.last_map_update),
                      'dd/MM/yyyy HH:mm',
                    )}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Arquivo de Levantamento
                  </span>
                  <p className="text-sm break-all font-mono bg-muted p-2 rounded">
                    {project.field_350 || 'Nenhum arquivo anexado'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Coordenadas do Projeto
                  </span>
                  <p className="text-sm break-all font-mono bg-muted p-2 rounded">
                    {project.latitude && project.longitude
                      ? `${project.latitude}, ${project.longitude}`
                      : 'Não definidas'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Adicionado em</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(project.date_added), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última atualização</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {project.date_updated > 0
                      ? format(
                          new Date(project.date_updated),
                          'dd/MM/yyyy HH:mm',
                        )
                      : 'Nunca atualizado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quadras List */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quadras Vinculadas</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {quadras.map((quadra) => (
                <Card
                  key={quadra.local_id}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      {quadra.field_329}
                      <Badge variant="outline">{quadra.sync_status}</Badge>
                    </CardTitle>
                    <CardDescription>{quadra.field_330}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <Link to={`/quadras/${quadra.local_id}`}>
                        <MapPin className="w-3 h-3 mr-2" />
                        Ver Quadra
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {quadras.length === 0 && (
                <div className="col-span-full p-8 border border-dashed rounded-lg text-center text-muted-foreground">
                  Nenhuma quadra vinculada a este projeto.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status da Sincronização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {project.sync_status === 'synchronized' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <Clock className="w-8 h-8 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">
                    {project.sync_status === 'synchronized'
                      ? 'Sincronizado'
                      : 'Pendente'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.sync_status === 'synchronized'
                      ? 'Os dados estão salvos no servidor.'
                      : 'Aguardando sincronização.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadados</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Criado por</span>
                <span>User {project.created_by || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Parent ID</span>
                <span>{project.parent_id ?? '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Sort Order</span>
                <span>{project.sort_order ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
