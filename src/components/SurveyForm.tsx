import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/services/api'
import { Survey, Lote } from '@/types'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  Save,
  Loader2,
  CloudOff,
  MapPin,
  User as UserIcon,
  Home,
  Zap,
  Printer,
  Trash2,
  PenLine,
  Upload,
} from 'lucide-react'
import { useSync } from '@/contexts/SyncContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { reportService } from '@/services/report'

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE',
  'TO',
]

const surveySchema = z.object({
  // Geral
  form_number: z.string().max(50, 'Máximo 50 caracteres').optional(),
  survey_date: z.string().min(1, 'Data da vistoria é obrigatória'),
  city: z.string().min(1, 'Cidade é obrigatória').max(100, 'Máximo 100 caracteres').default('Macapá'),
  state: z.string().length(2, 'UF deve ter 2 caracteres').default('AP'),
  surveyor_name: z.string().optional(),
  surveyor_signature: z.string().optional(),

  // Location update fields
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  // Applicant
  applicant_name: z.string().min(1, 'Nome do requerente é obrigatório').max(255, 'Máximo 255 caracteres'),
  applicant_cpf: z
    .string()
    .min(1, 'CPF é obrigatório')
    .refine((v) => /^\d{11}$/.test(v.replace(/\D/g, '')), 'CPF inválido'),
  applicant_rg: z.string().max(20, 'Máximo 20 caracteres').optional(),
  applicant_civil_status: z.string().optional(),
  applicant_profession: z.string().max(100, 'Máximo 100 caracteres').optional(),
  applicant_income: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true
      const normalized = v.replace(',', '.')
      const n = Number(normalized)
      return !Number.isNaN(n) && n >= 0 && n <= 999999.99
    }, 'Renda inválida'),
  applicant_nis: z.string().max(11, 'Máximo 11 caracteres').optional(),
  spouse_name: z.string().max(255, 'Máximo 255 caracteres').optional(),
  spouse_cpf: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true
      return /^\d{11}$/.test(v.replace(/\D/g, ''))
    }, 'CPF inválido'),

  residents_count: z.coerce
    .number()
    .int('Informe um número inteiro')
    .min(0, 'Número de moradores não pode ser negativo')
    .max(50, 'Máximo 50 moradores'),
  has_children: z.boolean(),

  // Occupation & Characteristics
  occupation_time: z.string().optional(),
  acquisition_mode: z.string().optional(),
  property_use: z.string().optional(),
  construction_type: z.string().optional(),
  roof_type: z.string().optional(),
  floor_type: z.string().optional(),
  rooms_count: z.coerce
    .number()
    .int('Informe um número inteiro')
    .min(0, 'Número de cômodos não pode ser negativo')
    .max(20, 'Máximo 20 cômodos'),
  conservation_state: z.string().optional(),
  fencing: z.string().optional(),

  // Infrastructure
  water_supply: z.string().optional(),
  energy_supply: z.string().optional(),
  sanitation: z.string().optional(),
  street_paving: z.string().optional(),

  observations: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
})

type SurveyFormValues = z.infer<typeof surveySchema>

interface SurveyFormProps {
  propertyId: string
  canEdit: boolean
}

