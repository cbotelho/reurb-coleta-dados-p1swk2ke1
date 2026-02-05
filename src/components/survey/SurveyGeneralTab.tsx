import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MapPin, Upload, PenLine, Trash2 } from 'lucide-react'
import { SurveyFormValues, UF_OPTIONS } from './schema'
import { Lote } from '@/types'

// Atualizei a interface removendo props não utilizadas
interface SurveyGeneralTabProps {
  form: UseFormReturn<SurveyFormValues>
  canEdit: boolean
  lote: Lote | null
  projectName: string
  quadraName: string
  // REMOVIDAS: loteAddress, loteLatitude, loteLongitude (não são usadas)
  handlePrintLote: () => void
  handleDeleteLote: () => void
  getCurrentLocation: () => void
  handleSignatureFile: (file: File) => void
  onOpenSignatureDialog: () => void
}

export function SurveyGeneralTab({
  form, canEdit, getCurrentLocation,
  handleSignatureFile, onOpenSignatureDialog
}: SurveyGeneralTabProps) {
  return (
    <div className="space-y-6"> 
      {/* 1. BLOCO DE DADOS DA VISTORIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="form_number" render={({ field }) => (
          <FormItem><FormLabel>Nº Formulário</FormLabel><FormControl><Input {...field} disabled={!canEdit} placeholder="Ex: 001/2024" /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="survey_date" render={({ field }) => (
          <FormItem><FormLabel>Data da Vistoria *</FormLabel><FormControl><Input type="date" {...field} disabled={!canEdit} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="city" render={({ field }) => (
          <FormItem><FormLabel>Município *</FormLabel><FormControl><Input {...field} disabled={!canEdit} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="state" render={({ field }) => (
          <FormItem>
            <FormLabel>UF *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>{UF_OPTIONS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* 3. BLOCO DE ASSINATURA DO VISTORIADOR */}
      <div className="bg-white p-4 rounded-lg border-2 border-slate-100 space-y-3">
        <h3 className="font-semibold text-sm border-b pb-2 text-slate-700 flex items-center gap-2">
          <PenLine className="w-4 h-4" /> Assinatura do Vistoriador
        </h3>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={onOpenSignatureDialog} 
              disabled={!canEdit}
            >
              <PenLine className="w-4 h-4 mr-2" />
              Assinar na Tela
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
              <Button type="button" variant="outline" size="sm" asChild disabled={!canEdit}>
                <label htmlFor="signature-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" /> Carregar Foto
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
                  <div className="border rounded-md bg-slate-50 overflow-hidden flex items-center justify-center min-h-[100px] relative">
                    {field.value ? (
                      <>
                        <img src={field.value} alt="Assinatura" className="h-24 object-contain" />
                        {canEdit && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 opacity-70 hover:opacity-100"
                            onClick={() => form.setValue('surveyor_signature', '', { shouldDirty: true })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-[10px] uppercase font-medium italic">
                        Aguardando assinatura
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