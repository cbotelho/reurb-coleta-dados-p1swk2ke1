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
import { Home } from 'lucide-react'
import { SurveyFormValues } from './schema'

interface SurveyPropertyTabProps {
  form: UseFormReturn<SurveyFormValues>
  canEdit: boolean
}

export function SurveyPropertyTab({ form, canEdit }: SurveyPropertyTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium">
        <Home className="h-4 w-4" /> Características
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="occupation_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo de Ocupação</FormLabel>
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
                  <SelectItem value="1 a 5 anos">De 1 à 5 anos</SelectItem>
                  <SelectItem value="5 a 10 anos">De 5 à 10 anos</SelectItem>
                  <SelectItem value="Acima de 10 anos">
                    Acima de 10 anos
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="acquisition_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modo de Aquisição</FormLabel>
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
                  <SelectItem value="Ocupacao">
                    Ocupação mansa e pacífica
                  </SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="Terreno Baldio">Terreno Baldio</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="construction_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Construção</FormLabel>
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
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roof_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cobertura</FormLabel>
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
                  <SelectItem value="Telha de Amianto">
                    Telha de Amianto
                  </SelectItem>
                  <SelectItem value="Telha de Barro">Telha de Barro</SelectItem>
                  <SelectItem value="Telha de Alumínio">
                    Telha de Alumínio
                  </SelectItem>
                  <SelectItem value="Palha">Palha</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="floor_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Piso</FormLabel>
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
                  <SelectItem value="Cerâmica">Cerâmica</SelectItem>
                  <SelectItem value="Granito">Granito</SelectItem>
                  <SelectItem value="Madeira">Madeira</SelectItem>
                  <SelectItem value="Cimento">Cimento</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rooms_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nº Cômodos *</FormLabel>
              <FormControl>
                <Input type="number" {...field} disabled={!canEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
