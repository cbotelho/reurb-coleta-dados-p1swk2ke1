import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CustomLayer } from '@/types'
import { toast } from 'sonner'
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react'
import { parseKML } from '@/utils/kmlParser'

interface ExternalDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddLayer: (layer: CustomLayer) => void
}

export function ExternalDataDialog({
  open,
  onOpenChange,
  onAddLayer,
}: ExternalDataDialogProps) {
  const [activeTab, setActiveTab] = useState('url')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUrlSubmit = async () => {
    if (!name || !url) {
      toast.error('Preencha o nome e a URL.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Falha ao buscar dados.')
      const json = await response.json()

      const layer: CustomLayer = {
        id: crypto.randomUUID(),
        name,
        data: json,
        visible: true,
        zIndex: 10,
      }

      onAddLayer(layer)
      toast.success('Camada adicionada com sucesso!')
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar GeoJSON da URL.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSubmit = () => {
    if (!name || !file) {
      toast.error('Preencha o nome e selecione um arquivo.')
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let json

        if (file.name.toLowerCase().endsWith('.kml')) {
          json = parseKML(content)
        } else {
          json = JSON.parse(content)
        }

        const layer: CustomLayer = {
          id: crypto.randomUUID(),
          name,
          data: json,
          visible: true,
          zIndex: 10,
        }

        onAddLayer(layer)
        toast.success(
          `Camada ${file.name.toLowerCase().endsWith('.kml') ? 'KML' : 'GeoJSON'} importada!`,
        )
        onOpenChange(false)
        resetForm()
      } catch (error) {
        console.error(error)
        toast.error('Arquivo inválido ou corrompido.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const resetForm = () => {
    setName('')
    setUrl('')
    setFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Dados Externos</DialogTitle>
          <DialogDescription>
            Importe arquivos GeoJSON, KML ou conecte a uma API.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome da Camada</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Áreas de Risco"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">
                <LinkIcon className="w-4 h-4 mr-2" /> URL / API
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="w-4 h-4 mr-2" /> Arquivo Local
              </TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>URL do GeoJSON</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.exemplo.com/dados.json"
                />
              </div>
            </TabsContent>
            <TabsContent value="file" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Arquivo (.json, .geojson, .kml)</Label>
                <Input
                  type="file"
                  accept=".json,.geojson,.kml"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={activeTab === 'url' ? handleUrlSubmit : handleFileSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Adicionar Camada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
