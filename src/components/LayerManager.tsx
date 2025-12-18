import { useState } from 'react'
import { DrawingLayer } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Trash2, Plus, Edit2, Check, X } from 'lucide-react'
import { db } from '@/services/db'
import { cn } from '@/lib/utils'

interface LayerManagerProps {
  layers: DrawingLayer[]
  onUpdate: () => void
  activeLayerId: string
  onSetActiveLayer: (id: string) => void
}

export function LayerManager({
  layers,
  onUpdate,
  activeLayerId,
  onSetActiveLayer,
}: LayerManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newLayerName, setNewLayerName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = () => {
    if (!newLayerName.trim()) return
    db.saveDrawingLayer({
      id: crypto.randomUUID(),
      name: newLayerName,
      visible: true,
    })
    setNewLayerName('')
    setIsCreating(false)
    onUpdate()
  }

  const handleDelete = (id: string) => {
    if (
      confirm('Excluir camada? Os desenhos serão movidos para a camada padrão.')
    ) {
      db.deleteDrawingLayer(id)
      onUpdate()
    }
  }

  const handleToggle = (layer: DrawingLayer) => {
    db.saveDrawingLayer({ ...layer, visible: !layer.visible })
    onUpdate()
  }

  const startEdit = (layer: DrawingLayer) => {
    setEditingId(layer.id)
    setEditName(layer.name)
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      const layer = layers.find((l) => l.id === editingId)
      if (layer) {
        db.saveDrawingLayer({ ...layer, name: editName })
        onUpdate()
      }
    }
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Minhas Camadas</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 mb-2 animate-fade-in">
          <Input
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            placeholder="Nome da camada"
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="icon" className="h-8 w-8" onClick={handleCreate}>
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setIsCreating(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <ul className="space-y-1 max-h-[300px] overflow-y-auto">
        {layers.map((layer) => (
          <li
            key={layer.id}
            className={cn(
              'flex items-center justify-between p-2 rounded text-sm group',
              activeLayerId === layer.id
                ? 'bg-blue-50 border border-blue-100'
                : 'hover:bg-slate-50',
            )}
            onClick={() => onSetActiveLayer(layer.id)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  activeLayerId === layer.id ? 'bg-blue-500' : 'bg-transparent',
                )}
                title={
                  activeLayerId === layer.id
                    ? 'Camada Ativa'
                    : 'Clique para ativar'
                }
              />

              {editingId === layer.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-6 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      saveEdit()
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <span className="truncate cursor-pointer flex-1">
                  {layer.name}
                </span>
              )}
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              {editingId !== layer.id && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    startEdit(layer)
                  }}
                >
                  <Edit2 className="h-3 w-3 text-gray-500" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggle(layer)
                }}
              >
                {layer.visible ? (
                  <Eye className="h-3 w-3 text-gray-600" />
                ) : (
                  <EyeOff className="h-3 w-3 text-gray-300" />
                )}
              </Button>
              {layers.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(layer.id)
                  }}
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground mt-2">
        * Clique em uma camada para torná-la ativa. Novos desenhos serão
        adicionados à camada ativa.
      </p>
    </div>
  )
}
