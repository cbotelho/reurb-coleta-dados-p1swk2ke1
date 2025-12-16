import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '@/services/db'
import { Project } from '@/types'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setProjects(db.getProjects())
  }, [])

  const filteredProjects = projects.filter(
    (p) =>
      p.field_348.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.field_350.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <Link key={project.local_id} to={`/projetos/${project.local_id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {project.field_351 ? (
                      <img
                        src={project.field_351}
                        alt="Project"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        IMG
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg leading-tight">
                      {project.field_348}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.field_350}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                    <Badge
                      variant={
                        project.sync_status === 'synchronized'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="capitalize"
                    >
                      {project.sync_status === 'synchronized'
                        ? 'Sincronizado'
                        : 'Pendente'}
                    </Badge>
                    <span>
                      {new Date(project.date_updated).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            {searchTerm
              ? 'Nenhum projeto encontrado para sua busca.'
              : 'Nenhum projeto disponível.'}
          </div>
        )}
      </div>
    </div>
  )
}
