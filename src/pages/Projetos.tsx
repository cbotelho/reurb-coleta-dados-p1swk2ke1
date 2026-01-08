import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Project, AppSettings } from '@/types'
import { db } from '@/services/db' // For settings
import { useAuth } from '@/contexts/AuthContext'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, Calendar, FileText, Map, Loader2, MoreHorizontal, Edit, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>([])
  const [settings, setSettings] = useState<AppSettings>(db.getSettings())
  const [loading, setLoading] = useState(true)
  const { hasPermission } = useAuth()

  const canEditProjects = hasPermission('all') || hasPermission('edit_projects')

  useEffect(() => {
    // Refresh settings to get latest key if synced
    setSettings(db.getSettings())
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await api.getProjects()
      setProjects(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar projetos.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      return
    }
    
    try {
      await api.deleteProject(project.local_id)
      setProjects(projects.filter(p => p.local_id !== project.local_id))
      toast.success('Projeto excluído com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao excluir projeto.')
    }
  }

  const getProjectImageUrl = (project: Project) => {
    if (
      settings.googleMapsApiKey &&
      project.latitude &&
      project.longitude &&
      project.latitude !== '0' &&
      project.longitude !== '0'
    ) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${project.latitude},${project.longitude}&zoom=15&size=400x250&maptype=satellite&key=${settings.googleMapsApiKey}`
    }

    if (!project.image_url)
      return 'https://img.usecurling.com/p/400/250?q=city%20map&color=blue'
    if (project.image_url.startsWith('http')) return project.image_url
    return `https://img.usecurling.com/p/400/250?q=project%20map&color=blue`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Projetos ({projects.length})
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os projetos e loteamentos disponíveis.
          </p>
        </div>
        {canEditProjects && (
          <Button asChild>
            <Link to="/projetos/novo">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.local_id}
            className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video w-full overflow-hidden bg-muted relative">
              <img
                src={getProjectImageUrl(project)}
                alt={`Imagem do projeto ${project.name}`}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
              />
              <div className="absolute top-2 right-2">
                <Badge
                  variant="default"
                  className="bg-white/90 text-black hover:bg-white"
                >
                  Online
                </Badge>
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    Loteamento {project.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Map className="w-3 h-3" /> ID:{' '}
                    {project.local_id.slice(0, 8)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">
                    {project.description
                      ? project.description
                      : 'Sem descrição'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Adicionado:{' '}
                    {format(new Date(project.date_added), 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/20">
              <div className="flex gap-2 w-full">
                <Button asChild className="flex-1">
                  <Link to={`/projetos/${project.local_id}`}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Link>
                </Button>
                {canEditProjects && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/projetos/${project.local_id}/editar`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteProject(project)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
