import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Quadra, Lote, Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { Survey } from '@/types'
import { toast } from 'sonner'
import { Plus, ArrowLeft, Loader2, Home, MoreHorizontal, Edit, Trash2, MapPin, FileText, Lock } from 'lucide-react'

export default function QuadraDetails() {
  const { quadraId } = useParams<{ quadraId: string }>()
  const { hasPermission, user } = useAuth()
  const [quadra, setQuadra] = useState<Quadra | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [surveys, setSurveys] = useState<Map<string, Survey>>(new Map())
  const [loading, setLoading] = useState(true)

  const canEditProjects = hasPermission('all') || hasPermission('edit_projects')
  const isAdminOrAssistant = user?.role === 'Administrador' || user?.role === 'Administradores' || user?.role === 'Assistente Social';

  useEffect(() => {
    const loadData = async () => {
      if (!quadraId) return
      try {
        const q = await api.getQuadra(quadraId)
        setQuadra(q)
        if (q) {
          const [p, l] = await Promise.all([
            api.getProject(q.parent_item_id),
            api.getLotes(q.local_id),
          ])
          setProject(p)
          setLotes(l)

          // Otimização: Carregar surveys em Batch (1 chamada) em vez de N chamadas
          const loteIds = l.map(lote => lote.local_id)
          try {
             const allSurveys = await api.getSurveysByPropertyIds(loteIds)
             const surveysMap = new Map<string, Survey>()
             
             allSurveys.forEach(survey => {
                // Guarda apenas a mais recente se vier duplicada (assumindo que api retorna)
                // ou simplesmente mapeia por property_id
                surveysMap.set(survey.property_id, survey)
             })
             setSurveys(surveysMap)

          } catch (e) {
            console.error('Erro ao carregar surveys em massa:', e)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [quadraId])

  
  const handleDeleteLote = async (lote: Lote) => {
    if (!confirm(`Tem certeza que deseja excluir o lote "${lote.name}"?`)) {
      return
    }
    
    try {
      await api.deleteLote(lote.local_id)
      setLotes(lotes.filter(l => l.local_id !== lote.local_id))
      toast.success('Lote excluído com sucesso!')
    } catch (error) {
      console.error('Error deleting lote:', error)
      toast.error('Erro ao excluir lote.')
    }
  }

  
  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  if (!quadra)
    return <div className="p-8 text-center">Quadra não encontrada</div>

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to={`/projetos/${project?.local_id}`}
          className="hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> {project?.name || 'Projeto'}
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-900">{quadra.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{quadra.name}</h1>
          <p className="text-sm text-gray-500">
            {lotes.length} lotes cadastrados
          </p>
        </div>
        {canEditProjects && (
          <Button asChild className="bg-green-600">
            <Link to={`/quadras/${quadraId}/lotes/new`}>
              <Plus className="h-4 w-4 mr-2" /> Novo Lote
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lotes.map((lote) => {
          const survey = surveys.get(lote.local_id)
          const hasAnaliseIA = survey?.analise_ia_classificacao
          const isBlocked = hasAnaliseIA && !isAdminOrAssistant

          return (
          <Card
            key={lote.local_id}
            className={`overflow-hidden flex flex-col transition-all ${
              isBlocked 
                ? 'opacity-60 hover:shadow-none border-orange-300 bg-orange-50/30' 
                : 'hover:shadow-lg'
            }`}
          >
            <div className="aspect-video w-full overflow-hidden bg-muted relative">
              <img
                src={`https://img.usecurling.com/p/400/250?q=house%20map&color=blue`}
                alt={`Imagem do lote ${lote.name}`}
                className={`w-full h-full object-cover transition-transform ${!isBlocked ? 'hover:scale-105' : ''} duration-500`}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {hasAnaliseIA && (
                  <Badge className="px-2.5 py-0.5 text-xs font-semibold bg-purple-600 text-white border-purple-600">
                    IA Analisado
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: lote.status === 'synchronized' 
                      ? '#10b981'  // verde
                      : lote.status === 'surveyed'
                        ? '#10b981'  // verde
                        : lote.status === 'regularized'
                          ? '#3b82f6'  // azul
                          : lote.status === 'not_surveyed'
                            ? '#6b7280'  // cinza
                            : '#eab308', // amarelo (para pending)
                    color: 'white',
                    borderColor: lote.status === 'synchronized' 
                      ? '#10b981'
                      : lote.status === 'surveyed'
                        ? '#10b981'
                        : lote.status === 'regularized'
                          ? '#3b82f6'
                          : lote.status === 'not_surveyed'
                            ? '#6b7280'
                            : '#eab308'
                  }}
                >
                  {lote.status === 'synchronized' 
                    ? 'Sincronizado'
                    : lote.status === 'surveyed'
                      ? 'Vistoriado'
                      : lote.status === 'regularized'
                        ? 'Regularizado'
                        : lote.status === 'not_surveyed'
                          ? 'Não Vistoriado'
                          : 'Pendente'}
                </Badge>
              </div>
              {isBlocked && (
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3">
                    <Lock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    Lote {lote.name}
                  </CardTitle>
                  {isBlocked && (
                    <p className="text-xs text-orange-600 mt-1 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Bloqueado para edição (Análise IA concluída)
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">

                    <Home className="w-3 h-3" /> Área:{' '}
                    {lote.area || 'Não informada'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">
                    {lote.address || 'Sem endereço'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>
                    ID: {lote.local_id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/20">
              <div className="flex gap-2 w-full">
                <Button asChild className="flex-1" disabled={isBlocked}>
                  <Link to={`/lotes/${lote.local_id}`}>
                    <Home className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Link>
                </Button>
                {canEditProjects && !isBlocked && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/lotes/${lote.local_id}/editar`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteLote(lote)}
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
          )
        })}
        {lotes.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum lote encontrado</p>
            <p className="text-sm mt-1">Tente ajustar sua busca ou adicione novos lotes</p>
          </div>
        )}
      </div>
    </div>
  )
}
