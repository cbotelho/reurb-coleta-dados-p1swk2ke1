import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { socialReportService } from '@/services/socialReportService'
import { imageService } from '@/services/imageService'
import { RichTextEditor } from './RichTextEditor'
import { SignaturePad } from './SignaturePad'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Badge } from './ui/badge'
import { FileText, Download, Save, Clock, CheckCircle2, PenTool, Image as ImageIcon } from 'lucide-react'
import type { SocialReport } from '@/types'

const socialReportSchema = z.object({
  parecer: z.string().min(600, 'Parecer deve ter no mínimo 600 caracteres. É necessário um laudo detalhado.'),
  numero_registro: z.string().optional(),
  assinatura_eletronica: z.string().optional(),
  nome_assistente_social: z.string().min(3, 'Nome obrigatório'),
  cress_assistente_social: z.string().optional(),
  email_assistente_social: z.string().email('E-mail inválido').optional().or(z.literal('')),
  status: z.enum(['rascunho', 'finalizado', 'revisado', 'aprovado']),
})

type SocialReportFormData = z.infer<typeof socialReportSchema>

interface SocialReportFormProps {
  open: boolean
  onClose: () => void
  propertyId: string
  quadraId: string
  projectId: string
  existingReport?: SocialReport | null
  onSuccess?: () => void
  // Informações contextuais
  propertyName?: string
  quadraName?: string
  projectName?: string
}

