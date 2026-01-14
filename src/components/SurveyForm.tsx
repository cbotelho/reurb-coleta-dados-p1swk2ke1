import { useEffect, useRef, useState } from 'react'
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
  
  // Just a helper to force resize if needed, passed to sub-components
  const resizeRequerenteCanvas = () => {
    // This logic is now internal to SignaturePad, but we might keep it if button triggers something
    // The previous code had setTimeout(() => resizeRequerenteCanvas(), 0). 
    // Since SignaturePad now handles its own resize on open, we might not need this explicitly exposed,
    // but the sub-component button calls it. We can pass a no-op or remove the requirement.
    // Actually, let's keep it simple. The button inside SurveyApplicantTab calls it. 
    // We can just pass a dummy function or remove it from the prop interface if not needed.
    // Let's check SignaturePad usage in SurveyApplicantTab.
    // It calls `onOpenRequerenteSignatureDialog` and `resizeRequerenteCanvas`.
    // Since `SignaturePad` handles resize in useEffect, we might not need to manually call it anymore.
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
          // ... (logs removed for brevity, kept consistent with logic)
          
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
        } else {
          console.warn('⚠️ Nenhum lote encontrado para ID:', propertyId)
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
            assinatura_requerente: (surveyData as any).assinatura_requerente ?? '',
            documents: (surveyData as any).documents ?? [],
            analise_ia_classificacao: (surveyData as any).analise_ia_classificacao ?? '',
            analise_ia_parecer: (surveyData as any).analise_ia_parecer ?? '',
            analise_ia_proximo_passo: (surveyData as any).analise_ia_proximo_passo ?? '',
            analise_ia_gerada_em: (surveyData as any).analise_ia_gerada_em ?? '',
          } as any)
          console.log('✅ Formulário preenchido com dados da vistoria existente')
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
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude.toFixed(6))
          form.setValue('longitude', position.coords.longitude.toFixed(6))
          toast({ title: 'Localização obtida', description: 'Coordenadas atualizadas.' })
        },
        (error) => {
          toast({ title: 'Erro', description: 'Não foi possível obter a localização.', variant: 'destructive' })
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

      const camposIAParaPreservar = [
        'analise_ia_classificacao',
        'analise_ia_parecer',
        'analise_ia_proximo_passo',
        'analise_ia_gerada_em',
      ]
      
      Object.keys(surveyData).forEach((k) => {
        if (surveyData[k] === '' && !camposIAParaPreservar.includes(k)) {
          delete surveyData[k]
        }
      })

      delete surveyData.address
      delete surveyData.latitude
      delete surveyData.longitude

      // --- OFFLINE-FIRST FIX ---
      const dataToSave = {
        id: surveyId,
        property_id: propertyId,
        ...surveyData,
        sync_status: 'pending' as const
      }
      
      const savedSurvey = db.saveSurvey(dataToSave)
      setSurveyId(savedSurvey.id as string)
      
      if (isOnline) {
        try {
          await api.saveSurvey({
            ...savedSurvey,
            id: savedSurvey.id,
            property_id: propertyId
          })
          toast({ title: 'Sucesso', description: 'Dados salvos e sincronizados com o servidor!' })
        } catch (e) {
          console.warn('⚠️ Falha no sync online, mantido offline:', e)
          toast({
            title: 'Salvo Localmente',
            description: 'Salvo no dispositivo. Será sincronizado quando a conexão estabilizar.',
            className: 'bg-orange-50 border-orange-200 text-orange-800',
          })
        }
      } else {
        toast({
          title: 'Documentos Salvos Localmente',
          description: 'Aguardando na fila para sincronizar quando online.',
          className: 'bg-orange-50 border-orange-200 text-orange-800',
        })
      }

      if (lote) {
        if (values.latitude || values.longitude || values.address) {
          await api.updateLote(propertyId, {
            address: values.address || lote.address,
            latitude: values.latitude || lote.latitude,
            longitude: values.longitude || lote.longitude,
            status: 'surveyed',
          })
        } else {
          await api.saveLote({
            ...lote,
            address: values.address || lote.address,
            status: 'surveyed',
            sync_status: isOnline ? 'synchronized' : 'pending',
            quadra_id: lote.parent_item_id,
          })
        }
      }

      refreshStats()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Falha ao sincronizar',
        description: 'Dados salvos localmente e colocados na fila para nova tentativa.',
        variant: 'destructive',
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
