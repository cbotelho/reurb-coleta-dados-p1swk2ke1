import { useState, useEffect } from 'react'
import { db } from '@/services/db'
import { DrawingHistory, MapDrawing } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Clock, Edit2, Plus, Trash, PaintBucket } from 'lucide-react'

interface HistoryPanelProps {
  drawingId: string | null
  open: boolean
  onClose: () => void
}

export function HistoryPanel({ drawingId, open, onClose }: HistoryPanelProps) {
  const [history, setHistory] = useState<DrawingHistory[]>([])
  const [drawing, setDrawing] = useState<MapDrawing | undefined>()

  useEffect(() => {
    if (drawingId && open) {
      setHistory(db.getDrawingHistory(drawingId))
      const drawings = db.getMapDrawings()
      setDrawing(drawings.find((d) => d.id === drawingId))
    }
  }, [drawingId, open])

  const getIcon = (action: DrawingHistory['action']) => {
    switch (action) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-500" />
      case 'update':
        return <Edit2 className="h-4 w-4 text-blue-500" />
      case 'delete':
        return <Trash className="h-4 w-4 text-red-500" />
      case 'style_change':
        return <PaintBucket className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Criado'
      case 'update':
        return 'Editado'
      case 'delete':
        return 'Excluído'
      case 'style_change':
        return 'Estilo'
      default:
        return action
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Histórico de Edições</SheetTitle>
          <SheetDescription>
            {drawing
              ? `Log de alterações para ${drawing.type} (${drawing.id.slice(0, 8)})`
              : 'Selecione uma geometria para ver o histórico.'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-150px)] mt-6 pr-4">
          <div className="space-y-6">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico registrado para este item.
              </p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="relative pl-6 pb-6 border-l last:pb-0"
                >
                  <div className="absolute -left-3 top-0 bg-background p-1 rounded-full border">
                    {getIcon(item.action)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {getActionLabel(item.action)} por {item.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 bg-slate-50 p-2 rounded border">
                      {item.details}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
