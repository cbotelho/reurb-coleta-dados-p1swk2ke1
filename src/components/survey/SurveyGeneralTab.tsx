import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { MapPin, Printer, Trash2, Upload, PenLine } from 'lucide-react'
import { SurveyFormValues, UF_OPTIONS } from './schema'
import { Lote } from '@/types'

interface SurveyGeneralTabProps {
  form: UseFormReturn<SurveyFormValues>
  canEdit: boolean
  lote: Lote | null
  projectName: string
  quadraName: string
  handlePrintLote: () => void
  handleDeleteLote: () => void
  getCurrentLocation: () => void
  handleSignatureFile: (file: File) => void
  onOpenSignatureDialog: () => void
}

export function SurveyGeneralTab({
  form, canEdit, lote, projectName, quadraName,
  handlePrintLote, handleDeleteLote, getCurrentLocation,
  handleSignatureFile, onOpenSignatureDialog
}: SurveyGeneralTabProps) {
  return (
    <div className="space-y-4">
      {/* Seção de GPS e Campos Gerais (omitidos aqui por brevidade, mantenha os seus) */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ... Seus campos de form_number, survey_date, city e state */}
      </div>

      {/* --- ADICIONE ESTE BLOCO AQUI PARA A ASSINATURA --- */}
      <div className="bg-white p-4 rounded-lg border space-y-3">
        <h3 className="font-semibold text-sm border-b pb-2 text-slate-700">
          Assinatura do Vistoriador
        </h3>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onOpenSignatureDialog} 
              disabled={!canEdit}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            >
              <PenLine className="w-4 h-4 mr-2" />
              Assinar Digitalmente
            </Button>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="signature-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSignatureFile(file);
                }}
                disabled={!canEdit}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                asChild
                disabled={!canEdit}
              >
                <label htmlFor="signature-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Submeter Imagem
                </label>
              </Button>
            </div>
          </div>

          <FormField
            control={form.control}
            name="surveyor_signature"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="border-2 border-dashed rounded-md bg-slate-50 overflow-hidden flex items-center justify-center min-h-[120px]">
                    {field.value ? (
                      <div className="relative w-full">
                        <img
                          src={field.value}
                          alt="Assinatura"
                          className="max-h-32 mx-auto object-contain"
                        />
                        {canEdit && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => form.setValue('surveyor_signature', '', { shouldDirty: true })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">
                        Nenhuma assinatura registrada
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}