export function SurveyForm({ propertyId, canEdit }: SurveyFormProps) {
  const { toast } = useToast()
  const { isOnline, refreshStats } = useSync()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [surveyId, setSurveyId] = useState<string | undefined>()
  const [lote, setLote] = useState<Lote | null>(null)
  const [quadraName, setQuadraName] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('')
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [isDrawingSignature, setIsDrawingSignature] = useState(false)
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const signatureLastPointRef = useRef<{ x: number; y: number } | null>(null)

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      form_number: '',
      city: 'Macapá',
      state: 'AP',
      survey_date: '',
      surveyor_name: '',
      surveyor_signature: '',

      address: '',
      latitude: '',
      longitude: '',

      applicant_name: '',
      applicant_cpf: '',
      applicant_rg: '',
      applicant_civil_status: '',
      applicant_profession: '',
      applicant_income: '',
      applicant_nis: '',
      spouse_name: '',
      spouse_cpf: '',

      residents_count: 0,
      rooms_count: 0,
      has_children: false,

      occupation_time: '',
      acquisition_mode: '',
      property_use: '',
      construction_type: '',
      roof_type: '',
      floor_type: '',
      conservation_state: '',
      fencing: '',
      water_supply: '',
      energy_supply: '',
      sanitation: '',
      street_paving: '',
      observations: '',
    },
  })

  const resizeSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1

    canvas.width = Math.max(1, Math.floor(rect.width * ratio))
    canvas.height = Math.max(1, Math.floor(rect.height * ratio))

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
  }

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const getCanvasPoint = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startSignatureDraw = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canEdit) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.setPointerCapture(e.pointerId)
    const p = getCanvasPoint(e)
    signatureLastPointRef.current = p
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    setIsDrawingSignature(true)
  }

  const moveSignatureDraw = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const p = getCanvasPoint(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    signatureLastPointRef.current = p
  }

  const endSignatureDraw = () => {
    setIsDrawingSignature(false)
    signatureLastPointRef.current = null
  }

  const saveSignatureFromCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const tmp = document.createElement('canvas')
    tmp.width = canvas.width
    tmp.height = canvas.height
    const tctx = tmp.getContext('2d')
    if (!tctx) return
    tctx.fillStyle = '#FFFFFF'
    tctx.fillRect(0, 0, tmp.width, tmp.height)
    tctx.drawImage(canvas, 0, 0)

    const dataUrl = tmp.toDataURL('image/png')
    form.setValue('surveyor_signature', dataUrl, { shouldDirty: true })
    setSignatureDialogOpen(false)
  }

  const handleSignatureFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        form.setValue('surveyor_signature', reader.result, { shouldDirty: true })
      }
    }
    reader.readAsDataURL(file)
  }

  const civilStatus = form.watch('applicant_civil_status')

  useEffect(() => {
    if (civilStatus === 'Solteiro') {
      form.setValue('spouse_name', '', { shouldValidate: false })
      form.setValue('spouse_cpf', '', { shouldValidate: false })
      form.clearErrors(['spouse_name', 'spouse_cpf'])
    }
  }, [civilStatus, form])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [surveyData, loteData] = await Promise.all([
          api.getSurveyByPropertyId(propertyId),
          api.getLote(propertyId),
        ])

        if (loteData) {
          setLote(loteData)
          form.setValue('address', loteData.address || '')
          form.setValue('latitude', loteData.latitude || '')
          form.setValue('longitude', loteData.longitude || '')

          const quadra = loteData.parent_item_id
            ? await api.getQuadra(loteData.parent_item_id)
            : null
          setQuadraName(quadra?.name || '')

          const project = quadra?.parent_item_id
            ? await api.getProject(quadra.parent_item_id)
            : null
          setProjectName(project?.name || '')
        }

        if (surveyData) {
          setSurveyId(surveyData.id)
          form.reset({
            form_number: (surveyData as any).form_number ?? '',
            survey_date: (surveyData as any).survey_date
              ? String((surveyData as any).survey_date).split('T')[0]
              : '',
            city: (surveyData as any).city ?? 'Macapá',
            state: (surveyData as any).state ?? 'AP',
            surveyor_name: (surveyData as any).surveyor_name ?? '',
            surveyor_signature: (surveyData as any).surveyor_signature ?? '',

            address: loteData?.address ?? '',
            latitude: loteData?.latitude ?? '',
            longitude: loteData?.longitude ?? '',

            applicant_name: (surveyData as any).applicant_name ?? '',
            applicant_cpf: (surveyData as any).applicant_cpf ?? '',
            applicant_rg: (surveyData as any).applicant_rg ?? '',
            applicant_civil_status: (surveyData as any).applicant_civil_status ?? '',
            applicant_profession: (surveyData as any).applicant_profession ?? '',
            applicant_income:
              (surveyData as any).applicant_income === null ||
              (surveyData as any).applicant_income === undefined
                ? ''
                : String((surveyData as any).applicant_income),
            applicant_nis: (surveyData as any).applicant_nis ?? '',
            spouse_name: (surveyData as any).spouse_name ?? '',
            spouse_cpf: (surveyData as any).spouse_cpf ?? '',

            residents_count:
              (surveyData as any).residents_count === null ||
              (surveyData as any).residents_count === undefined
                ? 0
                : Number((surveyData as any).residents_count),
            has_children: Boolean((surveyData as any).has_children),

            occupation_time: (surveyData as any).occupation_time ?? '',
            acquisition_mode: (surveyData as any).acquisition_mode ?? '',
            property_use: (surveyData as any).property_use ?? '',
            construction_type: (surveyData as any).construction_type ?? '',
            roof_type: (surveyData as any).roof_type ?? '',
            floor_type: (surveyData as any).floor_type ?? '',
            rooms_count:
              (surveyData as any).rooms_count === null ||
              (surveyData as any).rooms_count === undefined
                ? 0
                : Number((surveyData as any).rooms_count),
            conservation_state: (surveyData as any).conservation_state ?? '',
            fencing: (surveyData as any).fencing ?? '',

            water_supply: (surveyData as any).water_supply ?? '',
            energy_supply: (surveyData as any).energy_supply ?? '',
            sanitation: (surveyData as any).sanitation ?? '',
            street_paving: (surveyData as any).street_paving ?? '',

            observations: (surveyData as any).observations ?? '',
          } as any)
        }
      } catch (e) {
        console.error('Error loading data', e)
      } finally {
        setFetching(false)
      }
    }
    loadData()
  }, [propertyId, form])

  const handlePrintLote = async () => {
    if (!lote) return
    try {
      reportService.generateLoteReport(lote, quadraName || '', projectName || '')
    } catch {
      toast({
        title: 'Erro ao gerar relatório',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteLote = async () => {
    if (!lote || !canEdit) return
    try {
      await api.deleteLote(lote.local_id)
      toast({
        title: 'Lote excluído com sucesso!',
      })
      navigate(`/quadras/${lote.parent_item_id}`)
    } catch (error) {
      console.error('Error deleting lote:', error)
      toast({
        title: 'Erro ao excluir lote',
        variant: 'destructive',
      })
    }
  }

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude.toFixed(6))
          form.setValue('longitude', position.coords.longitude.toFixed(6))
          toast({
            title: 'Localização obtida',
            description: 'Coordenadas atualizadas.',
          })
        },
        (error) => {
          toast({
            title: 'Erro',
            description: 'Não foi possível obter a localização.',
            variant: 'destructive',
          })
        },
      )
    }
  }

  const onSubmit = async (values: SurveyFormValues) => {
    if (!canEdit) return

    setLoading(true)
    try {
      const surveyData: any = {
        ...values,
        applicant_cpf: values.applicant_cpf?.replace(/\D/g, ''),
        spouse_cpf: values.spouse_cpf?.replace(/\D/g, ''),
      }

      Object.keys(surveyData).forEach((k) => {
        if (surveyData[k] === '') delete surveyData[k]
      })

      delete surveyData.address
      delete surveyData.latitude
      delete surveyData.longitude

      const savedSurvey = await api.saveSurvey({
        id: surveyId,
        property_id: propertyId,
        ...surveyData,
      })
      setSurveyId(savedSurvey.id)

      if (lote) {
        await api.saveLote({
          ...lote,
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
          status: 'surveyed', // Auto update status to surveyed
          sync_status: isOnline ? 'synchronized' : 'pending',
          quadra_id: lote.parent_item_id,
        })
      }

      refreshStats()

      if (savedSurvey.sync_status === 'pending' || !isOnline) {
        toast({
          title: 'Salvo Localmente',
          description: 'Vistoria e atualizações do imóvel salvas na fila.',
          className: 'bg-orange-50 border-orange-200 text-orange-800',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: 'Dados sincronizados com o servidor!',
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Erro ao salvar vistoria.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )

  return (
    <Form {...form}>
      {!isOnline && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md flex items-center gap-2 text-sm text-orange-800">
          <CloudOff className="h-4 w-4" />
          <span>Modo Offline: Vistoria será salva na fila.</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="geral" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="w-full justify-start mb-4 bg-transparent p-0 gap-2">
              <TabsTrigger
                value="geral"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Geral
              </TabsTrigger>
              <TabsTrigger
                value="requerente"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Requerente
              </TabsTrigger>
              <TabsTrigger
                value="imovel"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Imóvel
              </TabsTrigger>
              <TabsTrigger
                value="infra"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Infraestrutura
              </TabsTrigger>
              <TabsTrigger
                value="observacoes"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                Observações
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="geral" className="space-y-4">
            <div className="rounded-lg border bg-emerald-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Projeto:</span>
                    <span className="font-medium">{projectName || '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Quadra:</span>
                    <span className="font-medium">{quadraName || '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Lote:</span>
                    <span className="font-medium">{lote?.name || '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Área do Lote:</span>
                    <span className="font-medium">{lote?.area || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrintLote}
                    disabled={!lote}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={!canEdit || !lote}
                      >
                        <Trash2 className="h-4 w-4" />
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
                        <AlertDialogAction onClick={handleDeleteLote} className="bg-red-600">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-sm">Localização GPS</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={!canEdit}
                >
                  <MapPin className="w-3 h-3 mr-2" /> Capturar
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} />
                      </FormControl>
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
                        <Input {...field} disabled={!canEdit} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="form_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Formulário</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="survey_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Vistoria *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Município *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UF_OPTIONS.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surveyor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vistoriador</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surveyor_signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assinatura do Vistoriador</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleSignatureFile(f)
                              }}
                              disabled={!canEdit}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!canEdit}
                            >
                              <Upload className="h-4 w-4 mr-2" /> Enviar
                            </Button>
                          </label>

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={!canEdit}
                            onClick={() => setSignatureDialogOpen(true)}
                          >
                            <PenLine className="h-4 w-4 mr-2" /> Assinar
                          </Button>

                          {field.value ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={!canEdit}
                              onClick={() => form.setValue('surveyor_signature', '', { shouldDirty: true })}
                            >
                              Limpar
                            </Button>
                          ) : null}
                        </div>

                        <div className="border rounded-md bg-white overflow-hidden">
                          {field.value ? (
                            <img
                              src={field.value}
                              alt="Assinatura do vistoriador"
                              className="w-full h-24 object-contain"
                            />
                          ) : (
                            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                              Nenhuma assinatura
                            </div>
                          )}
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="requerente" className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium">
              <UserIcon className="h-4 w-4" /> Dados do Titular
            </div>
            <FormField
              control={form.control}
              name="applicant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="applicant_cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicant_rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicant_profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissão</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicant_nis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIS</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicant_income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renda Familiar</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="applicant_civil_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!canEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="Casado">Casado(a)</SelectItem>
                      <SelectItem value="Divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="Viuvo">Viúvo(a)</SelectItem>
                      <SelectItem value="Uniao Estavel">
                        União Estável
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="residents_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Moradores *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="has_children"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        disabled={!canEdit}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Filhos menores de 18 anos? *</FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {civilStatus !== 'Solteiro' && (
              <div className="border-t pt-4 mt-4">
                <div className="font-medium mb-2">Cônjuge</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="spouse_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Cônjuge</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!canEdit} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="spouse_cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF do Cônjuge</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!canEdit} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="imovel" className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium">
              <Home className="h-4 w-4" /> Características
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="occupation_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de Ocupação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1 a 5 anos">De 1 à 5 anos</SelectItem>
                        <SelectItem value="5 a 10 anos">De 5 à 10 anos</SelectItem>
                        <SelectItem value="Acima de 10 anos">Acima de 10 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acquisition_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modo de Aquisição</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Compra">Compra</SelectItem>
                        <SelectItem value="Doacao">Doação</SelectItem>
                        <SelectItem value="Heranca">Herança</SelectItem>
                        <SelectItem value="Ocupacao">Ocupação mansa e pacífica</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="property_use"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uso do Imóvel</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Residencial">Residencial</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Misto">Misto</SelectItem>
                        <SelectItem value="Religioso">Religioso</SelectItem>
                        <SelectItem value="Terreno Baldio">
                          Terreno Baldio
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="construction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Construção</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Alvenaria">Alvenaria</SelectItem>
                        <SelectItem value="Madeira">Madeira</SelectItem>
                        <SelectItem value="Mista">Mista</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roof_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cobertura</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Telha de Amianto">Telha de Amianto</SelectItem>
                        <SelectItem value="Telha de Barro">Telha de Barro</SelectItem>
                        <SelectItem value="Telha de Alumínio">Telha de Alumínio</SelectItem>
                        <SelectItem value="Palha">Palha</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piso</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cerâmica">Cerâmica</SelectItem>
                        <SelectItem value="Granito">Granito</SelectItem>
                        <SelectItem value="Madeira">Madeira</SelectItem>
                        <SelectItem value="Cimento">Cimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rooms_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Cômodos *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="infra" className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium">
              <Zap className="h-4 w-4" /> Infraestrutura e Serviços
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="water_supply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abastecimento de Água</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Rede Publica">
                          Rede Pública
                        </SelectItem>
                        <SelectItem value="Poco Amazonas">
                          Poço Amazonas
                        </SelectItem>
                        <SelectItem value="Poco Artesiano">
                          Poço Artesiano
                        </SelectItem>
                        <SelectItem value="Caminhao Pipa">
                          Caminhão Pipa
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="energy_supply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energia Elétrica</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Rede Publica com Medidor">
                          Rede Pública (Com Medidor)
                        </SelectItem>
                        <SelectItem value="Rede Publica sem Medidor">
                          Rede Pública (Sem Medidor)
                        </SelectItem>
                        <SelectItem value="Gato">
                          Ligação Clandestina
                        </SelectItem>
                        <SelectItem value="Nao Possui">Não Possui</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sanitation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Esgotamento Sanitário</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fossa Septica">
                          Fossa Séptica
                        </SelectItem>
                        <SelectItem value="Fossa Negra">Fossa Negra</SelectItem>
                        <SelectItem value="Ceu Aberto">Céu Aberto</SelectItem>
                        <SelectItem value="Rede de Esgoto">
                          Rede de Esgoto
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="street_paving"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pavimentação da Rua</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Asfalto">Asfalto</SelectItem>
                        <SelectItem value="Bloquete">Bloquete</SelectItem>
                        <SelectItem value="Piçarra">Piçarra</SelectItem>
                        <SelectItem value="Terra">Terra</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fencing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Divisa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cerca">Cerca</SelectItem>
                        <SelectItem value="Muro">Muro</SelectItem>
                        <SelectItem value="Sem Divisa">Sem Divisa</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

          </TabsContent>

          <TabsContent value="observacoes" className="space-y-4">
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={!canEdit}
                      placeholder="Observações adicionais..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {canEdit && (
          <div className="flex justify-end pt-4 bg-white sticky bottom-0 border-t p-4 z-10">
            <Button
              type="submit"
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />{' '}
                  {isOnline ? 'Salvar Vistoria' : 'Salvar Localmente'}
                </>
              )}
            </Button>
          </div>
        )}

        <Dialog
          open={signatureDialogOpen}
          onOpenChange={(open) => {
            setSignatureDialogOpen(open)
            if (open) {
              requestAnimationFrame(() => {
                resizeSignatureCanvas()
                clearSignatureCanvas()
              })
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assinatura do Vistoriador</DialogTitle>
            </DialogHeader>

            <div className="border rounded-md bg-white">
              <canvas
                ref={signatureCanvasRef}
                className="w-full h-64 touch-none"
                onPointerDown={startSignatureDraw}
                onPointerMove={moveSignatureDraw}
                onPointerUp={endSignatureDraw}
                onPointerCancel={endSignatureDraw}
                onPointerLeave={endSignatureDraw}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={clearSignatureCanvas}>
                Limpar
              </Button>
              <Button type="button" onClick={saveSignatureFromCanvas}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  )
}
