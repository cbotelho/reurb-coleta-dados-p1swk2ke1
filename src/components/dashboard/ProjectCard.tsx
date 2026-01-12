import { Project } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  quadrasCount?: number
  lotesCount?: number
}

export function ProjectCard({ project, quadrasCount = 0, lotesCount = 0 }: ProjectCardProps) {
  const getStatusColor = (status: string | undefined) => {
    const s = (status || '').toLowerCase()
    if (s.includes('aprovado'))
      return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
    if (s.includes('iniciado'))
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
    if (s.includes('analise'))
      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200'
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
  }

  const getStatusLabel = (status: string | undefined) => {
    return status || 'Pendente'
  }

  return (
    <Card className="hover:shadow-md transition-shadow border border-slate-200">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <Badge
            className={cn(
              'font-normal border-0',
              getStatusColor(project.status),
            )}
          >
            {getStatusLabel(project.status)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600 -mr-2 -mt-2"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/projetos/${project.local_id}`}>Ver detalhes</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/projetos/${project.local_id}/editar`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Arquivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>

        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          <span>
            {project.city || 'Cidade'}, {project.state || 'UF'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags && project.tags.length > 0 ? (
            project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded font-medium">
              #GERAL
            </span>
          )}
        </div>

        {/* Estatísticas do Projeto (Quadras e Lotes) */}
        <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-100">
           <div className="text-center">
              <span className="block text-xl font-bold text-gray-800">{quadrasCount}</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Quadras</span>
           </div>
           <div className="text-center border-l border-gray-100">
              <span className="block text-xl font-bold text-gray-800">{lotesCount}</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Lotes</span>
           </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <span className="text-xs text-gray-400">
            Atualizado em{' '}
            {project.date_updated
              ? format(new Date(project.date_updated), 'dd/MM/yyyy', {
                  locale: ptBR,
                })
              : 'Data desconhecida'}
          </span>
          <Link
            to={`/projetos/${project.local_id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Ver detalhes
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
