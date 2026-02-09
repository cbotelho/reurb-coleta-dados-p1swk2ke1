import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/services/api'
import { analiseIAService } from '@/services/analiseIA'
import { db } from '@/services/db'
import { Lote } from '@/types'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2, CloudOff } from 'lucide-react'
import { useSync } from '@/contexts/SyncContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SignaturePad } from '@/components/SignaturePad'
import { reportService } from '@/services/report'

// Sub-components
import { surveySchema, SurveyFormValues } from './survey/schema'
import { SurveyGeneralTab } from './survey/SurveyGeneralTab'
import { SurveyApplicantTab } from './survey/SurveyApplicantTab'
import { SurveyPropertyTab } from './survey/SurveyPropertyTab'
import { SurveyInfraTab } from './survey/SurveyInfraTab'
import { SurveyDocsTab } from './survey/SurveyDocsTab'
import { SurveyObservationsTab } from './survey/SurveyObservationsTab'

interface SurveyFormProps {
  propertyId: string 
  canEdit: boolean
}

export function SurveyForm({ propertyId, canEdit }: SurveyFormProps) {
  // Validação defensiva para propertyId
  if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
    return (
      <div className="p-8 text-center text-red-700 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Erro crítico: ID do imóvel não informado</h2>
        <p>Não foi possível carregar o formulário de vistoria porque o <b>ID do imóvel (property_id)</b> está ausente ou inválido.<br />
        Volte e selecione um lote válido antes de iniciar uma nova vistoria.</p>
      </div>
    );
  }
  const [generatingIA, setGeneratingIA] = useState(false)
  const { toast } = useToast()
  const { isOnline, refreshStats } = useSync()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [surveyId, setSurveyId] = useState<string | undefined>()
  const [lote, setLote] = useState<Lote | null>(null)
  const [quadraName, setQuadraName] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('')

  // Tab state control
  const [activeTab, setActiveTab] = useState('geral')

  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [requerenteSignatureDialogOpen, setRequerenteSignatureDialogOpen] = useState(false)

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema) as any,
    defaultValues: {
      form_number: '',
      city: 'Macapá',
      state: 'AP',
      survey_date: '',
      surveyor_name: '',
      surveyor_signature: '',
      assinatura_requerente: '',

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
      declaracao_requerente: false,

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
      documents: [],
      analise_ia_classificacao: '',
      analise_ia_parecer: '',
      analise_ia_proximo_passo: '',
      analise_ia_gerada_em: '',
    },
  })

  // Funções de assinatura usando SignaturePad
  const handleSaveVistoriadorSignature = (dataUrl: string) => {
    form.setValue('surveyor_signature', dataUrl, { shouldDirty: true })
    setSignatureDialogOpen(false)
  }

  const handleSaveRequerenteSignature = (dataUrl: string) => {
    form.setValue('assinatura_requerente', dataUrl, { shouldDirty: true })
    setRequerenteSignatureDialogOpen(false)
  }
  
  // Adicionada função vazia para satisfazer a prop obrigatória
  const resizeRequerenteCanvas = () => {
    // Função vazia - não é mais necessária, mas mantida para compatibilidade
    console.log('resizeRequerenteCanvas chamada (função de compatibilidade)')
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

  const handleRequerenteSignatureFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        form.setValue('assinatura_requerente', reader.result, { shouldDirty: true })
        setRequerenteSignatureDialogOpen(false)
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
        console.log('📥 Carregando dados do lote:', propertyId)
        
        const [surveyData, loteData] = await Promise.all([
          api.getSurveyByPropertyId(propertyId),
          api.getLote(propertyId),
        ])

        console.log('📊 Dados carregados:', { 
          surveyData: surveyData ? {
            id: surveyData.id,
            applicant_name: (surveyData as any).applicant_name,
            survey_date: (surveyData as any).survey_date,
            form_number: (surveyData as any).form_number,
          } : null,
          loteData: loteData ? {
            id: loteData.local_id,
            name: loteData.name,
            address: loteData.address,
            latitude: loteData.latitude,
            longitude: loteData.longitude,
            sync_status: loteData.sync_status,
            parent_item_id: loteData.parent_item_id,
          } : null
        })

        if (loteData) {
          setLote(loteData)

          const quadra = loteData.parent_item_id
            ? await api.getQuadra(loteData.parent_item_id)
            : null
          setQuadraName(quadra?.name || '')

          const project = quadra?.parent_item_id
            ? await api.getProject(quadra.parent_item_id)
            : null
          setProjectName(project?.name || '')
        } else {
          console.warn('⚠️ Nenhum lote encontrado para ID:', propertyId)
        }

        if (surveyData && typeof surveyData === 'object') {
          setSurveyId(surveyData.id)
          // Só faz reset se realmente veio dado preenchido
          const resetObj: any = {}
          if ('form_number' in surveyData) resetObj.form_number = surveyData.form_number ?? ''
          if ('survey_date' in surveyData) resetObj.survey_date = surveyData.survey_date ? String(surveyData.survey_date).split('T')[0] : ''
          if ('city' in surveyData) resetObj.city = surveyData.city ?? 'Macapá'
          if ('state' in surveyData) resetObj.state = surveyData.state ?? 'AP'
          if ('surveyor_name' in surveyData) resetObj.surveyor_name = surveyData.surveyor_name ?? ''
          if ('surveyor_signature' in surveyData) resetObj.surveyor_signature = surveyData.surveyor_signature ?? ''
          if ('applicant_name' in surveyData) resetObj.applicant_name = surveyData.applicant_name ?? ''
          if ('applicant_cpf' in surveyData) resetObj.applicant_cpf = surveyData.applicant_cpf ?? ''
          if ('applicant_rg' in surveyData) resetObj.applicant_rg = surveyData.applicant_rg ?? ''
          if ('applicant_civil_status' in surveyData) resetObj.applicant_civil_status = surveyData.applicant_civil_status ?? ''
          if ('applicant_profession' in surveyData) resetObj.applicant_profession = surveyData.applicant_profession ?? ''
          if ('applicant_income' in surveyData) resetObj.applicant_income = (surveyData.applicant_income === null || surveyData.applicant_income === undefined) ? '' : String(surveyData.applicant_income)
          if ('applicant_nis' in surveyData) resetObj.applicant_nis = surveyData.applicant_nis ?? ''
          if ('spouse_name' in surveyData) resetObj.spouse_name = surveyData.spouse_name ?? ''
          if ('spouse_cpf' in surveyData) resetObj.spouse_cpf = surveyData.spouse_cpf ?? ''
          if ('residents_count' in surveyData) resetObj.residents_count = (surveyData.residents_count === null || surveyData.residents_count === undefined) ? 0 : Number(surveyData.residents_count)
          if ('has_children' in surveyData) resetObj.has_children = Boolean(surveyData.has_children)
          if ('occupation_time' in surveyData) resetObj.occupation_time = surveyData.occupation_time ?? ''
          if ('acquisition_mode' in surveyData) resetObj.acquisition_mode = surveyData.acquisition_mode ?? ''
          if ('property_use' in surveyData) resetObj.property_use = surveyData.property_use ?? ''
          if ('construction_type' in surveyData) resetObj.construction_type = surveyData.construction_type ?? ''
          if ('roof_type' in surveyData) resetObj.roof_type = surveyData.roof_type ?? ''
          if ('floor_type' in surveyData) resetObj.floor_type = surveyData.floor_type ?? ''
          if ('rooms_count' in surveyData) resetObj.rooms_count = (surveyData.rooms_count === null || surveyData.rooms_count === undefined) ? 0 : Number(surveyData.rooms_count)
          if ('conservation_state' in surveyData) resetObj.conservation_state = surveyData.conservation_state ?? ''
          if ('fencing' in surveyData) resetObj.fencing = surveyData.fencing ?? ''
          if ('water_supply' in surveyData) resetObj.water_supply = surveyData.water_supply ?? ''
          if ('energy_supply' in surveyData) resetObj.energy_supply = surveyData.energy_supply ?? ''
          if ('sanitation' in surveyData) resetObj.sanitation = surveyData.sanitation ?? ''
          if ('street_paving' in surveyData) resetObj.street_paving = surveyData.street_paving ?? ''
          if ('observations' in surveyData) resetObj.observations = surveyData.observations ?? ''
          if ('assinatura_requerente' in surveyData) resetObj.assinatura_requerente = surveyData.assinatura_requerente ?? ''
          if ('documents' in surveyData) resetObj.documents = surveyData.documents ?? []
          if ('analise_ia_classificacao' in surveyData) resetObj.analise_ia_classificacao = surveyData.analise_ia_classificacao ?? ''
          if ('analise_ia_parecer' in surveyData) resetObj.analise_ia_parecer = surveyData.analise_ia_parecer ?? ''
          if ('analise_ia_proximo_passo' in surveyData) resetObj.analise_ia_proximo_passo = surveyData.analise_ia_proximo_passo ?? ''
          if ('analise_ia_gerada_em' in surveyData) resetObj.analise_ia_gerada_em = surveyData.analise_ia_gerada_em ?? ''
          form.reset(resetObj)
          console.log('✅ Formulário preenchido com dados da vistoria existente', resetObj)
        }
      } catch (e) {
        console.error('❌ Erro ao carregar dados:', e)
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
      toast({ title: 'Lote excluído com sucesso!' })
      navigate(`/quadras/${lote.parent_item_id}`)
    } catch (error) {
      console.error('Error deleting lote:', error)
      toast({ title: 'Erro ao excluir lote', variant: 'destructive' })
    }
  }

  const handleGenerateAnaliseIA = async () => {
    if (!canEdit) return

    setGeneratingIA(true)
    try {
      const currentData = form.getValues()
      const analise = await analiseIAService.gerarAnalise(currentData as any)

      form.setValue('analise_ia_classificacao', analise.classificacao, { 
        shouldDirty: true, shouldTouch: true, shouldValidate: true 
      })
      form.setValue('analise_ia_parecer', analise.parecer_tecnico, { 
        shouldDirty: true, shouldTouch: true 
      })
      form.setValue('analise_ia_proximo_passo', analise.proximo_passo, { 
        shouldDirty: true, shouldTouch: true 
      })
      form.setValue('analise_ia_gerada_em', analise.gerada_em, { 
        shouldDirty: true, shouldTouch: true 
      })

      toast({
        title: 'Análise Gerada',
        description: `Classificação: ${analise.classificacao}`,
      })
    } catch (error) {
      console.error('❌ Erro ao gerar análise IA:', error)
      toast({ title: 'Erro', description: 'Não foi possível gerar a análise.', variant: 'destructive' })
    } finally {
      setGeneratingIA(false)
    }
  }

  const getCurrentLocation = () => {
    // REMOVIDO: A vistoria não deve atualizar coordenadas do lote
    toast({ 
      title: 'Função não disponível', 
      description: 'A atualização de coordenadas deve ser feita no formulário do lote.',
      variant: 'destructive' 
    })
  }

  const performBackgroundSync = async (data: any) => {
    try {
      // Tenta o envio
      await api.saveSurvey(data)
      
      // Se deu certo, marca como sincronizado no banco local
      const syncedData = { 
        ...data, 
        sync_status: 'synchronized',
        last_sync_at: new Date().toISOString()
      }
      db.saveSurvey(syncedData)
      console.log('✅ Sincronização em background concluída.')

      // Apenas atualiza status do lote (não as coordenadas)
      if (lote) {
        api.updateLote(propertyId, { status: 'surveyed' }).catch(console.warn)
      }

    } catch (err) {
      console.error('☁️ Falha na rede (background sync). O dado permanece "pending".', err)
    }
  }

  const onSubmit = async (values: SurveyFormValues) => {
    if (!canEdit) return
    
    setLoading(true)
    console.log('🚀 Iniciando processo de salvamento blindado...')
    
    try {
      const surveyPayload: any = {
        ...values,
        property_id: propertyId,
        // Mantém ID existente ou cria novo
        id: surveyId || crypto.randomUUID(),
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
        
        // Limpeza básica
        applicant_cpf: values.applicant_cpf?.replace(/\D/g, ''),
        spouse_cpf: values.spouse_cpf?.replace(/\D/g, ''),
      }

      // Preservar campos de IA e remover vazios
      const camposIAParaPreservar = [
        'analise_ia_classificacao',
        'analise_ia_parecer',
        'analise_ia_proximo_passo',
        'analise_ia_gerada_em',
      ]
      
      Object.keys(surveyPayload).forEach((k) => {
        if (surveyPayload[k] === '' && !camposIAParaPreservar.includes(k)) {
          delete surveyPayload[k]
        }
      })

      // 1. SALVAMENTO LOCAL IMEDIATO (APENAS VISTORIA)
      const savedSurvey = db.saveSurvey(surveyPayload)
      setSurveyId(savedSurvey.id as string)

      // 2. TRIGGER BACKGROUND SYNC
      if (isOnline) {
        performBackgroundSync(savedSurvey)
      } else {
         toast({
          title: 'Vistoria Salva Localmente',
          description: 'A vistoria foi salva no dispositivo e será enviada quando houver conexão.',
          className: 'bg-orange-50 border-orange-200 text-orange-800',
        })
      }

      // Navega de volta imediatamente
      setTimeout(() => {
        if (lote && lote.parent_item_id) {
            navigate(`/quadras/${lote.parent_item_id}`)
        } else {
            navigate(-1)
        }
      }, 500)

    } catch (error) {
      console.error('❌ ERRO CRÍTICO NO SALVAMENTO LOCAL:', error)
      toast({
        variant: "destructive",
        title: "Erro ao gravar dados",
        description: "O dispositivo pode estar sem espaço ou o navegador bloqueou o banco local."
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmitInvalid = (errors: FieldErrors<SurveyFormValues>) => {
    console.log('❌ onSubmit inválido:', errors)
    toast({
      title: 'Campos obrigatórios faltando',
      description: 'Revise os campos destacados antes de salvar.',
      variant: 'destructive',
    })
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

      <form onSubmit={form.handleSubmit(onSubmit, onSubmitInvalid)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-col h-auto sm:grid sm:h-10 sm:grid-cols-6 w-full bg-muted p-1 rounded-md mb-4">
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
              value="documentos"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
            >
              Documentos
            </TabsTrigger>
            <TabsTrigger
              value="observacoes"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
            >
              Observações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <SurveyGeneralTab 
              form={form} 
              canEdit={canEdit} 
              lote={lote}
              projectName={projectName}
              quadraName={quadraName}
              handlePrintLote={handlePrintLote}
              handleDeleteLote={handleDeleteLote}
              getCurrentLocation={getCurrentLocation}
              handleSignatureFile={handleSignatureFile}
              onOpenSignatureDialog={() => setSignatureDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="requerente">
            <SurveyApplicantTab 
              form={form} 
              canEdit={canEdit}
              handleRequerenteSignatureFile={handleRequerenteSignatureFile}
              onOpenRequerenteSignatureDialog={() => setRequerenteSignatureDialogOpen(true)}
              resizeRequerenteCanvas={resizeRequerenteCanvas}
            />
          </TabsContent>

          <TabsContent value="imovel">
            <SurveyPropertyTab form={form} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="infra">
            <SurveyInfraTab form={form} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="documentos">
            <SurveyDocsTab form={form} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="observacoes">
            <SurveyObservationsTab 
              form={form} 
              canEdit={canEdit} 
              generatingIA={generatingIA}
              handleGenerateAnaliseIA={handleGenerateAnaliseIA} 
            />
          </TabsContent>
        </Tabs>

        {canEdit && activeTab === 'observacoes' && (
          <div className="flex justify-end pt-4 bg-white sticky bottom-0 border-t p-4 z-10">
            <Button
              type="submit"
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={loading}
              onClick={() => console.log('🖱️ BOTÃO SALVAR CLICADO - loading:', loading)}
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

        <SignaturePad
          open={signatureDialogOpen}
          onClose={() => setSignatureDialogOpen(false)}
          onSave={handleSaveVistoriadorSignature}
          initialImage={form.watch('surveyor_signature')}
          title="Assinatura do Vistoriador"
          description="Assine no quadro abaixo"
        />

        <SignaturePad
          open={requerenteSignatureDialogOpen}
          onClose={() => setRequerenteSignatureDialogOpen(false)}
          onSave={handleSaveRequerenteSignature}
          initialImage={form.watch('assinatura_requerente')}
          title="Assinatura do Requerente"
          description="Assine no quadro abaixo"
        />
      </form>
    </Form>
  )
}