export function SocialReportForm({
  open,
  onClose,
  propertyId,
  quadraId,
  projectId,
  existingReport,
  onSuccess,
  propertyName,
  quadraName,
  projectName,
}: SocialReportFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [parecerContent, setParecerContent] = useState('')

  const defaultFormValues: SocialReportFormData = {
    parecer: '',
    numero_registro: '',
    assinatura_eletronica: '',
    nome_assistente_social: '',
    cress_assistente_social: '',
    email_assistente_social: '',
    status: 'rascunho',
  }

  const form = useForm<SocialReportFormData>({
    resolver: zodResolver(socialReportSchema),
    defaultValues: defaultFormValues,
  })

  // Carregar dados do parecer existente
  useEffect(() => {
    if (existingReport) {
      const valuesToReset = {
        parecer: existingReport.parecer,
        numero_registro: existingReport.numero_registro || '',
        assinatura_eletronica: existingReport.assinatura_eletronica || '',
        nome_assistente_social: existingReport.nome_assistente_social,
        cress_assistente_social: existingReport.cress_assistente_social || '',
        email_assistente_social: existingReport.email_assistente_social || '',
        status: existingReport.status || 'rascunho',
      }
      form.reset(valuesToReset)
      setParecerContent(existingReport.parecer)
    } else {
      // Limpar formulário para novo parecer, garantindo os padrões
      form.reset(defaultFormValues)
      setParecerContent('')
    }
  }, [existingReport, form.reset])

  const [showSignaturePad, setShowSignaturePad] = useState(false)

  const handleEditorImageUpload = async (file: File): Promise<string> => {
    try {
      const urls = await imageService.uploadImages([file], propertyId)
      if (urls && urls.length > 0) {
        return urls[0]
      }
      throw new Error('Falha ao obter URL da imagem')
    } catch (error) {
      console.error('Erro no upload de imagem do editor:', error)
      toast.error('Erro ao enviar imagem. Verifique se o arquivo é válido.')
      return ''
    }
  }

  const handleSignatureSave = async (signatureDataUrl: string) => {
    try {
      const res = await fetch(signatureDataUrl)
      const blob = await res.blob()
      const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' })

      const urls = await imageService.uploadImages([file], propertyId)
      if (urls && urls.length > 0) {
        form.setValue('assinatura_eletronica', urls[0], { shouldDirty: true, shouldTouch: true })
        toast.success('Assinatura anexada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error)
      toast.error('Erro ao salvar assinatura')
    }
  }

  const onSubmit = async (data: SocialReportFormData) => {
    try {
      setIsLoading(true)

      const reportData = {
        ...data,
        parecer: parecerContent,
        property_id: propertyId,
        quadra_id: quadraId,
        project_id: projectId,
      }

      if (existingReport) {
        // Atualizar parecer existente
        await socialReportService.update(existingReport.id, reportData)
        toast.success('Parecer atualizado com sucesso!')
      } else {
        // Criar novo parecer
        await socialReportService.create(reportData)
        toast.success('Parecer criado com sucesso!')
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar parecer:', error)
      toast.error('Erro ao salvar parecer. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!existingReport) {
      toast.error('Salve o parecer antes de exportar')
      return
    }

    try {
      await socialReportService.exportToPDF(existingReport.id)
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      rascunho: { variant: 'secondary', icon: Clock, label: 'Rascunho' },
      finalizado: { variant: 'default', icon: FileText, label: 'Finalizado' },
      revisado: { variant: 'outline', icon: CheckCircle2, label: 'Revisado' },
      aprovado: { variant: 'success', icon: CheckCircle2, label: 'Aprovado' },
    }

    const config = variants[status] || variants.rascunho
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {existingReport ? 'Editar' : 'Novo'} Parecer Conclusivo
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-1 mt-2">
              <p><strong>Projeto:</strong> {projectName || 'N/A'}</p>
              <p><strong>Quadra:</strong> {quadraName || 'N/A'}</p>
              <p><strong>Lote:</strong> {propertyName || 'N/A'}</p>
              {existingReport && (
                <div className="flex items-center gap-2 mt-2">
                  <span><strong>Registro:</strong> {existingReport.numero_registro || 'Não gerado'}</span>
                  {getStatusBadge(existingReport.status)}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações do Assistente Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Identificação do Assistente Social</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_assistente_social">
                  Nome Completo *
                </Label>
                <Input
                  id="nome_assistente_social"
                  {...form.register('nome_assistente_social')}
                  placeholder="Ex: Maria Silva Santos"
                />
                {form.formState.errors.nome_assistente_social && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.nome_assistente_social.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cress_assistente_social">CRESS</Label>
                <Input
                  id="cress_assistente_social"
                  {...form.register('cress_assistente_social')}
                  placeholder="Ex: CRESS 1234/AP"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_assistente_social">E-mail</Label>
              <Input
                id="email_assistente_social"
                type="email"
                {...form.register('email_assistente_social')}
                placeholder="assistente.social@exemplo.com"
              />
              {form.formState.errors.email_assistente_social && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email_assistente_social.message}
                </p>
              )}
            </div>
          </div>

          {/* Conteúdo do Parecer */}
          <div className="space-y-2">
            <Label>Parecer Conclusivo *</Label>
            <RichTextEditor
              content={parecerContent}
              onChange={setParecerContent}
              onImageUpload={handleEditorImageUpload}
              placeholder="Digite o parecer técnico conclusivo..."
            />
            {form.formState.errors.parecer && (
              <p className="text-sm text-destructive">
                {form.formState.errors.parecer.message}
              </p>
            )}
          </div>

          {/* Status e Assinatura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="finalizado">Finalizado</SelectItem>
                      <SelectItem value="revisado">Revisado</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assinatura_eletronica">Assinatura Eletrônica</Label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    id="assinatura_eletronica"
                    {...form.register('assinatura_eletronica')}
                    placeholder="Clique no ícone para assinar"
                    readOnly
                  />
                  {form.watch('assinatura_eletronica') && (
                    <div className="mt-2 border rounded-lg p-2 bg-muted/20 flex justify-center">
                      <img 
                        src={form.watch('assinatura_eletronica')} 
                        alt="Assinatura" 
                        className="max-h-24 object-contain"
                      />
                    </div>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setShowSignaturePad(true)}
                  title="Coletar Assinatura"
                  className="h-10 w-10 flex-shrink-0"
                >
                  <PenTool className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>

            {existingReport && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleExportPDF}
                disabled={isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            )}

            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Parecer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <SignaturePad
      open={showSignaturePad}
      onClose={() => setShowSignaturePad(false)}
      onSave={async (dataUrl) => {
        await handleSignatureSave(dataUrl)
        setShowSignaturePad(false)
      }}
    />
    </>
  )
}
