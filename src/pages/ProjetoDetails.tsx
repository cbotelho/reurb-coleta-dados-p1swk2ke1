import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '@/services/db'
import { api } from '@/services/api'
import { exporter } from '@/utils/exporter'
import { DocumentSection } from '@/features/reurb/components/DocumentSection'
import { geoExporter } from '@/utils/geoExporter'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Project, Quadra, AppSettings, MapKey } from '@/types'
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
import { Skeleton } from '@/components/ui/skeleton'
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
  Loader2,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export default function ProjetoDetails() {
  const { projectId } = useParams()
  const { hasPermission } = useAuth()
  const { hasPermission: checkPermission, isAdmin } = usePermissions()
  const [project, setProject] = useState<Project | undefined>()
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [isUpdatingMap, setIsUpdatingMap] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(db.getSettings())
  const [effectiveKey, setEffectiveKey] = useState<MapKey | undefined>(
    db.getEffectiveMapKey(),
  )
  const [loadingProject, setLoadingProject] = useState(true)
  const [loadingQuadras, setLoadingQuadras] = useState(true)
  const [canEditProjects, setCanEditProjects] = useState(false)
  const [canUploadDocuments, setCanUploadDocuments] = useState(false)
  const [canViewDocuments, setCanViewDocuments] = useState(false)

  useEffect(() => {
    const loadPermissions = async () => {
      console.log('Verificando permissões para:', { isAdmin, checkPermission })
      const [hasEditPermission, hasUploadPermission, hasViewPermission] = await Promise.all([
        checkPermission('edit_projects'),
        checkPermission('upload_documents'),
        checkPermission('view_documents')
      ])
      console.log('Permissões verificadas:', { hasEditPermission, hasUploadPermission, hasViewPermission })
      setCanEditProjects(isAdmin || hasEditPermission)
      setCanUploadDocuments(isAdmin || hasUploadPermission)
      setCanViewDocuments(isAdmin || hasViewPermission)
    }
    loadPermissions()
  }, [isAdmin, checkPermission])

  useEffect(() => {
    setSettings(db.getSettings())
    setEffectiveKey(db.getEffectiveMapKey())
  }, [])

  useEffect(() => {
    if (projectId) {
      loadData(projectId)
    }
  }, [projectId])

  const loadData = async (id: string) => {
    setLoadingProject(true)
    setLoadingQuadras(true)
    try {
      const p = await api.getProject(id)
      if (p) {
        setProject(p)
        setLoadingProject(false) // Project details loaded

        // Fetch Quadras
        try {
          const q = await api.getQuadras(id)
          setQuadras(q)
        } catch (quadraError) {
          console.error('Failed to load quadras:', quadraError)
          toast.error('Não foi possível carregar as quadras do projeto.')
        } finally {
          setLoadingQuadras(false)
        }
      } else {
        // Project not found
        setLoadingProject(false)
        setLoadingQuadras(false)
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar detalhes do projeto.')
      setLoadingProject(false)
      setLoadingQuadras(false)
    }
  }

  const handleForceMapUpdate = async (p: Project) => {
    setIsUpdatingMap(true)
    try {
      const updated = await api.updateProject(p.local_id, {
        last_map_update: Date.now(),
      })
      setProject(updated)
      toast.success('Mapa atualizado automaticamente.')
    } catch (e) {
      toast.error('Falha na atualização automática.')
    } finally {
      setIsUpdatingMap(false)
    }
  }

  const handleExport = async (type: 'csv' | 'excel' | 'kml' | 'geojson') => {
    if (!project) return
    toast.loading('Preparando exportação...', { id: 'export' })

    try {
      const allLotes = []
      for (const quadra of quadras) {
        const quadraLotes = await api.getLotes(quadra.local_id)
        allLotes.push(
          ...quadraLotes.map((l) => ({
            ...l,
            projectName: project.name,
            quadraName: quadra.name,
          })),
        )
      }

      toast.dismiss('export')

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
        { key: 'name', label: 'Nome do Lote' },
        { key: 'quadraName', label: 'Quadra' },
        { key: 'projectName', label: 'Projeto' },
        { key: 'area', label: 'Área' },
        { key: 'latitude', label: 'Latitude' },
        { key: 'longitude', label: 'Longitude' },
        { key: 'sync_status', label: 'Status' },
      ]

      if (type === 'csv') {
        exporter.toCSV(allLotes, `lotes_${project.name}.csv`, columns)
      } else {
        exporter.toExcel(allLotes, `lotes_${project.name}.xls`, columns)
      }
    } catch (e) {
      toast.dismiss('export')
      toast.error('Erro ao exportar dados.')
    }
  }

  const handleDeleteQuadra = async (quadra: Quadra) => {
    if (!confirm(`Tem certeza que deseja excluir a quadra "${quadra.name}"?`)) {
      return
    }
    
    try {
      await api.deleteQuadra(quadra.local_id)
      setQuadras(quadras.filter(q => q.local_id !== quadra.local_id))
      toast.success('Quadra excluída com sucesso!')
    } catch (error) {
      console.error('Error deleting quadra:', error)
      toast.error('Erro ao excluir quadra.')
    }
  }

  if (loadingProject) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
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
    // Prefer effective key (DB stored)
    const apiKey = effectiveKey?.key

    if (
      apiKey &&
      project.latitude &&
      project.longitude &&
      project.latitude !== '0' &&
      project.longitude !== '0'
    ) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${project.latitude},${project.longitude}&zoom=16&size=800x400&maptype=satellite&key=${apiKey}`
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
              Loteamento {project?.name || `Projeto ${project?.local_id || ''}`}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                ID: {project?.local_id?.slice(0, 8) || 'N/A'}
              </Badge>
              <Badge variant="default">Online</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
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
                src={getProjectImageUrl(project.image_url)}
                alt={`Mapa do ${project.name}`}
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
                    <FileText className="w-4 h-4" /> Descrição
                  </span>
                  <p className="text-sm break-all font-mono bg-muted p-2 rounded">
                    {project.description || 'Nenhuma descrição'}
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

          {/* Documentos do Projeto */}
          <DocumentSection 
            projectId={projectId || ''} 
            canUpload={canUploadDocuments}
            canDelete={isAdmin}
            canDownload={canViewDocuments}
            className="mb-6"
          />

          {/* Quadras List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Quadras Vinculadas</h3>
              {canEditProjects && (
                <Button size="sm" asChild>
                  <Link to={`/projetos/${projectId}/quadras/nova`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Quadra
                  </Link>
                </Button>
              )}
            </div>
            {loadingQuadras ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border rounded-lg p-6 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-9 w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : quadras.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {quadras.map((quadra) => (
                  <Card
                    key={quadra.local_id}
                    className="hover:border-primary/50 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {quadra.name}
                          {canEditProjects && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/quadras/${quadra.local_id}/editar`}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteQuadra(quadra)}
                                >
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <Badge
                          variant={
                            quadra.sync_status === 'synchronized'
                              ? 'default'
                              : quadra.sync_status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {quadra.sync_status === 'synchronized'
                            ? 'Sincronizado'
                            : quadra.sync_status === 'failed'
                              ? 'Erro'
                              : 'Pendente'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Área: {quadra.area || 'Não informada'}
                      </CardDescription>
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
              </div>
            ) : (
              <div className="col-span-full p-12 border border-dashed rounded-lg text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <MapPin className="w-8 h-8 opacity-50" />
                <p>Nenhuma quadra encontrada para este projeto.</p>
              </div>
            )}
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
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium">Online</p>
                  <p className="text-xs text-muted-foreground">
                    Os dados são carregados diretamente do servidor.
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
                <span>{project.created_by ? 'Usuário' : '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Parent ID</span>
                <span>{project.parent_id ?? '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
