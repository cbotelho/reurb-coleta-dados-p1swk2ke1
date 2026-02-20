import { UseFormReturn } from 'react-hook-form'
import { DocumentUpload } from '@/components/DocumentUpload'
import { SurveyFormValues } from './schema'

interface SurveyDocsTabProps {
  form: UseFormReturn<SurveyFormValues>
  canEdit: boolean
}

export function SurveyDocsTab({ form, canEdit }: SurveyDocsTabProps) {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Documentos da Vistoria
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Anexe documentos relevantes para a vistoria (RG, CPF, comprovantes,
          fotos, etc.)
        </p>
      </div>

      <DocumentUpload
        initialDocuments={form.watch('documents') || []}
        onDocumentsChange={(docs) => {
          form.setValue('documents', docs, { shouldDirty: true })
          console.log('📎 documentos atualizados:', docs)
        }}
        maxFiles={20}
        maxSizeMB={20}
        disabled={!canEdit}
      />
    </div>
  )
}
