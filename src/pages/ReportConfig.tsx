import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/services/api'
import { Project, Lote, Quadra } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, ArrowLeft, BarChart, Loader2 } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'

export default function ReportConfig() {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | undefined>()
  const [lotes, setLotes] = useState<Lote[]>([])
  const [quadras, setQuadras] = useState<Quadra[]>([])
  const [loading, setLoading] = useState(true)

  // Config State
  const [showCharts, setShowCharts] = useState(true)
  const [fields, setFields] = useState({
    name: true,
    area: true,
    status: true,
    description: false,
  })

  useEffect(() => {
    if (projectId) {
      loadData(projectId)
    }
  }, [projectId])

  const loadData = async (id: string) => {
    try {
      const p = await api.getProject(id)
      if (p) {
        setProject(p)
        const q = await api.getQuadras(id)
        setQuadras(q)
        // Fetch lots for all quadras
        const allLotes = []
        for (const quadra of q) {
          const quadraLotes = await api.getLotes(quadra.local_id)
          allLotes.push(...quadraLotes)
        }
        setLotes(allLotes)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Chart Data Preparation
  const statusData = [
    {
      name: 'Sincronizado',
      value: lotes.filter((l) => l.sync_status === 'synchronized').length,
      fill: 'hsl(var(--chart-1))',
    },
    {
      name: 'Pendente',
      value: lotes.filter((l) => l.sync_status === 'pending').length,
      fill: 'hsl(var(--chart-2))',
    },
    {
      name: 'Falha',
      value: lotes.filter((l) => l.sync_status === 'failed').length,
      fill: 'hsl(var(--chart-3))',
    },
  ].filter((d) => d.value > 0)

  const chartConfig = {
    status: {
      label: 'Status',
    },
    synchronized: {
      label: 'Sincronizado',
      color: 'hsl(var(--chart-1))',
    },
    pending: {
      label: 'Pendente',
      color: 'hsl(var(--chart-2))',
    },
    failed: {
      label: 'Falha',
      color: 'hsl(var(--chart-3))',
    },
  }

  if (loading)
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    )
  if (!project) return <div>Projeto não encontrado</div>

  return (
    <div className="space-y-6 pb-20 print:p-0 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/projetos/${projectId}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Configurar Relatório</h2>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Config Sidebar - Hidden on Print */}
        <Card className="print:hidden lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Opções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Campos para Exibir</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="f-name"
                    checked={fields.name}
                    onCheckedChange={(c) => setFields({ ...fields, name: !!c })}
                  />
                  <Label htmlFor="f-name">Identificação</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="f-area"
                    checked={fields.area}
                    onCheckedChange={(c) => setFields({ ...fields, area: !!c })}
                  />
                  <Label htmlFor="f-area">Área</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="f-status"
                    checked={fields.status}
                    onCheckedChange={(c) =>
                      setFields({ ...fields, status: !!c })
                    }
                  />
                  <Label htmlFor="f-status">Status</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="f-desc"
                    checked={fields.description}
                    onCheckedChange={(c) =>
                      setFields({ ...fields, description: !!c })
                    }
                  />
                  <Label htmlFor="f-desc">Descrição</Label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-charts">Incluir Gráficos</Label>
              <Switch
                id="show-charts"
                checked={showCharts}
                onCheckedChange={setShowCharts}
              />
            </div>
          </CardContent>
        </Card>

        {/* Report Preview - Full Width on Print */}
        <div className="lg:col-span-3 print:col-span-4 bg-white p-8 shadow-sm border rounded-lg print:border-none print:shadow-none min-h-screen">
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500">Relatório Geral de Acompanhamento</p>
            <p className="text-sm text-gray-400 mt-1">
              Gerado em {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Total de Quadras</span>
              <p className="text-xl font-semibold">{quadras.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Total de Lotes</span>
              <p className="text-xl font-semibold">{lotes.length}</p>
            </div>
          </div>

          {showCharts && (
            <div className="mb-8 p-4 border rounded-lg print:break-inside-avoid">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart className="w-5 h-5" /> Distribuição de Status
              </h3>
              <div className="h-[300px] w-full max-w-[500px] mx-auto">
                <ChartContainer config={chartConfig}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalhamento dos Lotes</h3>
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  {fields.name && <th className="p-2">Identificação</th>}
                  <th className="p-2">Quadra</th>
                  {fields.area && <th className="p-2">Área</th>}
                  {fields.status && <th className="p-2">Status</th>}
                  {fields.description && <th className="p-2">Descrição</th>}
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote) => {
                  const quadra = quadras.find(
                    (q) => q.local_id === lote.parent_item_id,
                  )
                  return (
                    <tr key={lote.local_id} className="border-b">
                      {fields.name && (
                        <td className="p-2 font-medium">{lote.name}</td>
                      )}
                      <td className="p-2">{quadra?.name || '-'}</td>
                      {fields.area && <td className="p-2">{lote.area}</td>}
                      {fields.status && (
                        <td className="p-2">
                          <span
                            className={
                              lote.sync_status === 'synchronized'
                                ? 'text-green-600'
                                : 'text-orange-600'
                            }
                          >
                            {lote.sync_status === 'synchronized'
                              ? 'Sincronizado'
                              : 'Pendente'}
                          </span>
                        </td>
                      )}
                      {fields.description && (
                        <td className="p-2 text-gray-500 max-w-[200px] truncate">
                          {lote.description}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
