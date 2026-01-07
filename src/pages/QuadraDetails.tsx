import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Quadra, Lote, Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, MapPin, ArrowLeft, Loader2, Home } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function QuadraDetails() {
  const { quadraId } = useParams<{ quadraId: string }>()
  const [quadra, setQuadra] = useState<Quadra | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [quadraId])

  const filteredLotes = lotes.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'surveyed':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Vistoriado</Badge>
        )
      case 'in_analysis':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            Em Análise
          </Badge>
        )
      case 'regularized':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            Regularizado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            Pendente
          </Badge>
        )
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
        <Button asChild className="bg-blue-600">
          <Link to={`/quadras/${quadraId}/lotes/new`}>
            <Plus className="h-4 w-4 mr-2" /> Novo Lote
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar lote..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead className="hidden sm:table-cell">Área</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLotes.map((lote) => (
                  <TableRow key={lote.local_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-400" />
                        {lote.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {lote.area}
                    </TableCell>
                    <TableCell>{getStatusBadge(lote.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/lotes/${lote.local_id}`}>Abrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLotes.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum lote encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
