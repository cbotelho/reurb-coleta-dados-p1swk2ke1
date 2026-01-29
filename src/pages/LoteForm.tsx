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
import {
  Save,
  X as XIcon,
  Trash2,
  Printer,
  Loader2,
  CloudOff,
  FileText,
  Image,
  AlertCircle,
} from 'lucide-react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'

// Atualize o schema para corresponder ao tipo Lote
const formSchema = z.object({
  name: z.string().min(1, 'Nome do lote é obrigatório'),
  address: z.string().optional(),
  area: z.string().min(1, 'Área é obrigatória'),
  description: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['not_surveyed', 'surveyed', 'regularized', 'pending', 'failed', 'synchronized']).optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function LoteForm() {
  const { loteId, quadraId } = useParams<{
    loteId?: string
    quadraId?: string
  }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isOnline, refreshStats } = useSync()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [parentQuadraId, setParentQuadraId] = useState<string | undefined>(quadraId)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentLote, setCurrentLote] = useState<Lote | undefined>()
  const { hasPermission } = useAuth()
  const [canEdit, setCanEdit] = useState(false)
  const [apiErrors, setApiErrors] = useState<string[]>([])

  // Verificar permissões assincronamente
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const allPermission = await hasPermission('all')
        const editPermission = await hasPermission('edit_projects')
        setCanEdit(allPermission || editPermission)
      } catch (error) {
        console.error('Erro ao verificar permissões:', error)
        setCanEdit(false)
      }
    }
    
    checkPermissions()
  }, [hasPermission])

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
      setApiErrors([])
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
            description: lote.description,
            latitude: lote.latitude || '',
            longitude: lote.longitude || '',
            images: lote.images || [],
            status: lote.status || 'not_surveyed',
          })
        } else {
          toast({
            title: 'Erro',
            description: 'Lote não encontrado',
            variant: 'destructive',
          })
          navigate(-1)
        }
      } catch (e: any) {
        console.error('Erro ao carregar lote:', e)
        
        // Adiciona erro específico para a lista
        const errorMessage = e.message || 'Erro desconhecido ao carregar lote'
        setApiErrors(prev => [...prev, errorMessage])
        
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados do lote',
          variant: 'destructive',
        })
        
        // Em modo de edição, se não conseguir carregar, volta
        if (loteId) {
          setTimeout(() => navigate(-1), 2000)
        }
      } finally {
        setFetching(false)
      }
    }

    if (loteId) loadLote(loteId)
  }, [loteId, form, navigate, toast])

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast({
        title: 'Permissão negada',
        description: 'Você não tem permissão para editar lotes',
        variant: 'destructive',
      })
      return
    }
    
    if (!parentQuadraId) {
      toast({
        title: 'Erro',
        description: 'ID da quadra não encontrado',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setApiErrors([])
    try {
      // Garantir que o status seja um dos valores válidos
      const validStatus = values.status as Lote['status']
      
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
        status: validStatus,
      })

      refreshStats()

      toast({
        title: saved.sync_status === 'pending' ? 'Salvo Localmente' : 'Sucesso',
        description: 'Lote atualizado com sucesso!',
        className: saved.sync_status === 'pending'
          ? 'bg-orange-50 border-orange-200 text-orange-800'
          : '',
      })

      // Se for novo lote, redireciona para a página do lote
      if (!isEditMode && saved.local_id) {
        navigate(`/lote/${saved.local_id}`)
      }
    } catch (error: any) {
      console.error('Erro ao salvar lote:', error)
      
      // Adiciona erro específico para a lista
      const errorMessage = error.message || 'Erro desconhecido ao salvar lote'
      setApiErrors(prev => [...prev, errorMessage])
      
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
        toast({ 
          title: 'Sucesso', 
          description: 'Lote removido com sucesso.' 
        })
        navigate(-1)
      } catch (e: any) {
        console.error('Erro ao deletar lote:', e)
        
        // Adiciona erro específico para a lista
        const errorMessage = e.message || 'Erro desconhecido ao deletar lote'
        setApiErrors(prev => [...prev, errorMessage])
        
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
      try {
        const quadra = await api.getQuadra(parentQuadraId)
        const project = quadra
          ? await api.getProject(quadra.parent_item_id)
          : undefined
        reportService.generateLoteReport(
          currentLote,
          quadra?.name || 'Desconhecida',
          project?.name || 'Desconhecido',
        )
      } catch (error: any) {
        console.error('Erro ao gerar relatório:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao gerar relatório',
          variant: 'destructive',
        })
      }
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
            description: 'Coordenadas atualizadas com sucesso.' 
          })
        },
        (error) => {
          let errorMessage = 'Erro ao obter localização'
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada pelo usuário'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informação de localização indisponível'
              break
            case error.TIMEOUT:
              errorMessage = 'Tempo esgotado ao obter localização'
              break
          }
          toast({ 
            title: 'Erro', 
            description: errorMessage, 
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
      <div className="flex flex-col justify-center items-center h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">Carregando dados do lote...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20 px-2 sm:px-0 max-w-3xl mx-auto">
      {/* Mostrar erros de API */}
      {apiErrors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Erros encontrados:</p>
              <ul className="list-disc list-inside text-sm">
                {apiErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-xl font-bold">
            {isEditMode ? form.getValues('name') : 'Novo Lote'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {currentLote?.area ? `${currentLote.area} m²` : 'Nova área'}
          </p>
          {!isOnline && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <CloudOff className="h-3 w-3" />
              Modo offline - dados salvos localmente
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePrint}
              title="Imprimir relatório"
            >
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
                  title="Excluir lote"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Lote?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. O lote e todos os dados associados serão permanentemente removidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir Permanentemente
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
            className="flex gap-2 items-center"
          >
            <FileText className="h-4 w-4" />
            <span>Vistoria</span>
          </TabsTrigger>
          <TabsTrigger value="lote" className="flex gap-2 items-center">
            <Image className="h-4 w-4" />
            <span>Dados & Fotos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lote">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 bg-white p-4 sm:p-6 rounded-lg border shadow-sm mt-4"
            >
              {/* BLOCO DE LOCALIZAÇÃO GPS DESTACADO */}
              <div className="bg-slate-50 p-4 rounded-lg border space-y-4 mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">
                      Localização GPS
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Coordenadas geográficas do lote
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeolocation}
                    disabled={!canEdit}
                    className="flex items-center gap-1 w-full sm:w-auto"
                  >
                    <svg 
                      className="w-3 h-3 text-blue-600" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M12 11.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M12 3v2.25m0 13.5V21m8.25-9H21m-17.25 0H3m15.364-6.364l-1.591 1.591m-9.192 9.192l-1.591 1.591m12.728 0l-1.591-1.591m-9.192-9.192L4.636 4.636"
                      />
                    </svg>
                    <span>Capturar Coordenadas</span>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    control={form.control} 
                    name="latitude" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!canEdit} 
                            placeholder="Ex: -0.036093"
                            className="bg-white"
                          />
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
                        <FormLabel>Longitude *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={!canEdit} 
                            placeholder="Ex: -51.069190"
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                </div>
                <p className="text-xs text-slate-500">
                  * As coordenadas são essenciais para o mapeamento e geolocalização do lote.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Lote *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={!canEdit} 
                          placeholder="Ex: Lote 001"
                        />
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
                        value={field.value}
                        disabled={!canEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_surveyed">
                            Não Vistoriado
                          </SelectItem>
                          <SelectItem value="surveyed">Vistoriado</SelectItem>
                          <SelectItem value="in_analysis">
                            Em Análise
                          </SelectItem>
                          <SelectItem value="regularized">
                            Regularizado
                          </SelectItem>
                          <SelectItem value="pending">
                            Pendente
                          </SelectItem>
                          <SelectItem value="failed">
                            Falhou
                          </SelectItem>
                          <SelectItem value="synchronized">
                            Sincronizado
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
                        <Input 
                          {...field} 
                          disabled={!canEdit} 
                          placeholder="Ex: 250.50"
                          type="number"
                          step="0.01"
                        />
                      </FormControl>
                      <FormMessage />
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
                        <Input 
                          {...field} 
                          disabled={!canEdit} 
                          placeholder="Ex: Rua das Flores, 123"
                        />
                      </FormControl>
                      <FormMessage />
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
                      <Textarea 
                        {...field} 
                        disabled={!canEdit} 
                        placeholder="Informações adicionais sobre o lote..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-2">
                      <FormLabel>Fotos do Imóvel e Documentos</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Adicione fotos do terreno, construções e documentos relacionados
                      </p>
                    </div>
                    <FormControl>
                      {canEdit ? (
                        <PhotoCapture
                          initialPhotos={field.value || []}
                          onPhotosChange={(photos) => field.onChange(photos)}
                          propertyId={loteId || 'temp'}
                        />
                      ) : (
                        <div className="space-y-4">
                          {field.value && field.value.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {field.value.map((photo, i) => (
                                <div key={i} className="relative aspect-square">
                                  <img
                                    src={photo}
                                    alt={`Foto ${i + 1}`}
                                    className="w-full h-full object-cover rounded-lg border"
                                    loading="lazy"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center rounded-b-lg">
                                    Foto {i + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                              <p className="text-muted-foreground">Nenhuma foto adicionada</p>
                            </div>
                          )}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canEdit && (
                <div className="pt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {isEditMode ? 'Atualizar Lote' : 'Criar Novo Lote'}
                      </>
                    )}
                  </Button>
                  {!isOnline && (
                    <p className="text-xs text-center text-amber-600 mt-2">
                      Dados serão salvos localmente e sincronizados quando houver conexão
                    </p>
                  )}
                </div>
              )}
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="survey">
          {loteId && (
            <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm mt-4">
              <SurveyForm propertyId={loteId} canEdit={canEdit} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}