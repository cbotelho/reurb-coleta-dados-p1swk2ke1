import { useState, useEffect } from 'react'
import { db } from '@/services/db'
import { GeoAlert, MapDrawing } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Trash2,
  Plus,
  Bell,
  Map as MapIcon,
  Edit2,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function GeoAlerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<GeoAlert[]>([])
  const [drawings, setDrawings] = useState<MapDrawing[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentAlert, setCurrentAlert] = useState<Partial<GeoAlert>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setAlerts(db.getGeoAlerts())
    // Only polygons can be alert zones usually
    setDrawings(db.getMapDrawings().filter((d) => d.type === 'polygon'))
  }

  const handleSave = () => {
    if (!currentAlert.name || !currentAlert.geometryId) {
      toast.error('Preencha nome e selecione uma zona.')
      return
    }

    const alert: GeoAlert = {
      id: currentAlert.id || crypto.randomUUID(),
      name: currentAlert.name,
      enabled: currentAlert.enabled ?? true,
      condition: currentAlert.condition || 'enter',
      geometryId: currentAlert.geometryId,
    }

    db.saveGeoAlert(alert)
    toast.success('Alerta geográfico salvo.')
    setIsDialogOpen(false)
    loadData()
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza?')) {
      db.deleteGeoAlert(id)
      loadData()
      toast.success('Alerta removido.')
    }
  }

  const openNew = () => {
    if (drawings.length === 0) {
      toast.warning('Você precisa desenhar polígonos no mapa primeiro.')
      navigate('/mapa')
      return
    }
    setCurrentAlert({ name: '', enabled: true, condition: 'enter' })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/mapa')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Alertas Geográficos
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie zonas de monitoramento e notificações.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Alerta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zonas Ativas</CardTitle>
          <CardDescription>
            O sistema monitora estas áreas e notifica quando a condição é
            atendida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Zona (Polígono)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => {
                const zone = drawings.find((d) => d.id === alert.geometryId)
                return (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      {alert.name}
                    </TableCell>
                    <TableCell>
                      {alert.condition === 'enter' ? 'Ao Entrar' : 'Ao Sair'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      ID: {zone?.id.substring(0, 8) || 'Desconhecido'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={(c) => {
                          db.saveGeoAlert({ ...alert, enabled: c })
                          loadData()
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(alert.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {alerts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum alerta configurado. Crie polígonos no mapa para
                    começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Alerta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Alerta</Label>
              <Input
                value={currentAlert.name}
                onChange={(e) =>
                  setCurrentAlert({ ...currentAlert, name: e.target.value })
                }
                placeholder="Ex: Área de Risco"
              />
            </div>
            <div className="space-y-2">
              <Label>Condição de Disparo</Label>
              <Select
                value={currentAlert.condition}
                onValueChange={(v: any) =>
                  setCurrentAlert({ ...currentAlert, condition: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enter">Ao Entrar na Zona</SelectItem>
                  <SelectItem value="exit">Ao Sair da Zona</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zona Geográfica (Polígono)</Label>
              <Select
                value={currentAlert.geometryId}
                onValueChange={(v) =>
                  setCurrentAlert({ ...currentAlert, geometryId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um polígono..." />
                </SelectTrigger>
                <SelectContent>
                  {drawings.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      Polígono {d.id.substring(0, 6)}... (Criado em{' '}
                      {new Date(d.createdAt).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {drawings.length === 0 && (
                <p className="text-xs text-red-500">
                  Nenhum polígono disponível. Desenhe no mapa primeiro.
                </p>
              )}
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
