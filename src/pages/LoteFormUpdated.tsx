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
import { SocialReportForm } from '@/components/SocialReportForm'
import { useSync } from '@/contexts/SyncContext'
import { reportService } from '@/services/report'
import { socialReportService } from '@/services/socialReportService'
import type { SocialReport } from '@/types'
import type { SocialReport } from '@/types'

// 🎯 Schema completo baseado no mapeamento do banco
const loteFormSchema = z.object({
  // Campos do banco
  id: z.string().optional(), // Hidden em edição
  name: z.string().min(1, 'Nome do lote é obrigatório').max(255, 'Máximo 255 caracteres'),
  address: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  area: z
    .string()
    .min(1, 'Área é obrigatória')
    .refine((value) => {
      const normalized = value.replace(',', '.')
      const n = Number(normalized)
      return !Number.isNaN(n) && n >= 0
    }, 'Área deve ser um número maior ou igual a 0'),
  description: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  images: z.array(z.string()).max(10, 'Máximo 10 fotos').optional(),
  latitude: z.string()
    .regex(/^-?\d{1,3}\.\d{1,8}$/, 'Latitude inválida. Ex: -0.036161')
    .optional(),
  longitude: z.string()
    .regex(/^-?\d{1,4}\.\d{1,8}$/, 'Longitude inválida. Ex: -51.130895')
    .optional(),
  quadra_id: z.string().min(1, 'Quadra é obrigatória'),
  status: z.enum(['not_surveyed', 'surveyed', 'regularized', 'pending', 'failed', 'synchronized']).optional(),
  
  // Campos de auditoria (readonly)
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  sync_status: z.enum(['pending', 'synchronized', 'failed']).optional(),
})

