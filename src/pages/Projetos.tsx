import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db } from '@/services/db'
import { Project } from '@/types'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Calendar, FileText, Map } from 'lucide-react'
import { format } from 'date-fns'

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    setProjects(db.getProjects())
  }, [])

  const getProjectImageUrl = (imageName?: string) => {
    if (!imageName)
      return 'https://img.usecurling.com/p/400/250?q=city%20map&color=blue'
    if (imageName.startsWith('http')) return imageName
    // Return placeholder for local filenames
    return `https://img.usecurling.com/p/400/250?q=project%20map&color=blue`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os projetos e loteamentos disponíveis.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.local_id}
            className="overflow-hidden flex flex-col"
          >
            <div className="aspect-video w-full overflow-hidden bg-muted relative">
              <img
                src={getProjectImageUrl(project.field_351)}
                alt={`Imagem do projeto ${project.field_348}`}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
              />
              <div className="absolute top-2 right-2">
                <Badge
                  variant={
                    project.sync_status === 'synchronized'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {project.sync_status === 'synchronized'
                    ? 'Sincronizado'
                    : 'Pendente'}
                </Badge>
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    Loteamento {project.field_348}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Map className="w-3 h-3" /> ID:{' '}
                    {project.id || project.local_id.slice(0, 8)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">
                    {project.field_350 ? project.field_350 : 'Sem levantamento'}
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
              <Button asChild className="w-full">
                <Link to={`/projetos/${project.local_id}`}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Link>
              </Button>
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
