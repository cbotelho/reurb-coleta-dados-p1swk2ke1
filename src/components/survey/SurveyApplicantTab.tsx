import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent, 
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { User as UserIcon, PenLine, Upload } from 'lucide-react'
import { SurveyFormValues } from './schema'

interface SurveyApplicantTabProps {
  form: UseFormReturn<SurveyFormValues>
  canEdit: boolean
  handleRequerenteSignatureFile: (file: File) => void
  onOpenRequerenteSignatureDialog: () => void
  resizeRequerenteCanvas: () => void
}

export function SurveyApplicantTab({
  form,
  canEdit,
  handleRequerenteSignatureFile,
  onOpenRequerenteSignatureDialog,
  resizeRequerenteCanvas,
}: SurveyApplicantTabProps) {
  const civilStatus = form.watch('applicant_civil_status')

  return (
    <div className="space-y-4">
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
              <FormLabel>CPF *</FormLabel>
              <FormControl>
                <Input {...field} disabled={!canEdit} />
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
                <SelectItem value="Uniao Estavel">União Estável</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <div className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="residents_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nº Moradores *</FormLabel>
              <FormControl>
                <Input type="number" {...field} disabled={!canEdit} />
              </FormControl>
              <FormMessage />
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
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                  disabled={!canEdit}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Filhos menores de 18 anos? *</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>

      {civilStatus !== 'Solteiro' && (
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
        </div>
      )}

      <div className="border-t pt-4 mt-4 bg-green-100 p-4 rounded-lg">
        <FormField
          control={form.control}
          name="declaracao_requerente"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md mb-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!canEdit}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-base">
                  Declaro, para os devidos fins, que foi realizada a vistoria do
                  lote urbano acima descrita nesta data. *
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2 mb-4">
          <PenLine className="h-4 w-4 text-blue-600" />
          <h4 className="font-semibold text-sm">Assinatura do Requerente</h4>
        </div>
        <FormField
          control={form.control}
          name="assinatura_requerente"
          render={({ field }) => (
            <FormItem>
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="flex gap-2 flex-wrap mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenRequerenteSignatureDialog()
                      setTimeout(() => resizeRequerenteCanvas(), 0)
                    }}
                    disabled={!canEdit}
                  >
                    <PenLine className="h-4 w-4 mr-2" /> Assinar
                  </Button>
                  <label className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    <span className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" /> Enviar Imagem
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleRequerenteSignatureFile(file)
                        }}
                        disabled={!canEdit}
                      />
                    </span>
                  </label>
                </div>
                {field.value && (
                  <div className="mt-4 border rounded-lg p-2 bg-white flex justify-center items-center h-32">
                    <img
                      src={field.value}
                      alt="Assinatura do Requerente"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
