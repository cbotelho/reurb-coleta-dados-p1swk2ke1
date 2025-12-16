import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '@/services/db'
import { Project, Quadra } from '@/types'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, ChevronRight } from 'lucide-react'

export default function ProjetoDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | undefined>()
  const [quadras, setQuadras] = useState<Quadra[]>([])

  useEffect(() => {
    if (projectId) {
      setProject(db.getProject(projectId))
      setQuadras(db.getQuadrasByProject(projectId))
    }
  }, [projectId])

  if (!project)
    return <div className="p-4 text-center">Projeto não encontrado.</div>

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-2">
        <h2 className="text-2xl font-bold">{project.field_348}</h2>
        <p className="text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" /> {project.field_350}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Quadras ({quadras.length})
          </h3>
        </div>

        <div className="space-y-3">
          {quadras.length > 0 ? (
            quadras.map((quadra) => (
              <Link key={quadra.local_id} to={`/quadras/${quadra.local_id}`}>
                <Card className="hover:bg-slate-50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <div>
                      <CardTitle className="text-lg">
                        {quadra.field_329}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Área: {quadra.field_330}
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </CardHeader>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-white rounded-lg border border-dashed">
              Nenhuma quadra cadastrada neste projeto.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
