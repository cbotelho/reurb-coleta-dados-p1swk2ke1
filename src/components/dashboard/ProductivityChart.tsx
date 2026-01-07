import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { ProductivityData } from '@/types'

interface ProductivityChartProps {
  data: ProductivityData[]
}

const chartConfig = {
  cadastros: {
    label: 'Cadastros',
    color: 'hsl(var(--chart-1))',
  },
  titulos: {
    label: 'Títulos',
    color: 'hsl(var(--chart-2))',
  },
}

export function ProductivityChart({ data }: ProductivityChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900">
            Produtividade Mensal
          </CardTitle>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--chart-1))]"></span>
              Cadastros
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--chart-2))]"></span>
              Títulos
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-500">Cadastros vs. Títulos Emitidos</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-cadastros)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-cadastros)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorTitulos" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-titulos)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-titulos)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip
              content={<ChartTooltipContent indicator="dot" />}
              cursor={{
                stroke: '#cbd5e1',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Area
              type="monotone"
              dataKey="cadastros"
              stroke="var(--color-cadastros)"
              fillOpacity={1}
              fill="url(#colorCadastros)"
              strokeWidth={3}
            />
            <Area
              type="monotone"
              dataKey="titulos"
              stroke="var(--color-titulos)"
              fillOpacity={1}
              fill="url(#colorTitulos)"
              strokeWidth={3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
