import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { socialReportService } from '@/services/socialReportService'
import { SocialReportForm } from '@/components/SocialReportForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Plus,
  Download,
  Edit,
  Trash2,
  Search,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import type { SocialReport } from '@/types'

export default function SocialReports() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  
 
  const [reports, setReports] = useState<SocialReport[]>([])
  const [filteredReports, setFilteredReports] = useState<SocialReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<SocialReport | null>(null)
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  // Permissões
  const canEdit = user?.role === 'admin' ||
                  user?.role === 'Assistente Social';

  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    filterReports()
  }, [reports, searchTerm, statusFilter])

  // Carregar pareceres
  const loadReports = async () => {
    try {
      setIsLoading(true)
      
      // Buscar filtros da URL
      const projectId = searchParams.get('project_id')
      const quadraId = searchParams.get('quadra_id')
      const propertyId = searchParams.get('property_id')
      
      const filters: any = {}
      if (projectId) filters.project_id = projectId
      if (quadraId) filters.quadra_id = quadraId
      if (propertyId) filters.property_id = propertyId
      
      const data = await socialReportService.getAll(filters)
      setReports(data)
    } catch (error) {
      console.error('Erro ao carregar pareceres:', error)
      toast.error('Erro ao carregar pareceres')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar pareceres
  const filterReports = () => {
    let filtered = reports

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (report) =>
          report.numero_registro?.toLowerCase().includes(term) ||
          report.nome_assistente_social.toLowerCase().includes(term) ||
          report.property_name?.toLowerCase().includes(term) ||
          report.project_name?.toLowerCase().includes(term)
      )
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((report) => report.status === statusFilter)
    }

    setFilteredReports(filtered)
  }

  // Handlers
  const handleNew = () => {
    setSelectedReport(null)
    setIsFormOpen(true)
  }

  const handleEdit = (report: SocialReport) => {
    setSelectedReport(report)
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!reportToDelete) return

    try {
      await socialReportService.delete(reportToDelete)
      toast.success('Parecer excluído com sucesso')
      loadReports()
    } catch (error) {
      console.error('Erro ao excluir parecer:', error)
      toast.error('Erro ao excluir parecer')
    } finally {
      setDeleteDialogOpen(false)
      setReportToDelete(null)
    }
  }

  const handleExportPDF = async (reportId: string) => {
    try {
      await socialReportService.exportToPDF(reportId)
      toast.success('PDF gerado com sucesso')
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      rascunho: { variant: 'secondary', icon: Clock, label: 'Rascunho' },
      finalizado: { variant: 'default', icon: FileText, label: 'Finalizado' },
      revisado: { variant: 'outline', icon: CheckCircle2, label: 'Revisado' },
      aprovado: { variant: 'success', icon: CheckCircle2, label: 'Aprovado' },
    }

    const config = variants[status] || variants.rascunho
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Pareceres Conclusivos - Assistência Social
              </CardTitle>
              <CardDescription>
                Gerenciar pareceres técnicos dos lotes do REURB
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={handleNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Parecer
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, assistente social, lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="revisado">Revisado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando pareceres...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Nenhum parecer encontrado com os filtros aplicados'
                  : 'Nenhum parecer cadastrado'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registro</TableHead>
                    <TableHead>Projeto/Quadra/Lote</TableHead>
                    <TableHead>Assistente Social</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-sm">
                        {report.numero_registro || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="font-medium">{report.project_name}</div>
                          <div className="text-muted-foreground">
                            Quadra {report.quadra_name} - Lote {report.property_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>{report.nome_assistente_social}</div>
                          {report.cress_assistente_social && (
                            <div className="text-muted-foreground">
                              {report.cress_assistente_social}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {new Date(report.created_at || '').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExportPDF(report.id)}
                            className="gap-1"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(report)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setReportToDelete(report.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      {isFormOpen && (
        <SocialReportForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedReport(null)
          }}
          propertyId={selectedReport?.property_id || ''}
          quadraId={selectedReport?.quadra_id || ''}
          projectId={selectedReport?.project_id || ''}
          existingReport={selectedReport}
          onSuccess={loadReports}
          propertyName={selectedReport?.property_name}
          quadraName={selectedReport?.quadra_name}
          projectName={selectedReport?.project_name}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este parecer? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
