import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Quadra, Lote } from '@/types'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function QuadraDetails() {
  const { quadraId } = useParams<{ quadraId: string }>()
  const [quadra, setQuadra] = useState<Quadra | undefined>()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (quadraId) {
      loadData(quadraId)
    }
  }, [quadraId])

  const loadData = async (id: string) => {
    try {
      setLoading(true)
      const q = await api.getQuadra(id)
      if (q) {
        setQuadra(q)
        const l = await api.getLotes(id)
        setLotes(l)
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar quadra.')
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )

  if (!quadra)
    return <div className="p-4 text-center">Quadra não encontrada.</div>

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{quadra.name}</h2>
          <p className="text-muted-foreground">Área: {quadra.area}</p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" /> Arquivo de Documento
            </span>
            <p className="font-mono bg-muted p-2 rounded break-all">
              {quadra.document_url || 'Nenhum documento anexado'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-medium text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Imagem da Quadra
            </span>
            <p className="font-mono bg-muted p-2 rounded break-all">
              {quadra.image_url || 'Nenhuma imagem definida'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Lotes ({lotes.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lotes.length > 0 ? (
            lotes.map((lote) => (
              <Link key={lote.local_id} to={`/lotes/${lote.local_id}`}>
                <Card className="hover:bg-slate-50 transition-colors h-full">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold">
                          {lote.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {lote.area} • {lote.images.length} fotos
                        </CardDescription>
                      </div>
                      <div title="Sincronizado">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-muted-foreground bg-white rounded-lg border border-dashed">
              Nenhum lote cadastrado nesta quadra.
            </div>
          )}
        </div>
      </div>

      <Link
        to={`/quadras/${quadraId}/lotes/new`}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-30"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-elevation bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </Link>
    </div>
  )
}
