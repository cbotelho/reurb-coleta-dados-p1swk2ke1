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
  
  // 🔒 PERMISSÕES CORRIGIDAS
  const userRole = user?.grupo_acesso?.toLowerCase() || '';
  const isAdmin = userRole.includes('admin');
  const isAssistenteSocial = userRole === 'assistente social';
  const isAdminOrAssistant = isAdmin || isAssistenteSocial;
  
  // Só bloquear edição se houver parecer conclusivo do assistente social
  // CORREÇÃO: Status válidos são 'finalizado' e 'aprovado' (não 'conclusivo')
  const hasConclusiveSocialReport = !!(socialReport && (
    socialReport.status === 'finalizado' || 
    socialReport.status === 'aprovado'
  ))
  
  // Permite edição se: admin/assistente social OU NÃO existe parecer conclusivo
  const canEditSurvey = canEdit && (isAdminOrAssistant || !hasConclusiveSocialReport)

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

  // ... resto do código permanece igual ...

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* ... resto do JSX ... */}

      {/* 📋 Aba 2: Vistoria */}
      <TabsContent value="vistoria">
        {currentLote && (
          <>
            {hasConclusiveSocialReport && !isAdminOrAssistant && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-300 rounded-lg">
                <p className="text-orange-800 font-semibold">
                  ⚠️ Edição Bloqueada
                </p>
                <p className="text-orange-700 text-sm mt-2">
                  Este lote já possui parecer conclusivo do assistente social. Apenas usuários do grupo "Administrador" ou "Assistente Social" podem realizar edições.
                </p>
              </div>
            )}
            {/* ✅ Agora canEditSurvey é boolean, não uma função */}
            <SurveyForm 
              propertyId={currentLote.local_id} 
              canEdit={canEditSurvey} // boolean correto
            />
          </>
        )}
      </TabsContent>

      {/* 📋 Aba 3: Parecer Conclusivo */}
      <TabsContent value="parecer">
        {currentLote ? (
          <div className="space-y-4">
            {/* ... resto do conteúdo ... */}
            
            {/* ✅ Agora isAdminOrAssistant é boolean */}
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

            {/* ✅ Agora a condição funciona corretamente */}
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
    </div>
  )
}