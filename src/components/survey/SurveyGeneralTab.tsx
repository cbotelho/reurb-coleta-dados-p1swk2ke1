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
      <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-semibold text-sm">Localização GPS</h3>
          <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} disabled={!canEdit}>
            <MapPin className="w-3 h-3 mr-2" /> Capturar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="latitude" render={({ field }) => (
            <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input {...field} disabled={!canEdit} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="longitude" render={({ field }) => (
            <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input {...field} disabled={!canEdit} /></FormControl></FormItem>
          )} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="form_number" render={({ field }) => (
          <FormItem><FormLabel>Nº Formulário</FormLabel><FormControl><Input {...field} disabled={!canEdit} /></FormControl></FormItem>
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
    </div>
  )
}