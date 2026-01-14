import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap } from 'lucide-react'
import { SurveyFormValues } from './schema'

interface SurveyInfraTabProps {
  form: UseFormReturn<SurveyFormValues>
  canEdit: boolean
}

export function SurveyInfraTab({ form, canEdit }: SurveyInfraTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium">
        <Zap className="h-4 w-4" /> Infraestrutura e Serviços
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="water_supply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abastecimento de Água</FormLabel>
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
                  <SelectItem value="Rede Publica">Rede Pública</SelectItem>
                  <SelectItem value="Poco Amazonas">Poço Amazonas</SelectItem>
                  <SelectItem value="Poco Artesiano">Poço Artesiano</SelectItem>
                  <SelectItem value="Caminhao Pipa">Caminhão Pipa</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="energy_supply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Energia Elétrica</FormLabel>
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
                  <SelectItem value="Rede Publica com Medidor">
                    Rede Pública (Com Medidor)
                  </SelectItem>
                  <SelectItem value="Rede Publica sem Medidor">
                    Rede Pública (Sem Medidor)
                  </SelectItem>
                  <SelectItem value="Gato">Ligação Clandestina</SelectItem>
                  <SelectItem value="Nao Possui">Não Possui</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sanitation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Esgotamento Sanitário</FormLabel>
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
                  <SelectItem value="Fossa Septica">Fossa Séptica</SelectItem>
                  <SelectItem value="Fossa Negra">Fossa Negra</SelectItem>
                  <SelectItem value="Ceu Aberto">Céu Aberto</SelectItem>
                  <SelectItem value="Rede de Esgoto">Rede de Esgoto</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="street_paving"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pavimentação da Rua</FormLabel>
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
                  <SelectItem value="Asfalto">Asfalto</SelectItem>
                  <SelectItem value="Bloquete">Bloquete</SelectItem>
                  <SelectItem value="Piçarra">Piçarra</SelectItem>
                  <SelectItem value="Terra">Terra</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fencing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Divisa</FormLabel>
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
                  <SelectItem value="Cerca">Cerca</SelectItem>
                  <SelectItem value="Muro">Muro</SelectItem>
                  <SelectItem value="Sem Divisa">Sem Divisa</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
