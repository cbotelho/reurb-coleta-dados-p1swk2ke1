import { NuclearGPSTest } from '@/components/NuclearGPSTest'
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

  // SUBSTITUA TODO O RETURN DO LoteForm POR ISTO:
  if (fetching) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div style={{padding: '40px', maxWidth: '800px', margin: '0 auto'}}>
      <h1 style={{color: 'blue', fontSize: '36px', marginBottom: '30px', textAlign: 'center'}}>
        🚨 DIAGNÓSTICO DO LoteForm
      </h1>
      
      {/* Seção 1: Info do lote */}
      <div style={{border: '3px solid #ccc', padding: '20px', marginBottom: '30px', borderRadius: '10px'}}>
        <h2 style={{color: '#333', marginBottom: '10px'}}>📋 Informações do Lote</h2>
        <p><strong>ID:</strong> {loteId}</p>
        <p><strong>Modo:</strong> {isEditMode ? 'Edição' : 'Novo'}</p>
        <p><strong>Quadra:</strong> {parentQuadraId}</p>
      </div>
      
      {/* Seção 2: Teste Nuclear */}
      <NuclearGPSTest />
      
      {/* Seção 3: Teste de botões simples */}
      <div style={{border: '3px solid purple', padding: '20px', marginTop: '30px', borderRadius: '10px'}}>
        <h2 style={{color: 'purple', marginBottom: '15px'}}>🧪 Teste de Botões Simples</h2>
        
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px'}}>
          {/* Botão 1 - React */}
          <button
            onClick={() => alert('React funciona!')}
            style={{padding: '12px 24px', background: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
          >
            Botão React
          </button>
          
          {/* Botão 2 - Teste GPS direto */}
          <button
            onClick={handleGeolocation}
            style={{padding: '12px 24px', background: 'blue', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
          >
            Teste GPS Função
          </button>
          
          {/* Botão 3 - Teste Console */}
          <button
            onClick={() => {
              console.log('✅ Botão funciona no console')
              alert('Console log funcionando!')
            }}
            style={{padding: '12px 24px', background: 'orange', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
          >
            Teste Console
          </button>
        </div>
        
        {/* Campos de teste */}
        <div style={{marginTop: '20px'}}>
          <h3 style={{marginBottom: '10px'}}>Campos de Teste:</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '5px'}}>Latitude</label>
              <input
                value={form.getValues('latitude') || ''}
                onChange={(e) => form.setValue('latitude', e.target.value)}
                placeholder="-0.036161"
                style={{width: '100%', padding: '10px', border: '2px solid #ccc', borderRadius: '5px'}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px'}}>Longitude</label>
              <input
                value={form.getValues('longitude') || ''}
                onChange={(e) => form.setValue('longitude', e.target.value)}
                placeholder="-51.130895"
                style={{width: '100%', padding: '10px', border: '2px solid #ccc', borderRadius: '5px'}}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Seção 4: Teste direto no console */}
      <div style={{border: '3px solid #17a2b8', padding: '20px', marginTop: '30px', borderRadius: '10px'}}>
        <h3 style={{color: '#17a2b8', marginBottom: '10px'}}>🛠️ Teste Direto no Console</h3>
        <button
          onClick={() => {
            // Teste GPS direto no console
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                pos => console.log('✅ GPS DIRETO:', pos.coords),
                err => console.log('❌ ERRO GPS:', err)
              )
            }
          }}
          style={{padding: '10px 20px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
        >
          Testar GPS no Console (F12)
        </button>
      </div>
      
      {/* Seção 5: Voltar ao normal */}
      <div style={{marginTop: '40px', textAlign: 'center'}}>
        <button
          onClick={() => window.location.reload()}
          style={{padding: '15px 30px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer'}}
        >
          🔄 Recarregar Página
        </button>
        <p style={{marginTop: '10px', color: '#666'}}>
          Depois dos testes, volte ao código original
        </p>
      </div>
    </div>
  )
}