import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/services/api'
import { Survey } from '@/types'
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
import { Save, Loader2, CloudOff } from 'lucide-react'
import { useSync } from '@/contexts/SyncContext'

const surveySchema = z.object({
  form_number: z.string().optional(),
  survey_date: z.string().optional(),
  city: z.string().default('Macapá'),
  state: z.string().default('AP'),

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

  occupation_time: z.string().optional(),
  acquisition_mode: z.string().optional(),
  property_use: z.string().optional(),

  construction_type: z.string().optional(),
  roof_type: z.string().optional(),
  floor_type: z.string().optional(),
  rooms_count: z.coerce.number().min(0).default(0),
  conservation_state: z.string().optional(),
  fencing: z.string().optional(),

  water_supply: z.string().optional(),
  energy_supply: z.string().optional(),
  sanitation: z.string().optional(),
  street_paving: z.string().optional(),

  observations: z.string().optional(),
  surveyor_name: z.string().optional(),
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
    const loadSurvey = async () => {
      try {
        const data = await api.getSurveyByPropertyId(propertyId)
        if (data) {
          setSurveyId(data.id)
          form.reset({
            ...data,
            survey_date: data.survey_date?.split('T')[0], // ensure date format yyyy-mm-dd
          } as any)
        }
      } catch (e) {
        console.error('Error loading survey', e)
      } finally {
        setFetching(false)
      }
    }
    loadSurvey()
  }, [propertyId, form])

  const onSubmit = async (values: SurveyFormValues) => {
    if (!canEdit) return

    setLoading(true)
    try {
      const saved = await api.saveSurvey({
        id: surveyId,
        property_id: propertyId,
        ...values,
      })
      setSurveyId(saved.id)

      refreshStats() // Update pending counts if offline

      if (saved.sync_status === 'pending') {
        toast({
          title: 'Salvo Localmente',
          description:
            'Vistoria salva no dispositivo. Sincronize quando estiver online.',
          variant: 'default',
          className: 'bg-orange-50 border-orange-200 text-orange-800',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: 'Vistoria sincronizada com o servidor!',
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

  if (fetching) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <Form {...form}>
      {!isOnline && (
        <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-md flex items-center gap-2 text-sm text-orange-800">
          <CloudOff className="h-4 w-4" />
          <span>
            Modo Offline: As alterações serão salvas localmente e enviadas
            depois.
          </span>
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Identificação</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="form_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº Formulário</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!canEdit}
                      placeholder="Ex: 001/2025"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="survey_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Vistoria</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surveyor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável Técnico</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!canEdit}
                      placeholder="Nome do vistoriador"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Requerente */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Dados do Requerente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="applicant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applicant_cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!canEdit}
                      placeholder="000.000.000-00"
                    />
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
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <FormMessage />
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
              name="applicant_income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Renda Familiar</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!canEdit}
                      placeholder="Ex: 1 Salário Mínimo"
                    />
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="spouse_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cônjuge</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
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

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="residents_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº Moradores</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
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
              name="has_children"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canEdit}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Possui filhos menores?</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Ocupação e Imóvel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Ocupação e Imóvel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      placeholder="Ex: 5 anos"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="acquisition_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Aquisição</FormLabel>
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
                      <SelectItem value="Ocupacao">Ocupação/Invasão</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                      <SelectItem value="Servico Publico">
                        Serviço Público
                      </SelectItem>
                      <SelectItem value="Terreno Baldio">
                        Terreno Baldio
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="construction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Construção</FormLabel>
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
                      <SelectItem value="Taipa">Taipa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conservation_state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Conservação</FormLabel>
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
                      <SelectItem value="Bom">Bom</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Ruim">Ruim</SelectItem>
                      <SelectItem value="Precaria">Precária</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                    <Input
                      type="number"
                      min="0"
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

        {/* Infraestrutura */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            Infraestrutura
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="water_supply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abastecimento Água</FormLabel>
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
                      <SelectItem value="Rede Publica">Rede Pública</SelectItem>
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
                  <FormMessage />
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
                      <SelectItem value="Rede Publica">Rede Pública</SelectItem>
                      <SelectItem value="Gato">Ligação Clandestina</SelectItem>
                      <SelectItem value="Gerador">Gerador Próprio</SelectItem>
                      <SelectItem value="Nao Possui">Não Possui</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                      <SelectItem value="Rede Publica">Rede Pública</SelectItem>
                      <SelectItem value="Fossa Septica">
                        Fossa Séptica
                      </SelectItem>
                      <SelectItem value="Fossa Negra">Fossa Negra</SelectItem>
                      <SelectItem value="Ceu Aberto">Céu Aberto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                      <SelectItem value="Piçarra">Piçarra/Terra</SelectItem>
                      <SelectItem value="Nao Possui">Não Possui</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-4">
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
                    placeholder="Descreva observações adicionais..."
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {canEdit && (
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isOnline ? 'Salvar Vistoria' : 'Salvar Localmente (Offline)'}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
