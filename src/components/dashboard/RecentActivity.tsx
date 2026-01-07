import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RecentActivityItem } from '@/types'
import {
  FileText,
  CheckCircle2,
  UserPlus,
  Settings,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RecentActivityProps {
  activities: RecentActivityItem[]
}

const getIcon = (type: RecentActivityItem['type']) => {
  switch (type) {
    case 'registration':
      return <UserPlus className="h-5 w-5 text-blue-500" />
    case 'approval':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'document':
      return <FileText className="h-5 w-5 text-purple-500" />
    case 'system':
      return <Settings className="h-5 w-5 text-gray-500" />
    default:
      return <Activity className="h-5 w-5 text-orange-500" />
  }
}

const getBgColor = (type: RecentActivityItem['type']) => {
  switch (type) {
    case 'registration':
      return 'bg-blue-50'
    case 'approval':
      return 'bg-green-50'
    case 'document':
      return 'bg-purple-50'
    case 'system':
      return 'bg-gray-50'
    default:
      return 'bg-orange-50'
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-slate-900">
          Atividade Recente
        </CardTitle>
        <Button
          variant="link"
          className="text-blue-600 font-semibold px-0 hover:no-underline"
        >
          VER TUDO
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Nenhuma atividade recente.
            </p>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div
                  className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                    getBgColor(item.type),
                  )}
                >
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold text-slate-900 leading-none">
                    {item.action}
                  </p>
                  <p className="text-xs text-slate-500">
                    Por:{' '}
                    <span className="font-medium text-blue-600">
                      {item.user_name}
                    </span>{' '}
                    •{' '}
                    {formatDistanceToNow(new Date(item.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
