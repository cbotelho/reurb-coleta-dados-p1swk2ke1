import { useState, useEffect } from 'react'
import { db } from '@/services/db'
import { AppSettings, MapKey, MarkerConfig } from '@/types'
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
import { Trash2, Save, MapPin, Plus, Key } from 'lucide-react'
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

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(db.getSettings())
  const [mapKeys, setMapKeys] = useState<MapKey[]>([])
  const [markerConfigs, setMarkerConfigs] = useState<MarkerConfig[]>([])
  const [newKey, setNewKey] = useState({ name: '', key: '', mapId: '' })

  useEffect(() => {
    setSettings(db.getSettings())
    setMapKeys(db.getMapKeys())
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

  const addMapKey = () => {
    if (!newKey.name || !newKey.key) {
      toast.error('Preencha nome e chave.')
      return
    }
    db.saveMapKey({
      id: '',
      name: newKey.name,
      key: newKey.key,
      mapId: newKey.mapId,
      isActive: mapKeys.length === 0, // First key active by default
      createdAt: Date.now(),
    })
    setMapKeys(db.getMapKeys())
    setNewKey({ name: '', key: '', mapId: '' })
    toast.success('Chave API adicionada.')
  }

  const deleteMapKey = (id: string) => {
    db.deleteMapKey(id)
    setMapKeys(db.getMapKeys())
    toast.success('Chave removida.')
  }

  const activateMapKey = (id: string) => {
    const key = mapKeys.find((k) => k.id === id)
    if (key) {
      key.isActive = true
      db.saveMapKey(key)
      setMapKeys(db.getMapKeys())
      toast.success('Chave ativada. Recarregue a página se necessário.')
    }
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
    <div className="space-y-6 pb-20">
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
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chaves de API (Google Maps)</CardTitle>
              <CardDescription>
                Gerencie as chaves de acesso para os serviços de mapa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 p-4 border rounded-lg bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Chave</Label>
                    <Input
                      placeholder="Ex: Produção"
                      value={newKey.name}
                      onChange={(e) =>
                        setNewKey({ ...newKey, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      placeholder="AIza..."
                      value={newKey.key}
                      onChange={(e) =>
                        setNewKey({ ...newKey, key: e.target.value })
                      }
                      type="password"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Map ID (Opcional - Para Marcadores Avançados)</Label>
                    <Input
                      placeholder="Ex: 8e0a97af9386f..."
                      value={newKey.mapId}
                      onChange={(e) =>
                        setNewKey({ ...newKey, mapId: e.target.value })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Necessário para usar recursos de renderização moderna
                      (Advanced Markers).
                    </p>
                  </div>
                </div>
                <Button onClick={addMapKey} className="w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Chave
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Chaves Salvas</Label>
                {mapKeys.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {mapKeys.map((k) => (
                      <div
                        key={k.id}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Key className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{k.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Key: {k.key.substring(0, 8)}... | Map ID:{' '}
                              {k.mapId || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {k.isActive ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              Ativa
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateMapKey(k.id)}
                            >
                              Ativar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMapKey(k.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhuma chave cadastrada.
                  </p>
                )}
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
      </Tabs>
    </div>
  )
}
