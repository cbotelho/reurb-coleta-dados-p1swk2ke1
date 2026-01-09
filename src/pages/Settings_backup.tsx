import { useState, useEffect } from 'react'
import { db } from '@/services/db'
import { AppSettings, MarkerConfig } from '@/types'
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
import { Trash2, Save, MapPin, Key, ShieldCheck, Database, Upload } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<AppSettings>(db.getSettings())
  const [markerConfigs, setMarkerConfigs] = useState<MarkerConfig[]>([])
  
  // Verificar se é administrador
  const isAdmin = user?.email?.includes('admin') || 
                   user?.email?.includes('gea') || 
                   user?.email === 'cbotelho@gea.com.br' ||
                   user?.email === 'cbotelho.80@urbanus.tec.br'

  useEffect(() => {
    setSettings(db.getSettings())
    setMarkerConfigs(db.getMarkerConfigs())
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
        }
      })
    }
  }

  const handleClearCache = () => {
    db.clearCache()
    toast.success('Cache limpo com sucesso! A aplicação será recarregada.')
    setTimeout(() => window.location.reload(), 1500)
  }

  const updateMarkerColor = (id: string, color: string) => {
    const config = markerConfigs.find((c) => c.id === id)
    if (config) {
      const updated = { ...config, color }
      db.saveMarkerConfig(updated)
      setMarkerConfigs(db.getMarkerConfigs())
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie o comportamento e preferências do aplicativo.
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="map">Mapas e Geolocalização</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin">Ferramentas Admin</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
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
                      <SelectItem value="auto-15m">
                        Automático (15 min)
                      </SelectItem>
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
                  <div>
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas importantes no seu dispositivo.
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
                  <div>
                    <Label>Cache Offline</Label>
                    <p className="text-sm text-muted-foreground">
                      Mantenha dados locais para uso sem internet.
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
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chaves de API (Google Maps)</CardTitle>
                <CardDescription>
                  Gerenciamento de acesso aos serviços de mapa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800">
                      Configuração Gerenciada pelo Sistema
                    </h4>
                    <p className="text-sm text-green-700">
                      A chave de API do Google Maps é gerenciada centralmente e
                      sincronizada automaticamente com o servidor. Não é
                      necessário configuração manual.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 opacity-50 pointer-events-none">
                  <Label>Chave de Acesso Atual</Label>
                  <div className="flex gap-2">
                    <Input
                      value={
                        settings.googleMapsApiKey
                          ? '****************'
                          : 'Não configurada'
                      }
                      disabled
                      type="text"
                    />
                    <Button disabled variant="outline">
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personalização de Marcadores</CardTitle>
                <CardDescription>
                  Defina as cores dos marcadores para cada status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {markerConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <Label className="font-medium">{config.label}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={config.color}
                          onChange={(e) =>
                            updateMarkerColor(config.id, e.target.value)
                          }
                          className="w-12 h-8 p-1 cursor-pointer"
                        />
                        <span className="text-xs font-mono">{config.color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coordenadas Salvas</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/configuracoes/coordenadas">
                    <MapPin className="w-4 h-4 mr-2" />
                    Gerenciar Locais Salvos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Ferramentas Administrativas
                  </CardTitle>
                  <CardDescription>
                    Ferramentas exclusivas para administradores do sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <ShieldCheck className="h-5 w-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-800">
                        Acesso Restrito
                      </h4>
                    </div>
                    <p className="text-sm text-amber-700">
                      Estas ferramentas são exclusivas para administradores e permitem
                      manipulação direta dos dados do sistema. Use com cuidado.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-1">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      asChild
                    >
                      <Link to="/importar-csv">
                        <Upload className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Importação de Dados CSV</div>
                          <div className="text-xs text-muted-foreground">
                            Importe projetos, quadras e lotes em massa
                          </div>
                        </div>
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      asChild
                    >
                      <Link to="/configuracoes/coordenadas">
                        <MapPin className="w-4 h-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Coordenadas Salvas</div>
                          <div className="text-xs text-muted-foreground">
                            Gerencie locais e pontos de referência
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
