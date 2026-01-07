import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Home, FileText, MapPin } from 'lucide-react'
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
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <div className={cn('p-3 rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
          <Badge
            className={cn('px-2.5 py-0.5 font-medium border-0', badgeColor)}
          >
            {badgeText}
          </Badge>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {label}
          </h4>
          <div className="text-3xl font-extrabold text-slate-900">
            {value.toLocaleString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      label: 'FAMÍLIAS CADASTRADAS',
      value: stats.totalFamilies || 0,
      icon: Users,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      badgeText: '+12%',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'PROCESSOS REURB-S',
      value: stats.totalProjects || 0,
      icon: Home,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      badgeText: '67%',
      badgeColor: 'bg-green-100 text-green-700',
    },
    {
      label: 'TÍTULOS EM EMISSÃO',
      value: stats.totalContracts || 0,
      icon: FileText,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      badgeText: '+5%',
      badgeColor: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'ÁREAS MAPEADAS',
      value: stats.totalQuadras || 0,
      icon: MapPin,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      badgeText: 'ATIVO',
      badgeColor: 'bg-rose-100 text-rose-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {cards.map((card, index) => (
        <SummaryCardItem key={index} {...card} />
      ))}
    </div>
  )
}
