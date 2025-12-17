import { useState, useEffect } from 'react'
import { db } from '@/services/db'
import { SavedCoordinate } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Trash2, Edit2, Plus, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function SavedCoordinates() {
  const navigate = useNavigate()
  const [coords, setCoords] = useState<SavedCoordinate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentCoord, setCurrentCoord] = useState<Partial<SavedCoordinate>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setCoords(db.getSavedCoordinates())
  }

  const handleSave = () => {
    if (
      !currentCoord.name ||
      !currentCoord.latitude ||
      !currentCoord.longitude
    ) {
      toast.error('Preencha todos os campos')
      return
    }

    const coordData: SavedCoordinate = {
      id: currentCoord.id || '',
      name: currentCoord.name,
      latitude: currentCoord.latitude,
      longitude: currentCoord.longitude,
    }

    db.saveSavedCoordinate(coordData)
    toast.success('Coordenada salva com sucesso')
    setIsDialogOpen(false)
    loadData()
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta coordenada?')) {
      db.deleteSavedCoordinate(id)
      toast.success('Coordenada removida')
      loadData()
    }
  }

  const openEdit = (c: SavedCoordinate) => {
    setCurrentCoord({ ...c })
    setIsDialogOpen(true)
  }

  const openNew = () => {
    setCurrentCoord({ name: '', latitude: '', longitude: '' })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/configuracoes')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Coordenadas Salvas
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie locais predefinidos para uso nos projetos.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova Coordenada
        </Button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Local</TableHead>
              <TableHead>Latitude</TableHead>
              <TableHead>Longitude</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coords.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.latitude}</TableCell>
                <TableCell>{c.longitude}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {coords.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhuma coordenada salva.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentCoord.id ? 'Editar Coordenada' : 'Nova Coordenada'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Local</Label>
              <Input
                id="name"
                placeholder="Ex: Praça Central"
                value={currentCoord.name}
                onChange={(e) =>
                  setCurrentCoord({ ...currentCoord, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  placeholder="0.000000"
                  value={currentCoord.latitude}
                  onChange={(e) =>
                    setCurrentCoord({
                      ...currentCoord,
                      latitude: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  placeholder="-00.000000"
                  value={currentCoord.longitude}
                  onChange={(e) =>
                    setCurrentCoord({
                      ...currentCoord,
                      longitude: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
