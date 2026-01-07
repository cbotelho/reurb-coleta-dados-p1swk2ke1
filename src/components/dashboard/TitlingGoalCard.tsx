import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TitlingGoalData } from '@/types'
import { cn } from '@/lib/utils'

interface TitlingGoalCardProps {
  stats: TitlingGoalData
}

export function TitlingGoalCard({ stats }: TitlingGoalCardProps) {
  const percentage = Math.min(
    100,
    Math.round((stats.current / stats.goal) * 100),
  )
  const remaining = Math.max(0, stats.goal - stats.current)

  return (
    <Card className="bg-slate-900 text-white border-none shadow-xl col-span-1 lg:col-span-2">
      <CardContent className="p-8 flex flex-col justify-between h-full space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Meta de Titulação 2024
          </h2>
          <p className="text-slate-400 text-sm">
            Progresso municipal em direção à meta de{' '}
            {stats.goal.toLocaleString('pt-BR')} títulos.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-sm font-semibold text-slate-100">
              Progresso Atual
            </span>
            <span className="text-sm font-bold text-blue-400">
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} className="h-3 bg-slate-800" />
          <div className="h-1 rounded-full w-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Restante
            </span>
            <span className="text-2xl font-bold text-white">
              {remaining.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Ritmo/Mês
            </span>
            <span className="text-2xl font-bold text-white">
              +{stats.monthly_rhythm}
            </span>
          </div>
        </div>

        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-sm tracking-wide uppercase">
          Acelerar Processos
        </Button>
      </CardContent>
    </Card>
  )
}