type LoteFormValues = z.infer<typeof loteFormSchema>

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
  const [surveyData, setSurveyData] = useState<any>(null)
  const [socialReport, setSocialReport] = useState<SocialReport | null>(null)
  const [projectId, setProjectId] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('')
  const [quadraName, setQuadraName] = useState<string>('')
  const [isReportFormOpen, setIsReportFormOpen] = useState(false)
  const { hasPermission, user } = useAuth()
  const canEdit = hasPermission('all') || hasPermission('edit_projects')
  const isAdminOrAssistant = user?.grupo_acesso === 'Administrador' || user?.grupo_acesso === 'Administradores' || user?.grupo_acesso === 'Assistente Social'
  
  // Se tem análise IA e usuário não é admin/assistente social, desabilita edição
  const canEditSurvey = canEdit && (isAdminOrAssistant || !surveyData?.analise_ia_classificacao)

  const form = useForm<LoteFormValues>({
    resolver: zodResolver(loteFormSchema),
    defaultValues: {
      name: '',
      address: '',
      area: '',
      description: '',
      images: [],
      latitude: '',
      longitude: '',
      quadra_id: quadraId || '',
      status: 'not_surveyed',
      sync_status: 'pending',
    },
  })

  // Carregar ID do projeto e Nomes (Projeto/Quadra) quando houver quadra selecionada
  useEffect(() => {
    const fetchProjectAndNames = async () => {
      if (parentQuadraId) {
        try {
          // 1. Buscar Quadra
          const quadra: any = await api.getQuadra(parentQuadraId)
          if (quadra) {
            setQuadraName(quadra.name || '')
            
            // 2. Identificar ID do Projeto (parent_item_id ou project_id)
            // A interface Quadra em types/index.ts usa parent_item_id para o ID do projeto
            const pId = quadra.parent_item_id || quadra.project_id
            
            if (pId) {
              setProjectId(pId)
              
              // 3. Buscar Projeto
              const project = await api.getProject(pId)
              if (project) {
                setProjectName(project.name || '')
              }
            }
          }
        } catch (err) {
          console.error('Erro ao buscar projeto/quadra:', err)
        }
      }
    }
    fetchProjectAndNames()
  }, [parentQuadraId])

  // 🔄 Carregar dados em modo de edição
  useEffect(() => {
    if (loteId) {
      setIsEditMode(true)
      loadLoteData(loteId)
    }
  }, [loteId])

  const loadLoteData = async (id: string) => {
    setFetching(true)
    try {
      const lote = await api.getLote(id)
      setCurrentLote(lote)
      
      // Carregar survey para verificar se tem análise IA
      const survey = await api.getSurveyByPropertyId(id)
      setSurveyData(survey)
      
      // Carregar parecer social
      loadSocialReport(id)
      
      // Pre-fill com dados existentes
      form.reset({
        id: lote.local_id,
        name: lote.name || '',
        address: lote.address || '',
        area: lote.area || '',
        description: lote.description || '',
        images: lote.images || [],
        latitude: lote.latitude || '',
        longitude: lote.longitude || '',
        quadra_id: lote.parent_item_id || '',
        status: lote.status || 'not_surveyed',
        sync_status: lote.sync_status || 'pending',
        created_at: lote.date_added ? new Date(lote.date_added).toISOString() : '',
        updated_at: lote.date_updated ? new Date(lote.date_updated).toISOString() : '',
      })
      
      setParentQuadraId(lote.parent_item_id)
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados do lote',
        variant: 'destructive'
      })
      console.error('Error loading lote:', error)
    } finally {
      setFetching(false)
    }
  }

  // Carregar parecer social do lote
  const loadSocialReport = async (propertyId: string) => {
    try {
      const report = await socialReportService.getByPropertyId(propertyId)
      setSocialReport(report)
    } catch (error) {
      console.error('Erro ao carregar parecer social:', error)
    }
  }

  // 💾 Salvar formulário
  const onSubmit = async (values: LoteFormValues) => {
    if (!canEdit) {
      toast({
        title: 'Você não tem permissão para editar lotes',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const payload: Partial<Lote> & { quadra_id: string } = {
        name: values.name,
        address: values.address,
        area: values.area,
        description: values.description || '',
        images: values.images || [],
        latitude: values.latitude || undefined,
        longitude: values.longitude || undefined,
        quadra_id: values.quadra_id,
        status: values.status || 'not_surveyed',
        ...(isEditMode && loteId ? { local_id: loteId } : {}),
      }

      const savedLote = await api.saveLote(payload)

      toast({
        title: isEditMode ? 'Lote atualizado com sucesso!' : 'Lote criado com sucesso!',
      })

      if (!isEditMode && savedLote?.local_id) {
        navigate(`/lotes/${savedLote.local_id}`)
      }

      // Atualizar estatísticas
      refreshStats?.()
      
    } catch (error) {
      console.error('Error saving lote:', error)
      toast({
        title: isEditMode ? 'Erro ao atualizar lote' : 'Erro ao criar lote',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 🗑️ Excluir lote
  const handleDelete = async () => {
    if (!loteId || !canEdit) return
    
    try {
      await api.deleteLote(loteId)
      toast({
        title: 'Lote excluído com sucesso!',
      })
      navigate(`/quadras/${parentQuadraId}`)
    } catch (error) {
      console.error('Error deleting lote:', error)
      toast({
        title: 'Erro ao excluir lote',
        variant: 'destructive'
      })
    }
  }

  // 🖨️ Gerar relatório
  const handlePrint = async () => {
    if (!currentLote) return
    
    try {
      await reportService.generateLoteReport(currentLote, parentQuadraId || '', '')
    } catch (error) {
      toast({
        title: 'Erro ao gerar relatório',
        variant: 'destructive'
      })
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 📄 Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <XIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? 'Editar Lote' : 'Novo Lote'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Atualize os dados do lote' : 'Preencha os dados do novo lote'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditMode && currentLote && (
            <>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              {canEdit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
          
          {!isOnline && (
            <div className="flex items-center text-amber-600 text-sm">
              <CloudOff className="h-4 w-4 mr-1" />
              Offline
            </div>
          )}
        </div>
      </div>

      {/* 📋 Abas do Formulário */}
      <Tabs defaultValue="dados-gerais" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
          <TabsTrigger value="vistoria">Vistoria</TabsTrigger>
          <TabsTrigger value="parecer">Parecer Conclusivo</TabsTrigger>
        </TabsList>

        {/* 📄 Aba 1: Dados Gerais */}
        <TabsContent value="dados-gerais">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 🆔 Campo ID (hidden em edição) */}
              {isEditMode && (
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* 📊 Campos Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Lote *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Lote 01" 
                          {...field}
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (m²) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="Ex: 250.50" 
                          {...field}
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quadra_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quadra *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                        disabled={!canEdit || !!quadraId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a quadra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Carregar quadras dinamicamente */}
                          {(quadraId || field.value) ? (
                            <SelectItem value={quadraId || field.value}>
                              Quadra Atual
                            </SelectItem>
                          ) : (
                            <SelectItem value="aguardando_selecao" disabled>
                              Carregando quadra...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!canEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_surveyed">Não Vistoriado</SelectItem>
                          <SelectItem value="surveyed">Vistoriado</SelectItem>
                          <SelectItem value="regularized">Regularizado</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="failed">Falhou</SelectItem>
                          <SelectItem value="synchronized">Sincronizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 📍 Endereço */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Endereço completo do lote"
                        className="min-h-[80px]"
                        {...field}
                        disabled={!canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 📝 Descrição */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do lote"
                        className="min-h-[100px]"
                        {...field}
                        disabled={!canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 📍 Coordenadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: -0.036161"
                          {...field}
                          disabled={!canEdit}
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
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: -51.130895"
                          {...field}
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 📸 Fotos */}
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fotos do Lote</FormLabel>
                    <FormControl>
                      <PhotoCapture
                        initialPhotos={field.value || []}
                        onPhotosChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 🔄 Campos de Auditoria (readonly) */}
              {isEditMode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="sync_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status de Sincronização</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-white" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="created_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Criado em</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled 
                            className="bg-white"
                            value={field.value ? new Date(field.value).toLocaleString() : ''}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="updated_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atualizado em</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled 
                            className="bg-white"
                            value={field.value ? new Date(field.value).toLocaleString() : ''}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* 💾 Botões de Ação */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                
                {canEdit && (
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEditMode ? 'Atualizar' : 'Criar'} Lote
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* 📋 Aba 2: Vistoria */}
        <TabsContent value="vistoria">
          {currentLote && (
            <>
              {surveyData?.analise_ia_classificacao && !isAdminOrAssistant && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-300 rounded-lg">
                  <p className="text-orange-800 font-semibold">
                    ⚠️ Vistoria Bloqueada para Edição
                  </p>
                  <p className="text-orange-700 text-sm mt-2">
                    Esta vistoria já foi analisada pelo sistema de IA. Apenas usuários do grupo "Administrador" ou "Assistente Social" podem realizar edições.
                  </p>
                </div>
              )}
              <SurveyForm 
                propertyId={currentLote.local_id} 
                canEdit={canEditSurvey}
              />
            </>
          )}
        </TabsContent>

        {/* 📋 Aba 3: Parecer Conclusivo */}
        <TabsContent value="parecer">
          {currentLote ? (
            <div className="space-y-4">
              {/* Informações do lote */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Informações do Lote</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Lote:</span> {currentLote.name}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Área:</span> {currentLote.area} m²
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Status:</span>{' '}
                    <span className="capitalize">{currentLote.status?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Status do parecer */}
              {socialReport ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-green-900">✓ Parecer Existente</h3>
                      <p className="text-sm text-green-700 mt-1">
                        <strong>Registro:</strong> {socialReport.numero_registro || 'N/A'} •{' '}
                        <strong>Status:</strong>{' '}
                        <span className="capitalize">{socialReport.status}</span> •{' '}
                        <strong>Assistente Social:</strong> {socialReport.nome_assistente_social}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Última atualização: {new Date(socialReport.updated_at || '').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {isAdminOrAssistant && (
                      <Button
                        onClick={() => setIsReportFormOpen(true)}
                        variant="outline"
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Editar Parecer
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-amber-900">⚠ Nenhum Parecer Cadastrado</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Este lote ainda não possui parecer conclusivo do assistente social.
                      </p>
                    </div>
                    {isAdminOrAssistant && (
                      <Button
                        onClick={() => setIsReportFormOpen(true)}
                        variant="default"
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Criar Parecer
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Visualização do parecer existente */}
              {socialReport && (
                <div className="p-6 bg-white border rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Conteúdo do Parecer</h3>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: socialReport.parecer }}
                  />
                  
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {socialReport.cress_assistente_social && (
                        <div>
                          <span className="font-medium">CRESS:</span> {socialReport.cress_assistente_social}
                        </div>
                      )}
                      {socialReport.email_assistente_social && (
                        <div>
                          <span className="font-medium">E-mail:</span> {socialReport.email_assistente_social}
                        </div>
                      )}
                      {socialReport.assinatura_eletronica && (
                        <div className="col-span-2">
                          <span className="font-medium">Assinatura Eletrônica:</span>{' '}
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {socialReport.assinatura_eletronica}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isAdminOrAssistant && !socialReport && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Apenas Administradores e Assistentes Sociais podem criar pareceres.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Carregue um lote para visualizar/criar o parecer conclusivo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Parecer */}
      {currentLote && isReportFormOpen && (
        <SocialReportForm
          open={isReportFormOpen}
          onClose={() => setIsReportFormOpen(false)}
          propertyId={currentLote.local_id}
          quadraId={parentQuadraId || ''}
          projectId={projectId}
          existingReport={socialReport}
          onSuccess={() => {
            if (currentLote?.local_id) {
              loadSocialReport(currentLote.local_id)
            }
          }}
          propertyName={currentLote.name}
          quadraName={quadraName}
          projectName={projectName}
        />
      )}
    </div>
  )
}
