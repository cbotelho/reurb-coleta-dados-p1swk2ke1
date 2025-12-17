import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '@/services/db'
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
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function QuadraDetails() {
  const { quadraId } = useParams<{ quadraId: string }>()
  const [quadra, setQuadra] = useState<Quadra | undefined>()
  const [lotes, setLotes] = useState<Lote[]>([])

  useEffect(() => {
    if (quadraId) {
      setQuadra(db.getQuadra(quadraId))
      setLotes(db.getLotesByQuadra(quadraId))
    }
  }, [quadraId])

  if (!quadra)
    return <div className="p-4 text-center">Quadra não encontrada.</div>

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synchronized':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-orange-400" />
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{quadra.field_329}</h2>
          <p className="text-muted-foreground">
            Projeto: {quadra.field_349} • Área: {quadra.field_330}
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" /> Arquivo de Documento
            </span>
            <p className="font-mono bg-muted p-2 rounded break-all">
              {quadra.field_331 || 'Nenhum documento anexado'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-medium text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Imagem da Quadra
            </span>
            <p className="font-mono bg-muted p-2 rounded break-all">
              {quadra.field_332 || 'Nenhuma imagem definida'}
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
                          {lote.field_338}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {lote.field_339} • {lote.field_352.length} fotos
                        </CardDescription>
                      </div>
                      <div title={`Status: ${lote.sync_status}`}>
                        {getStatusIcon(lote.sync_status)}
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
