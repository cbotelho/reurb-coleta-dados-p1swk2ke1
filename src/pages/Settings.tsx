import { useState, useEffect } from 'react'
import { db } from '@/services/db'
import { AppSettings } from '@/types'
import { Button } from '@/components/ui/button'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { notificationService } from '@/services/notification'
import { Trash2, Save, MapPin } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Link } from 'react-router-dom'

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(db.getSettings())

  useEffect(() => {
    setSettings(db.getSettings())
  }, [])

  const handleSave = () => {
    db.saveSettings(settings)
    toast.success('Configurações salvas com sucesso!')
    if (settings.pushNotifications) {
      notificationService.requestPermission().then((granted) => {
        if (granted) {
          notificationService.send(
            'Notificações Ativas',
            'Você receberá alertas do sistema.',
            'success',
          )
        } else {
          toast.warning('Permissão para notificações negada pelo navegador.')
        }
      })
    }
  }

  const handleClearCache = () => {
    db.clearCache()
    toast.success('Cache limpo com sucesso! A aplicação será recarregada.')
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie o comportamento e preferências do aplicativo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geolocalização</CardTitle>
          <CardDescription>
            Gerencie locais e configurações de mapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link to="/configuracoes/coordenadas">
              <MapPin className="w-4 h-4 mr-2" />
              Gerenciar Coordenadas Salvas
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conexão e Sincronização</CardTitle>
          <CardDescription>
            Configure como o app se comunica com o servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-endpoint">Endpoint da API</Label>
            <Input
              id="api-endpoint"
              value={settings.apiEndpoint}
              onChange={(e) =>
                setSettings({ ...settings, apiEndpoint: e.target.value })
              }
              placeholder="https://api.exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sync-freq">Frequência de Sincronização</Label>
            <Select
              value={settings.syncFrequency}
              onValueChange={(val: any) =>
                setSettings({ ...settings, syncFrequency: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual apenas</SelectItem>
                <SelectItem value="auto-5m">Automático (5 min)</SelectItem>
                <SelectItem value="auto-15m">Automático (15 min)</SelectItem>
                <SelectItem value="auto-1h">Automático (1 hora)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências do Aplicativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas sobre tarefas e sincronização.
              </p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pushNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cache Offline</Label>
              <p className="text-sm text-muted-foreground">
                Manter dados salvos no dispositivo.
              </p>
            </div>
            <Switch
              checked={settings.cacheEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, cacheEnabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-100 bg-red-50/10">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Cache e Resetar Dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá apagar todos os dados locais, incluindo lotes não
                  sincronizados. O aplicativo voltará ao estado inicial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearCache}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sim, limpar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  )
}
