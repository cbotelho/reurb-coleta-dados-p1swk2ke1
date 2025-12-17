import { useState } from 'react'
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
import { Project } from '@/types'
import { db } from '@/services/db'
import { toast } from 'sonner'

interface ProjectMapUpdateDialogProps {
  project: Project
  onUpdate: (updatedProject: Project) => void
}

export function ProjectMapUpdateDialog({
  project,
  onUpdate,
}: ProjectMapUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    if (!lat || !lng) {
      toast.error('Por favor, informe a latitude e longitude.')
      return
    }

    setLoading(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate URL (Using allowed placeholder service to mock Google Maps Static)
    // We add lat/lng to the query to make the image URL specific to the inputs
    const mapUrl = `https://img.usecurling.com/p/800/400?q=satellite%20map%20${lat}%20${lng}&color=green`

    const updatedProject = {
      ...project,
      field_351: mapUrl,
    }

    try {
      const result = db.updateProject(updatedProject)
      onUpdate(result)
      toast.success('Imagem do projeto atualizada com sucesso!')
      setOpen(false)
      // Clear inputs
      setLat('')
      setLng('')
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
            Informe as coordenadas geográficas para gerar uma nova imagem
            estática do mapa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
