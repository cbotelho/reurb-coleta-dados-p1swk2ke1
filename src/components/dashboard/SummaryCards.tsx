import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Home, MapPin, FileText } from 'lucide-react'
import { ClipboardCheck, ClipboardX, Brain, FolderOpen } from 'lucide-react'
import { DashboardStats } from '@/types'
import { cn } from '@/lib/utils'

interface SummaryCardsProps {
  stats: DashboardStats
}

interface SummaryCardItemProps {
  label: string
  value: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  badgeText: string
  badgeColor: string
}

function SummaryCardItem({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  badgeText,
  badgeColor,
}: SummaryCardItemProps) {
  return (
    <Card className="rounded-xl shadow-sm border border-slate-100 bg-white">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-3">
          <div className={cn('p-2 rounded-lg', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          <Badge
            className={cn('px-2.5 py-0.5 font-medium border-0', badgeColor)}
          >
            {badgeText}
          </Badge>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {label}
          </h4>
          <div className="text-2xl font-bold text-slate-900">
            {value.toLocaleString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  // Calcular percentuais dinâmicos
  const percentVistoriados = stats.totalProperties > 0 
    ? Math.round((stats.totalSurveysCompleted / stats.totalProperties) * 100)
    : 0
  
  const percentAnalise = stats.totalSurveysCompleted > 0
    ? Math.round((stats.totalAnalyzedByAI / stats.totalSurveysCompleted) * 100)
    : 0

  const cards = [
    {
      label: 'FAMÍLIAS CADASTRADAS',
      value: stats.totalFamilies || 0,
      icon: Users,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      badgeText: 'Total',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'PROCESSOS REURB-S',
      value: stats.totalReurbS || 0,
      icon: Home,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      badgeText: 'Classificados IA',
      badgeColor: 'bg-green-100 text-green-700',
    },
    {
      label: 'PROCESSOS REURB-E',
      value: stats.totalReurbE || 0,
      icon: MapPin,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      badgeText: 'Classificados IA',
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      label: 'LOTES TITULADOS',
      value: stats.totalContracts || 0,
      icon: FileText,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      badgeText: 'Contratos',
      badgeColor: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'LOTES VISTORIADOS',
      value: stats.totalSurveysCompleted || 0,
      icon: ClipboardCheck,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeText: `${percentVistoriados}%`,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'LOTES NÃO VISTORIADOS',
      value: stats.totalSurveysNotCompleted || 0,
      icon: ClipboardX,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badgeText: `${100 - percentVistoriados}%`,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'LOTES ANALISADOS COM IA',
      value: stats.totalAnalyzedByAI || 0,
      icon: Brain,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      badgeText: `${percentAnalise}%`,
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'LOTES COM PROCESSOS',
      value: stats.totalPropertiesWithProcess || 0,
      icon: FolderOpen,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      badgeText: 'Contratos',
      badgeColor: 'bg-teal-100 text-teal-700',
    },
  ]

  return (
    <>
      {/* Primeira linha: 4 cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {cards.slice(0, 4).map((card, index) => (
          <SummaryCardItem key={index} {...card} />
        ))}
      </div>
      
      {/* Segunda linha: 4 novos cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {cards.slice(4).map((card, index) => (
          <SummaryCardItem key={index + 4} {...card} />
        ))}
      </div>
    </>
  )
}
