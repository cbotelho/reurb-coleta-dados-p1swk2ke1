import { useState, useEffect } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

const formSchema = z.object({
  name: z.string().min(1, 'Nome do lote é obrigatório'),
  address: z.string().optional(),
  area: z.string().optional(),
  description: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  status: z.enum(['not_surveyed', 'surveyed', 'regularized', 'pending', 'failed', 'synchronized']),
})

type FormValues = z.infer<typeof formSchema>

const statusOptions = [
  { value: 'not_surveyed', label: 'Não Vistoriado' },
  { value: 'surveyed', label: 'Vistoriado' },
  { value: 'regularized', label: 'Regularizado' },
  { value: 'pending', label: 'Pendente' },
  { value: 'failed', label: 'Falhou' },
  { value: 'synchronized', label: 'Sincronizado' },
]

export default function LoteEdit() {
  const { loteId } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [lote, setLote] = useState<Lote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const canEditProjects = hasPermission('all') || hasPermission('edit_projects')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      area: '',
      description: '',
      latitude: '',
      longitude: '',
      status: 'not_surveyed',
    },
  })

  useEffect(() => {
    if (loteId) {
      loadLote()
    }
  }, [loteId])

  const loadLote = async () => {
    try {
      const data = await api.getLote(loteId)
      if (data) {
        setLote(data)
        form.reset({
          name: data.name,
          address: data.address || '',
          area: data.area || '',
          description: data.description || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          status: data.status || 'not_surveyed',
        })
      }
    } catch (error) {
      console.error('Error loading lote:', error)
      toast.error('Erro ao carregar lote.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!loteId || !canEditProjects) return

    setSaving(true)
    try {
      await api.updateLote(loteId, {
        name: values.name,
        address: values.address,
        area: values.area,
        description: values.description,
        latitude: values.latitude,
        longitude: values.longitude,
        status: values.status,
      })
      toast.success('Lote atualizado com sucesso!')
      navigate(`/lotes/${loteId}`)
    } catch (error) {
      console.error('Error saving lote:', error)
      toast.error('Erro ao salvar lote.')
    } finally {
      setSaving(false)
    }
  }

  if (!canEditProjects) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-500">
            Você não tem permissão para editar lotes.
          </p>
          <Button asChild className="mt-4">
            <Link to="/projetos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Projetos
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <Link to="/projetos">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Lote</h1>
          <p className="text-muted-foreground">
            {lote?.name || 'Carregando...'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Lote</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Lote *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do lote" {...field} />
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
                        <Input placeholder="Endereço do lote" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área</FormLabel>
                      <FormControl>
                        <Input placeholder="Área do lote" {...field} />
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        placeholder="Descrição do lote" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input placeholder="Latitude" {...field} />
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
                        <Input placeholder="Longitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link to="/projetos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Lote
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
