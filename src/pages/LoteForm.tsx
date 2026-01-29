import { TesteGPS } from '@/components/TesteGPS'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/services/api'
import { Lote } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhotoCapture } from '@/components/PhotoCapture'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Printer, Loader2, FileText, Image, Navigation, MapPin } from 'lucide-react'
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
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SurveyForm } from '@/components/SurveyForm'
import { useSync } from '@/contexts/SyncContext'
import { reportService } from '@/services/report'

const formSchema = z.object({
  name: z.string().min(1, 'Nome do lote é obrigatório'),
  address: z.string().optional(),
  area: z.string().min(1, 'Área é obrigatória'),
  description: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function LoteForm() {
  const { loteId, quadraId } = useParams<{
    loteId?: string
    quadraId?: string
  }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { refreshStats } = useSync()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [parentQuadraId, setParentQuadraId] = useState<string | undefined>(quadraId)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentLote, setCurrentLote] = useState<Lote | undefined>()
  const { hasPermission } = useAuth()
  
  const canEdit = true

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      area: '',
      description: '',
      latitude: '',
      longitude: '',
      images: [],
      status: 'not_surveyed',
    },
  })

  useEffect(() => {
    const loadLote = async (id: string) => {
      setFetching(true)
      try {
        const lote = await api.getLote(id)
        if (lote) {
          setIsEditMode(true)
          setParentQuadraId(lote.parent_item_id)
          setCurrentLote(lote)
          form.reset({
            name: lote.name,
            address: lote.address || '',
            area: lote.area,
            description: lote.description || '',
            latitude: lote.latitude || '',
            longitude: lote.longitude || '',
            images: lote.images || [],
            status: lote.status || 'not_surveyed',
          })
        }
      } catch (e) {
        console.error('Erro ao carregar lote:', e)
      } finally {
        setFetching(false)
      }
    }

    if (loteId) loadLote(loteId)
  }, [loteId, form])

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) return
    if (!parentQuadraId) return

    setLoading(true)
    try {
      const saved = await api.saveLote({
        local_id: isEditMode ? loteId : undefined,
        quadra_id: parentQuadraId,
        name: values.name,
        address: values.address,
        area: values.area,
        description: values.description || '',
        latitude: values.latitude,
        longitude: values.longitude,
        images: values.images || [],
        status: values.status,
      } as any)

      refreshStats()

      toast({
        title: saved.sync_status === 'pending' ? 'Salvo Localmente' : 'Sucesso',
        description: 'Lote atualizado com sucesso!',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao salvar lote',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (loteId && canEdit) {
      try {
        await api.deleteLote(loteId)
        toast({ title: 'Sucesso', description: 'Lote removido.' })
        navigate(-1)
      } catch (e) {
        toast({
          title: 'Erro',
          description: 'Erro ao deletar lote',
          variant: 'destructive',
        })
      }
    }
  }

  const handlePrint = async () => {
    if (currentLote && parentQuadraId) {
      const quadra = await api.getQuadra(parentQuadraId)
      const project = quadra
        ? await api.getProject(quadra.parent_item_id)
        : undefined
      reportService.generateLoteReport(
        currentLote,
        quadra?.name || 'Desconhecida',
        project?.name || 'Desconhecido',
      )
    }
  }

  const handleGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude.toFixed(6))
          form.setValue('longitude', position.coords.longitude.toFixed(6))
          toast({ 
            title: 'Localização obtida', 
            description: 'Coordenadas atualizadas.' 
          })
        },
        (error) => {
          toast({ 
            title: 'Erro ao obter localização', 
            description: error.message, 
            variant: 'destructive' 
          })
        }
      )
    } else {
      toast({ 
        title: 'Geolocalização não suportada', 
        description: 'Seu navegador não suporta geolocalização.', 
        variant: 'destructive' 
      })
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 px-2 sm:px-0 max-w-3xl mx-auto">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-xl font-bold">
            {isEditMode ? form.getValues('name') : 'Novo Lote'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {currentLote?.area || 'Nova área'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
          )}
          {isEditMode && canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Lote?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ação irreversível.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Tabs defaultValue={isEditMode ? "survey" : "lote"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="survey"
            disabled={!isEditMode}
            className="flex gap-2"
          >
            <FileText className="h-4 w-4" /> Vistoria
          </TabsTrigger>
          <TabsTrigger value="lote" className="flex gap-2">
            <Image className="h-4 w-4" /> Dados & Fotos
          </TabsTrigger>
        </TabsList>

        {/* ABA LOTE - TESTE SIMPLES DIRETO */}
        <TabsContent value="lote">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 bg-white p-4 sm:p-6 rounded-lg border shadow-sm mt-4"
            >
              {/* TESTE: BOTÃO FORA DO FORM FIELD - DIRETO NO HTML */}
              <div className="border-2 border-red-500 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-red-600 mb-4">TESTE DE BOTÃO (DEVE APARECER)</h3>
                
                {/* BOTÃO FORA DE QUALQUER COMPONENTE */}
                <Button
                  type="button"
                  onClick={handleGeolocation}
                  className="bg-red-600 hover:bg-red-700 text-white mb-4"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  TESTE: CAPTURAR LOCALIZAÇÃO
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Latitude</label>
                    <input
                      value={form.getValues('latitude')}
                      onChange={(e) => form.setValue('latitude', e.target.value)}
                      placeholder="Ex: -0.036161"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Longitude</label>
                    <input
                      value={form.getValues('longitude')}
                      onChange={(e) => form.setValue('longitude', e.target.value)}
                      placeholder="Ex: -51.130895"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                
                {/* OUTRO BOTÃO DEPOIS DOS CAMPOS */}
                <Button
                  type="button"
                  onClick={handleGeolocation}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  CAPTURAR LOCALIZAÇÃO (2)
                </Button>
              </div>

              {/* VERSÃO COM FORM FIELD - PARA COMPARAÇÃO */}
              <div className="border-2 border-blue-500 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-blue-600 mb-4">VERSÃO COM FORM FIELD</h3>
                
                {/* BOTÃO ANTES DO FORM FIELD */}
                <Button
                  type="button"
                  onClick={handleGeolocation}
                  className="mb-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  BOTÃO ANTES DO FORM FIELD
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    control={form.control} 
                    name="latitude" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: -0.036161" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="longitude" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: -51.130895" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                </div>
                
                {/* BOTÃO DEPOIS DO FORM FIELD */}
                <Button
                  type="button"
                  onClick={handleGeolocation}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  BOTÃO DEPOIS DO FORM FIELD
                </Button>
              </div>

              {/* RESTANTE DOS CAMPOS (ORIGINAL) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Lote *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Processo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_surveyed">Não Vistoriado</SelectItem>
                          <SelectItem value="surveyed">Vistoriado</SelectItem>
                          <SelectItem value="in_analysis">Em Análise</SelectItem>
                          <SelectItem value="regularized">Regularizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (m²) *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fotos do Imóvel e Documentos</FormLabel>
                    <FormControl>
                      <PhotoCapture
                        initialPhotos={field.value || []}
                        onPhotosChange={(photos) => field.onChange(photos)}
                        propertyId={loteId || 'temp'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Dados do Lote'}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="survey">
          {loteId && (
            <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm mt-4">
              <SurveyForm propertyId={loteId} canEdit={true} />
            </div>
          )}
        </TabsContent>
      </Tabs>
          <div className="mt-8">
            <TesteGPS />
          </div>
    </div>
    
  )
}