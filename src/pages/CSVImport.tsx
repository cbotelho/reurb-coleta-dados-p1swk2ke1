import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Download, FileText, Database, ArrowRight, Shield, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface CSVRow {
  [key: string]: string
}

interface TableColumn {
  name: string
  type: string
  nullable: boolean
}

interface FieldMapping {
  csvColumn: string
  tableField: string
}

const CSVImport: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Verificar se é administrador - ACESSO TEMPORÁRIO PARA TESTE
  const isAdmin = true // Temporariamente habilitado para todos
  
  // Redirecionar se não for administrador
  React.useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Esta ferramenta é exclusiva para administradores.')
      navigate('/dashboard')
    }
  }, [isAdmin, navigate])
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Acesso Restrito
            </CardTitle>
            <CardDescription>
              Esta ferramenta é exclusiva para administradores do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-red-700">
                Você não tem permissão para acessar esta página.
              </span>
            </div>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="mt-4"
              variant="outline"
            >
              Voltar para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([])
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string>('')

  // Tabelas disponíveis para importação
  const availableTables = [
    { value: 'reurb_projects', label: 'Projetos' },
    { value: 'reurb_quadras', label: 'Quadras' },
    { value: 'reurb_properties', label: 'Lotes/Propriedades' }
  ]

  // Estrutura das colunas por tabela
  const tableStructures: Record<string, TableColumn[]> = {
    reurb_projects: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'name', type: 'text', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'latitude', type: 'numeric', nullable: true },
      { name: 'longitude', type: 'numeric', nullable: true },
      { name: 'image_url', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamp', nullable: false },
      { name: 'updated_at', type: 'timestamp', nullable: false },
      { name: 'created_by', type: 'integer', nullable: true },
      { name: 'city', type: 'text', nullable: true },
      { name: 'state', type: 'text', nullable: true },
      { name: 'status', type: 'text', nullable: true },
      { name: 'auto_update_map', type: 'boolean', nullable: true },
      { name: 'last_map_update', type: 'timestamp', nullable: true },
      { name: 'tags', type: 'array', nullable: true }
    ],
    reurb_quadras: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'name', type: 'text', nullable: false },
      { name: 'area', type: 'numeric', nullable: true },
      { name: 'description', type: 'text', nullable: true },
      { name: 'parent_item_id', type: 'uuid', nullable: true },
      { name: 'document_url', type: 'text', nullable: true },
      { name: 'sync_status', type: 'text', nullable: false },
      { name: 'date_added', type: 'bigint', nullable: false },
      { name: 'date_updated', type: 'bigint', nullable: false }
    ],
    reurb_properties: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'local_id', type: 'text', nullable: false },
      { name: 'sync_status', type: 'text', nullable: false },
      { name: 'date_added', type: 'bigint', nullable: false },
      { name: 'date_updated', type: 'bigint', nullable: false },
      { name: 'name', type: 'text', nullable: true },
      { name: 'address', type: 'text', nullable: true },
      { name: 'area', type: 'numeric', nullable: true },
      { name: 'description', type: 'text', nullable: true },
      { name: 'images', type: 'array', nullable: true },
      { name: 'latitude', type: 'numeric', nullable: true },
      { name: 'longitude', type: 'numeric', nullable: true },
      { name: 'parent_item_id', type: 'uuid', nullable: true },
      { name: 'status', type: 'text', nullable: true }
    ]
  }

  // Parse CSV
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: CSVRow = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      return row
    })

    setCsvHeaders(headers)
    return rows
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const data = parseCSV(text)
      setCsvData(data)
      toast.success(`Arquivo ${file.name} carregado com ${data.length} registros`)
    }
    reader.readAsText(file)
  }

  // Handle table selection
  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName)
    setTableColumns(tableStructures[tableName] || [])
    
    // Initialize mappings
    const initialMappings: FieldMapping[] = csvHeaders.map(header => ({
      csvColumn: header,
      tableField: ''
    }))
    setFieldMappings(initialMappings)
  }

  // Update field mapping
  const updateFieldMapping = (csvColumn: string, tableField: string) => {
    setFieldMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, tableField }
          : mapping
      )
    )
  }

  // Generate SQL INSERT statements
  const generateSQL = useCallback(() => {
    if (!selectedTable || fieldMappings.length === 0) return ''

    const validMappings = fieldMappings.filter(m => m.tableField)
    if (validMappings.length === 0) {
      toast.error('Nenhum campo mapeado')
      return ''
    }

    const fields = validMappings.map(m => m.tableField).join(', ')
    const values = csvData.map(row => {
      const rowValues = validMappings.map(mapping => {
        const value = row[mapping.csvColumn]
        const column = tableColumns.find(c => c.name === mapping.tableField)
        
        if (!value || value === '') {
          return column?.nullable ? 'NULL' : "''"
        }

        // Handle different data types
        if (column?.type === 'text' || column?.type === 'uuid') {
          return `'${value.replace(/'/g, "''")}'`
        } else if (column?.type === 'numeric') {
          return value
        } else if (column?.type === 'boolean') {
          return value.toLowerCase() === 'true' ? 'true' : 'false'
        } else if (column?.type === 'array') {
          return `ARRAY[${value.split(';').map(v => `'${v.trim()}'`).join(', ')}]`
        } else if (column?.type === 'bigint') {
          return value
        } else if (column?.type === 'timestamp') {
          return `'${value}'`
        }
        
        return `'${value}'`
      })
      return `(${rowValues.join(', ')})`
    }).join(',\n')

    return `INSERT INTO ${selectedTable} (${fields})\nVALUES\n${values};`
  }, [selectedTable, fieldMappings, csvData, tableColumns])

  // Execute SQL
  const executeImport = async () => {
    const sql = generateSQL()
    if (!sql) return

    setIsLoading(true)
    try {
      // Por enquanto, apenas faz o download do SQL
      // O usuário pode executar manualmente no Supabase
      downloadSQL()
      toast.success('SQL gerado com sucesso! Execute manualmente no Supabase.')
    } catch (error: any) {
      toast.error('Erro na geração do SQL: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Download SQL
  const downloadSQL = () => {
    const sql = generateSQL()
    if (!sql) return

    const blob = new Blob([sql], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import_${selectedTable}_${Date.now()}.sql`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Importação de Dados CSV</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload do Arquivo
            </CardTitle>
            <CardDescription>
              Selecione um arquivo CSV para importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Arquivo CSV</Label>
              <Input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>

            {fileName && (
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">{fileName}</span>
                <Badge variant="secondary">
                  {csvData.length} registros
                </Badge>
              </div>
            )}

            <div>
              <Label htmlFor="table-select">Tabela de Destino</Label>
              <Select value={selectedTable} onValueChange={handleTableChange}>
                <SelectTrigger className="mt-1" id="table-select">
                  <SelectValue placeholder="Selecione a tabela..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map(table => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTable && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Estrutura da Tabela</div>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {tableColumns.map(column => (
                    <div key={column.name} className="text-xs py-1">
                      <span className="font-mono">{column.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {column.type}
                      </Badge>
                      {!column.nullable && (
                        <Badge variant="destructive" className="ml-1 text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapping Section */}
        {csvData.length > 0 && selectedTable && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Mapeamento de Campos
              </CardTitle>
              <CardDescription>
                Mapeie as colunas do CSV para os campos da tabela
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {csvHeaders.map(header => (
                  <div key={header} className="flex items-center space-x-2">
                    <Label className="w-1/3 text-sm font-mono">{header}</Label>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Select 
                      value={fieldMappings.find(m => m.csvColumn === header)?.tableField || ''}
                      onValueChange={(value) => updateFieldMapping(header, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione o campo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ignorar coluna</SelectItem>
                        {tableColumns.map(column => (
                          <SelectItem key={column.name} value={column.name}>
                            {column.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <Button 
                  onClick={downloadSQL}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar SQL Gerado
                </Button>
                
                <Button 
                  onClick={executeImport}
                  disabled={isLoading || fieldMappings.filter(m => m.tableField).length === 0}
                  className="w-full"
                >
                  {isLoading ? 'Gerando...' : 'Gerar SQL para Execução Manual'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Section */}
      {csvData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Visualização dos Dados</CardTitle>
            <CardDescription>
              Primeiros 10 registros do arquivo CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-50">
                    {csvHeaders.map(header => (
                      <th key={header} className="border p-2 text-left text-xs font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {csvHeaders.map(header => (
                        <td key={header} className="border p-2 text-xs">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CSVImport
