import { useCallback, useEffect, useRef, useState } from 'react'
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
  declaracao_requerente: z.boolean().refine(val => val === true, 'É necessário concordar com a declaração'),
  assinatura_requerente: z.string().optional(),
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
  const [requerenteSignatureDialogOpen, setRequerenteSignatureDialogOpen] = useState(false)
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

  const saveSignatureFromCanvas = (type: 'surveyor' | 'requerente' = 'surveyor') => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const tmp = document.createElement('canvas')
    tmp.width = 300
    tmp.height = 150
    const tctx = tmp.getContext('2d')
    if (!tctx) return

    tctx.fillStyle = 'white'
    tctx.fillRect(0, 0, tmp.width, tmp.height)
    tctx.drawImage(canvas, 0, 0)

    const dataUrl = tmp.toDataURL('image/png')
    
    if (type === 'surveyor') {
      form.setValue('surveyor_signature', dataUrl, { shouldDirty: true })
      setSignatureDialogOpen(false)
    } else {
      form.setValue('assinatura_requerente', dataUrl, { shouldDirty: true })
      setRequerenteSignatureDialogOpen(false)
    }
  }

  const handleSignatureFile = (file: File, type: 'surveyor' | 'requerente' = 'surveyor') => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (type === 'surveyor') {
          form.setValue('surveyor_signature', reader.result, { shouldDirty: true })
        } else {
          form.setValue('assinatura_requerente', reader.result, { shouldDirty: true })
        }
      }
    }
    reader.readAsDataURL(file)
  }

// ... (rest of the code remains the same)

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

{/* Campo de Declaração do Requerente */}
<div className="mt-4 border rounded-lg p-4 bg-emerald-50">
  <FormField
    control={form.control}
    name="declaracao_requerente"
    render={({ field }) => (
      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
        <FormControl>
          <Checkbox
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={!canEdit}
          />
        </FormControl>
        <div className="space-y-1 leading-none">
          <FormLabel className="text-base">
            Declaro, para os devidos fins, que foi realizada a vistoria do lote urbano acima descrita nesta data. *
          </FormLabel>
          <FormMessage />
        </div>
      </FormItem>
    )}
  />

  <div className="mt-4">
    <FormLabel>Assinatura do Requerente</FormLabel>
    <FormField
      control={form.control}
      name="assinatura_requerente"
      render={({ field }) => (
        <FormItem>
          <div className="mt-2 flex flex-col space-y-2">
            {field.value ? (
              <div className="relative">
                <img 
                  src={field.value} 
                  alt="Assinatura do requerente" 
                  className="max-h-32 border rounded-md p-2 bg-white"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={() => field.onChange('')}
                  disabled={!canEdit}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRequerenteSignatureDialogOpen(true)}
                    disabled={!canEdit}
                  >
                    <PenLine className="h-4 w-4 mr-2" /> Assinar Digitalmente
                  </Button>
                  <label className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <span className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" /> Enviar Imagem
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleSignatureFile(file, 'requerente')
                        }}
                        disabled={!canEdit}
                      />
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
</div>

// ... (rest of the code remains the same)

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
  <DialogContent className="sm:max-w-[425px]">
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
      <Button type="button" onClick={() => saveSignatureFromCanvas('surveyor')}>
        Salvar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Modal de Assinatura do Requerente */}
<Dialog
  open={requerenteSignatureDialogOpen}
  onOpenChange={(open) => {
    setRequerenteSignatureDialogOpen(open)
    if (open) {
      requestAnimationFrame(() => {
        resizeSignatureCanvas()
        clearSignatureCanvas()
      })
    }
  }}
>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Assinatura do Requerente</DialogTitle>
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
      <Button type="button" onClick={() => saveSignatureFromCanvas('requerente')}>
        Salvar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </Form>
  )
}
