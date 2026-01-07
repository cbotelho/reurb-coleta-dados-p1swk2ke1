import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { useSync } from '@/contexts/SyncContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

const surveySchema = z.object({
  // Geral
  form_number: z.string().optional(),
  survey_date: z.string().optional(),
  city: z.string().default('Macapá'),
  state: z.string().default('AP'),
  surveyor_name: z.string().optional(),

  // Location update fields
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  // Applicant
  applicant_name: z.string().min(1, 'Nome do requerente é obrigatório'),
  applicant_cpf: z.string().optional(),
  applicant_rg: z.string().optional(),
  applicant_civil_status: z.string().optional(),
  applicant_profession: z.string().optional(),
  applicant_income: z.string().optional(),
  applicant_nis: z.string().optional(),
  spouse_name: z.string().optional(),
  spouse_cpf: z.string().optional(),

  residents_count: z.coerce.number().min(0).default(0),
  has_children: z.boolean().default(false),

  // Occupation & Characteristics
  occupation_time: z.string().optional(),
  acquisition_mode: z.string().optional(),
  property_use: z.string().optional(),
  construction_type: z.string().optional(),
  roof_type: z.string().optional(),
  floor_type: z.string().optional(),
  rooms_count: z.coerce.number().min(0).default(0),
  conservation_state: z.string().optional(),
  fencing: z.string().optional(),

  // Infrastructure
  water_supply: z.string().optional(),
  energy_supply: z.string().optional(),
  sanitation: z.string().optional(),
  street_paving: z.string().optional(),

  observations: z.string().optional(),
})

type SurveyFormValues = z.infer<typeof surveySchema>

interface SurveyFormProps {
  propertyId: string
  canEdit: boolean
}

export function SurveyForm({ propertyId, canEdit }: SurveyFormProps) {
  const { toast } = useToast()
  const { isOnline, refreshStats } = useSync()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [surveyId, setSurveyId] = useState<string | undefined>()
  const [lote, setLote] = useState<Lote | null>(null)

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      city: 'Macapá',
      state: 'AP',
      residents_count: 0,
      rooms_count: 0,
      has_children: false,
    },
  })

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
        }

        if (surveyData) {
          setSurveyId(surveyData.id)
          form.reset({
            ...surveyData,
            survey_date: surveyData.survey_date?.split('T')[0],
            address: loteData?.address || '',
            latitude: loteData?.latitude || '',
            longitude: loteData?.longitude || '',
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
      const surveyData: any = { ...values }
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
            </TabsList>
          </ScrollArea>

          <TabsContent value="geral" className="space-y-4">
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
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!canEdit}
                        placeholder="Rua, Número, Bairro"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
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
                    <FormLabel>Data da Vistoria</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={!canEdit} />
                    </FormControl>
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
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
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
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4 grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="residents_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Moradores</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={!canEdit} />
                    </FormControl>
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
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Possui Crianças/Menores?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
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
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!canEdit}
                        placeholder="Ex: 10 anos"
                      />
                    </FormControl>
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
                        <SelectItem value="Ocupacao">Ocupação</SelectItem>
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
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!canEdit}
                        placeholder="Telha Barro/Brasilit"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piso</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!canEdit}
                        placeholder="Cerâmica/Cimento"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rooms_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Cômodos</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={!canEdit} />
                    </FormControl>
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
                    <FormLabel>Pavimentação</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Gerais</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={!canEdit}
                      placeholder="Observações adicionais..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
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
      </form>
    </Form>
  )
}
