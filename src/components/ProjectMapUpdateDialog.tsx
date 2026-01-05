import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Map, Loader2 } from 'lucide-react'
import { Project, SavedCoordinate } from '@/types'
import { db } from '@/services/db'
import { api } from '@/services/api'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface ProjectMapUpdateDialogProps {
  project: Project
  onUpdate: (updatedProject: Project) => void
}

export function ProjectMapUpdateDialog({
  project,
  onUpdate,
}: ProjectMapUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const [lat, setLat] = useState(project.latitude || '')
  const [lng, setLng] = useState(project.longitude || '')
  const [autoUpdate, setAutoUpdate] = useState(project.auto_update_map || false)
  const [loading, setLoading] = useState(false)
  const [savedCoords, setSavedCoords] = useState<SavedCoordinate[]>([])

  useEffect(() => {
    if (open) {
      setSavedCoords(db.getSavedCoordinates())
      setLat(project.latitude || '')
      setLng(project.longitude || '')
      setAutoUpdate(project.auto_update_map || false)
    }
  }, [open, project])

  const handleSavedCoordSelect = (val: string) => {
    const coord = savedCoords.find((c) => c.id === val)
    if (coord) {
      setLat(coord.latitude)
      setLng(coord.longitude)
    }
  }

  const handleUpdate = async () => {
    if (!lat || !lng) {
      toast.error('Por favor, informe a latitude e longitude.')
      return
    }

    setLoading(true)

    // Generate URL (Using allowed placeholder service to mock Google Maps Static)
    const mapUrl = `https://img.usecurling.com/p/800/400?q=satellite%20map%20${lat}%20${lng}&color=green`

    try {
      const result = await api.updateProject(project.local_id, {
        image_url: mapUrl,
        latitude: lat,
        longitude: lng,
        auto_update_map: autoUpdate,
        last_map_update: Date.now(),
      })
      onUpdate(result)
      toast.success('Imagem do projeto atualizada com sucesso!')
      setOpen(false)
    } catch (error) {
      toast.error('Erro ao atualizar o projeto.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Map className="w-4 h-4 mr-2" />
          Atualizar Imagem do Mapa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atualizar Mapa do Projeto</DialogTitle>
          <DialogDescription>
            Informe as coordenadas ou selecione um local salvo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Local Salvo</Label>
            <div className="col-span-3">
              <Select onValueChange={handleSavedCoordSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {savedCoords.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lat" className="text-right">
              Latitude
            </Label>
            <Input
              id="lat"
              placeholder="ex: 0.0420571"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lng" className="text-right">
              Longitude
            </Label>
            <Input
              id="lng"
              placeholder="ex: -51.1247705"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center space-x-2">
              <Checkbox
                id="autoUpdate"
                checked={autoUpdate}
                onCheckedChange={(c) => setAutoUpdate(!!c)}
              />
              <Label htmlFor="autoUpdate">
                Atualização Automática de Imagem
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" onClick={handleUpdate} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Gerar e Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
