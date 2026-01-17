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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  form,
  canEdit,
  lote,
  projectName,
  quadraName,
  handlePrintLote,
  handleDeleteLote,
  getCurrentLocation,
  handleSignatureFile,
  onOpenSignatureDialog,
}: SurveyGeneralTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-emerald-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">Projeto:</span>
              <span className="font-medium">{projectName || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Quadra:</span>
              <span className="font-medium">{quadraName || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Lote:</span>
              <span className="font-medium">{lote?.name || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Área do Lote:</span>
              <span className="font-medium">{lote?.area || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintLote}
              disabled={!lote}
            >
              <Printer className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={!canEdit || !lote}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteLote} className="bg-red-600">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

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
              <FormLabel>Data da Vistoria *</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={!canEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Município *</FormLabel>
              <FormControl>
                <Input {...field} disabled={!canEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UF *</FormLabel>
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
                  {UF_OPTIONS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
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

        <FormField
          control={form.control}
          name="surveyor_signature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assinatura do Vistoriador</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleSignatureFile(f)
                        }}
                        disabled={!canEdit}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canEdit}
                      >
                        <Upload className="h-4 w-4 mr-2" /> Enviar
                      </Button>
                    </label>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!canEdit}
                      onClick={onOpenSignatureDialog}
                    >
                      <PenLine className="h-4 w-4 mr-2" /> Assinar
                    </Button>

                    {field.value ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!canEdit}
                        onClick={() => form.setValue('surveyor_signature', '', { shouldDirty: true })}
                      >
                        Limpar
                      </Button>
                    ) : null}
                  </div>

                  <div className="border rounded-md bg-white overflow-hidden">
                    {field.value ? (
                      <img
                        src={field.value}
                        alt="Assinatura do vistoriador"
                        className="w-full h-24 object-contain"
                      />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                        Nenhuma assinatura
                      </div>
                    )}
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
