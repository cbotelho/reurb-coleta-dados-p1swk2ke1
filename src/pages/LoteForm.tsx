import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/services/api'
import { reportService } from '@/services/report'
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
import { PhotoCapture } from '@/components/PhotoCapture'
import { useToast } from '@/hooks/use-toast'
import {
  Save,
  X as XIcon,
  Trash2,
  Printer,
  MapPin,
  Loader2,
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

const formSchema = z.object({
  name: z.string().min(1, 'Nome do lote é obrigatório'),
  area: z.string().min(1, 'Área é obrigatória'),
  description: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  images: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function LoteForm() {
  const { loteId, quadraId } = useParams<{
    loteId?: string
    quadraId?: string
  }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [parentQuadraId, setParentQuadraId] = useState<string | undefined>(
    quadraId,
  )
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentLote, setCurrentLote] = useState<Lote | undefined>()
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('all') || hasPermission('edit_projects')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      area: '',
      description: '',
      latitude: '',
      longitude: '',
      images: [],
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
            area: lote.area,
            description: lote.description,
            latitude: lote.latitude || '',
            longitude: lote.longitude || '',
            images: lote.images || [],
          })
        } else {
          toast({
            title: 'Erro',
            description: 'Lote não encontrado',
            variant: 'destructive',
          })
          navigate(-1)
        }
      } catch (e) {
        console.error(e)
        toast({
          title: 'Erro',
          description: 'Erro ao carregar lote',
          variant: 'destructive',
        })
      } finally {
        setFetching(false)
      }
    }

    if (loteId) {
      loadLote(loteId)
    }
  }, [loteId, form, navigate, toast])

  const onSubmit = async (values: FormValues) => {
    if (!canEdit) {
      toast({
        title: 'Sem permissão',
        description: 'Você não tem permissão para editar lotes.',
        variant: 'destructive',
      })
      return
    }

    if (!parentQuadraId) {
      toast({
        title: 'Erro',
        description: 'Quadra pai não identificada',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      await api.saveLote({
        local_id: isEditMode ? loteId : undefined,
        quadra_id: parentQuadraId,
        name: values.name,
        area: values.area,
        description: values.description || '',
        latitude: values.latitude,
        longitude: values.longitude,
        images: values.images || [],
      })

      toast({ title: 'Sucesso', description: 'Lote salvo com sucesso!' })
      navigate(-1)
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
      // Need fetching extra data for report
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
    } else {
      toast({
        title: 'Erro',
        description: 'Geolocalização não suportada.',
        variant: 'destructive',
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
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isEditMode ? 'Detalhes do Lote' : 'Novo Lote'}
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrint}
              title="Imprimir Ficha"
            >
              <Printer className="h-5 w-5" />
            </Button>
          )}
          {isEditMode && canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Lote?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O lote e suas fotos serão
                    removidos permanentemente do banco de dados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 bg-white p-6 rounded-lg border shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificação do Lote *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Lote 12"
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
                      placeholder="Ex: 250.00"
                      type="text"
                      inputMode="decimal"
                      {...field}
                      disabled={!canEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">
                Geolocalização
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={!canEdit}
              >
                <MapPin className="w-3 h-3 mr-2" /> Obter Atual
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
                      <Input
                        placeholder="0.000000"
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
                        placeholder="-00.000000"
                        {...field}
                        disabled={!canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Memorial Descritivo</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva as características do lote..."
                    className="min-h-[100px]"
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
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documentos / Fotos</FormLabel>
                <FormControl>
                  {canEdit ? (
                    <PhotoCapture
                      initialPhotos={field.value || []}
                      onPhotosChange={(photos) => field.onChange(photos)}
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {field.value?.map((photo, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden border"
                        >
                          <img
                            src={photo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {(!field.value || field.value.length === 0) && (
                        <p className="text-sm text-muted-foreground">
                          Sem fotos.
                        </p>
                      )}
                    </div>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {canEdit && (
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                <XIcon className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Salvar
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
