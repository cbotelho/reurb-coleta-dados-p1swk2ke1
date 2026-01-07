import { PieChart, Pie, Cell, Label, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { ModalityData } from '@/types'

interface ModalitiesChartProps {
  data: ModalityData[]
}

const chartConfig = {
  'REURB-S': {
    label: 'REURB-S',
    color: 'hsl(var(--chart-1))',
  },
  'REURB-E': {
    label: 'REURB-E',
    color: 'hsl(var(--chart-2))',
  },
}

export function ModalitiesChart({ data }: ModalitiesChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0)

  return (
    <Card className="col-span-1 shadow-sm border-slate-100 flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          Modalidades
        </CardTitle>
        <p className="text-sm text-slate-500">Mix de processos ativos</p>
      </CardHeader>
      <CardContent className="flex-1 min-h-[200px] flex flex-col justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltipContent />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={85}
              strokeWidth={5}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-slate-900 text-2xl font-bold"
                        >
                          {(total / 1000).toFixed(1)}k
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-slate-500 text-xs font-semibold uppercase tracking-wider"
                        >
                          Total
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="mt-8 space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm font-semibold text-slate-700">
                  {item.name}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
