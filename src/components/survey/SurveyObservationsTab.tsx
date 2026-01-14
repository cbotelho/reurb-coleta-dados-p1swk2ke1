import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { SurveyFormValues } from './schema'

interface SurveyObservationsTabProps {
  form: UseFormReturn<SurveyFormValues>
  canEdit: boolean
  generatingIA: boolean
  handleGenerateAnaliseIA: () => void
}

export function SurveyObservationsTab({
  form,
  canEdit,
  generatingIA,
  handleGenerateAnaliseIA,
}: SurveyObservationsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Coluna 1: Observação do Vistoriador */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Observações do Vistoriador
        </h3>
        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={!canEdit}
                  placeholder="Observações técnicas sobre a vistoria, condições do imóvel, particularidades encontradas..."
                  className="min-h-[200px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Coluna 2: Análise Jurídica IA */}
      <div>
        {form.watch('analise_ia_classificacao') ? (
          // Card com análise gerada
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-400/30 p-2 rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide">
                  Análise Jurídica
                </h3>
                <p className="text-purple-200 text-xs">SisReub Insight</p>
              </div>
            </div>

            {/* Classificação */}
            <div className="bg-purple-400/20 rounded-lg p-4 mb-4">
              <p className="text-purple-200 text-xs uppercase mb-1">
                Classificação Sugerida
              </p>
              <FormField
                control={form.control}
                name="analise_ia_classificacao"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!canEdit}
                        className="text-2xl font-bold bg-transparent border-none text-white placeholder:text-purple-200 p-0 h-auto"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Parecer Técnico */}
            <div className="mb-4">
              <p className="text-purple-200 text-xs uppercase mb-2">
                Parecer Técnico
              </p>
              <FormField
                control={form.control}
                name="analise_ia_parecer"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!canEdit}
                        className="text-sm bg-purple-700/30 border-purple-500/30 text-white placeholder:text-purple-200 min-h-[120px]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Próximo Passo */}
            <div className="bg-purple-700/40 rounded-lg p-4">
              <p className="text-purple-200 text-xs uppercase mb-2">
                Próximo Passo
              </p>
              <FormField
                control={form.control}
                name="analise_ia_proximo_passo"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!canEdit}
                        className="text-sm bg-purple-600/20 border-purple-400/30 text-white placeholder:text-purple-200 min-h-[80px]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Data/hora geração */}
            {form.watch('analise_ia_gerada_em') && (
              <p className="text-purple-300 text-xs mt-4">
                Gerada em:{' '}
                {new Date(form.watch('analise_ia_gerada_em')!).toLocaleString(
                  'pt-BR',
                )}
              </p>
            )}

            {/* Botão regenerar */}
            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full mt-4"
                onClick={handleGenerateAnaliseIA}
                disabled={generatingIA}
              >
                {generatingIA ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerar Análise
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          // Card vazio - gerar análise
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 border-2 border-dashed border-purple-300 text-center">
            <div className="bg-purple-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Análise Jurídica Automática
            </h3>
            <p className="text-sm text-purple-700 mb-6">
              Gere uma análise baseada na Lei 13.465/2017 para classificar entre
              REURB-S (Social) ou REURB-E (Específico)
            </p>
            {canEdit && (
              <Button
                type="button"
                onClick={handleGenerateAnaliseIA}
                disabled={generatingIA}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingIA ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando análise...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Análise Inteligente
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
