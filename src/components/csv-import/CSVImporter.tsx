import React, { useState, useCallback } from 'react';
import { CSVImportService } from '@/services/csvImportService';
import { TableColumn, ColumnMapping, ImportResult, CSVImportConfig, ParsedCSVData } from '@/types/csv-import.types';
import { ProjectService, Project } from '@/services/projectService';
import { QuadraService, Quadra } from '@/services/quadraService';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  ArrowRight, 
  Database, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Building,
  Map
} from 'lucide-react';
import { toast } from 'sonner';

interface CSVImporterProps {
  tableName: 'reurb_quadras' | 'reurb_properties' | 'reurb_surveys';
  onImportComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
}

export function CSVImporter({ tableName, onImportComplete, onCancel }: CSVImporterProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload');
  const [csvData, setCsvData] = useState<ParsedCSVData | null>(null);
  const [dbColumns, setDbColumns] = useState<TableColumn[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [canImport, setCanImport] = useState<boolean | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [selectedQuadra, setSelectedQuadra] = useState<string>('');
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');

  // Verificar permissões ao montar
  React.useEffect(() => {
    const checkPermissions = async () => {
      try {
        const hasPermission = await CSVImportService.canImport(tableName);
        setCanImport(hasPermission);
        
        if (!hasPermission) {
          toast.error('Você não tem permissão para importar dados nesta tabela');
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        setCanImport(false);
      }
    };
    checkPermissions();
  }, [tableName]);

  // Carregar colunas da tabela ao montar o componente
  React.useEffect(() => {
    const loadColumns = async () => {
      try {
        const columns = await CSVImportService.getTableColumns(tableName);
        setDbColumns(columns);
      } catch (error) {
        toast.error('Erro ao carregar colunas da tabela');
        console.error(error);
      }
    };
    loadColumns();
  }, [tableName]);

  // Carregar projetos quando for importar quadras, lotes ou vistorias
  React.useEffect(() => {
    if (tableName === 'reurb_quadras' || tableName === 'reurb_properties' || tableName === 'reurb_surveys') {
      const loadProjects = async () => {
        try {
          console.log('Carregando projetos para:', tableName);
          const projectsList = await ProjectService.getProjects();
          console.log('Projetos carregados:', projectsList);
          setProjects(projectsList);
        } catch (error) {
          toast.error('Erro ao carregar projetos');
          console.error('Erro ao carregar projetos:', error);
        }
      };
      loadProjects();
    }
  }, [tableName]);

  // Carregar quadras quando projeto for selecionado (para lotes e vistorias)
  React.useEffect(() => {
    if ((tableName === 'reurb_properties' || tableName === 'reurb_surveys') && selectedProject) {
      const loadQuadras = async () => {
        try {
          console.log('Carregando quadras para o projeto:', selectedProject);
          const quadrasList = await QuadraService.getQuadrasByProject(selectedProject);
          console.log('Quadras carregadas:', quadrasList);
          setQuadras(quadrasList);
        } catch (error) {
          toast.error('Erro ao carregar quadras do projeto');
          console.error('Erro ao carregar quadras:', error);
        }
      };
      loadQuadras();
    }
  }, [tableName, selectedProject]);

  // Limpar quadra selecionada quando mudar o projeto
  React.useEffect(() => {
    if (tableName === 'reurb_properties' || tableName === 'reurb_surveys') {
      setSelectedQuadra('');
    }
  }, [selectedProject, tableName]);

  // Carregar lotes quando quadra for selecionada (para vistorias)
  React.useEffect(() => {
    if (tableName === 'reurb_surveys' && selectedQuadra) {
      const loadProperties = async () => {
        try {
          console.log('Carregando lotes para a quadra:', selectedQuadra);
          const { data, error } = await supabase
            .from('reurb_properties')
            .select('id, name')
            .eq('quadra_id', selectedQuadra)
            .order('name');
          
          if (error) throw error;
          console.log('Lotes carregados:', data);
          setProperties(data || []);
        } catch (error) {
          toast.error('Erro ao carregar lotes da quadra');
          console.error('Erro ao carregar lotes:', error);
        }
      };
      loadProperties();
    }
  }, [tableName, selectedQuadra]);

  // Limpar lote selecionado quando mudar a quadra
  React.useEffect(() => {
    if (tableName === 'reurb_surveys') {
      setSelectedProperty('');
    }
  }, [selectedQuadra, tableName]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setLoading(true);
    try {
      const parsed = await CSVImportService.parseCSV(file);
      setCsvData(parsed);
      setStep('mapping');
      toast.success(`Arquivo carregado: ${parsed.totalRows} linhas encontradas`);
    } catch (error) {
      toast.error('Erro ao ler arquivo CSV');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle mapping change
  const handleMappingChange = useCallback((csvColumn: string, dbColumn: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      if (dbColumn === '__skip__') {
        delete newMapping[csvColumn];
      } else {
        newMapping[csvColumn] = dbColumn;
      }
      return newMapping;
    });
  }, []);

  // Validate mapping
  const validateMapping = useCallback(() => {
    if (!csvData) return false;

    // Para quadras, verificar se projeto foi selecionado
    if (tableName === 'reurb_quadras' && !selectedProject) {
      return false;
    }

    // Para lotes, verificar se projeto e quadra foram selecionados
    if (tableName === 'reurb_properties' && (!selectedProject || !selectedQuadra)) {
      return false;
    }

    // Para vistorias, verificar se projeto, quadra e lote foram selecionados
    if (tableName === 'reurb_surveys' && (!selectedProject || !selectedQuadra || !selectedProperty)) {
      return false;
    }

    // Colunas obrigatórias baseadas na estrutura real das tabelas
    const requiredColumns = {
      reurb_quadras: ['name'], // name é NOT NULL, project_id será adicionado automaticamente
      reurb_properties: ['name'], // name é NOT NULL, quadra_id será adicionado automaticamente
      reurb_surveys: [] // property_id será adicionado automaticamente
    };

    const required = requiredColumns[tableName] || [];
    const mapped = Object.values(mapping).filter(value => value && value !== '__skip__');

    return required.every(col => mapped.includes(col));
  }, [csvData, mapping, tableName, selectedProject, selectedQuadra, selectedProperty]);

  // Start import
  const handleImport = useCallback(async () => {
    if (!csvData || !validateMapping()) {
      toast.error('Mapeamento inválido ou incompleto');
      return;
    }

    // Verificar se projeto foi selecionado para quadras
    if (tableName === 'reurb_quadras' && !selectedProject) {
      toast.error('Selecione um projeto para importar as quadras');
      return;
    }

    // Verificar se projeto e quadra foram selecionados para lotes
    if (tableName === 'reurb_properties' && (!selectedProject || !selectedQuadra)) {
      toast.error('Selecione um projeto e uma quadra para importar os lotes');
      return;
    }

    // Verificar se projeto, quadra e lote foram selecionados para vistorias
    if (tableName === 'reurb_surveys' && (!selectedProject || !selectedQuadra || !selectedProperty)) {
      toast.error('Selecione um projeto, uma quadra e um lote para importar as vistorias');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    try {
      // Transformar dados
      const transformedData = CSVImportService.transformData(csvData.data, mapping, dbColumns);

      // Adicionar IDs automaticamente
      const finalData = transformedData.map(row => {
        if (tableName === 'reurb_quadras') {
          return {
            ...row,
            project_id: selectedProject
          };
        } else if (tableName === 'reurb_properties') {
          return {
            ...row,
            quadra_id: selectedQuadra
          };
        } else if (tableName === 'reurb_surveys') {
          return {
            ...row,
            property_id: selectedProperty
          };
        }
        return row;
      });

      // Configurar importação
      const config: CSVImportConfig = {
        tableName,
        batchSize: 500,
        conflictColumn: undefined, // Removido para evitar erro de constraint
        skipDuplicates: false
      };

      // Importar dados
      const result = await CSVImportService.importData(
        config,
        finalData,
        (progress) => setImportProgress(progress)
      );

      setImportResult(result);
      setStep('complete');
      
      if (result.success) {
        toast.success(`Importação concluída: ${result.importedRows} registros`);
      } else {
        toast.error(`Importação com erros: ${result.errors.length} problemas`);
      }

      onImportComplete?.(result);

    } catch (error) {
      toast.error('Erro durante a importação');
      console.error(error);
      setStep('mapping');
    }
  }, [csvData, mapping, dbColumns, tableName, selectedProject, selectedQuadra, validateMapping, onImportComplete]);

  // Reset
  const handleReset = useCallback(() => {
    setStep('upload');
    setCsvData(null);
    setMapping({});
    setImportProgress(0);
    setImportResult(null);
  }, []);

  const getTableDisplayName = () => {
    return tableName === 'reurb_quadras' ? 'Quadras' : 'Lotes/Propriedades';
  };

  // Loading state
  if (canImport === null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // No permission state
  if (canImport === false) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para importar dados na tabela {getTableDisplayName()}.
            </p>
            {onCancel && (
              <Button onClick={onCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Importação de Dados CSV</h1>
            <div className="text-muted-foreground">
              Importar dados para a tabela: <Badge variant="secondary">{getTableDisplayName()}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              1. Upload do Arquivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Selecione o arquivo CSV</p>
                <p className="text-sm text-muted-foreground">
                  O arquivo deve conter os dados que deseja importar
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="mt-4 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Processando arquivo...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && csvData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              2. Mapeamento de Colunas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seletores para Quadras */}
            {tableName === 'reurb_quadras' && (
              <Alert>
                <Building className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium">Selecione o projeto para importar as quadras:</p>
                    <Select
                      value={selectedProject}
                      onValueChange={setSelectedProject}
                    >
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Selecione um projeto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                            {project.status && (
                              <Badge variant="outline" className="ml-2">
                                {project.status}
                              </Badge>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProject && (
                      <p className="text-sm text-green-600">
                        ✓ Projeto selecionado: {projects.find(p => p.id === selectedProject)?.name}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Seletores para Lotes */}
            {tableName === 'reurb_properties' && (
              <Alert>
                <Map className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">1. Selecione o projeto:</p>
                      <Select
                        value={selectedProject}
                        onValueChange={setSelectedProject}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Selecione um projeto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                              {project.status && (
                                <Badge variant="outline" className="ml-2">
                                  {project.status}
                                </Badge>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedProject && (
                      <div>
                        <p className="font-medium">2. Selecione a quadra:</p>
                        <Select
                          value={selectedQuadra}
                          onValueChange={setSelectedQuadra}
                        >
                          <SelectTrigger className="w-full max-w-md">
                            <SelectValue placeholder="Selecione uma quadra..." />
                          </SelectTrigger>
                          <SelectContent>
                            {quadras.map((quadra) => (
                              <SelectItem key={quadra.id} value={quadra.id}>
                                {quadra.name}
                                {quadra.area && (
                                  <Badge variant="outline" className="ml-2">
                                    {quadra.area}m²
                                  </Badge>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedQuadra && (
                          <p className="text-sm text-green-600">
                            ✓ Quadra selecionada: {quadras.find(q => q.id === selectedQuadra)?.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Seletores para Vistorias */}
            {tableName === 'reurb_surveys' && (
              <Alert>
                <Map className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">1. Selecione o projeto:</p>
                      <Select
                        value={selectedProject}
                        onValueChange={setSelectedProject}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Selecione um projeto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                              {project.status && (
                                <Badge variant="outline" className="ml-2">
                                  {project.status}
                                </Badge>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedProject && (
                      <div>
                        <p className="font-medium">2. Selecione a quadra:</p>
                        <Select
                          value={selectedQuadra}
                          onValueChange={setSelectedQuadra}
                        >
                          <SelectTrigger className="w-full max-w-md">
                            <SelectValue placeholder="Selecione uma quadra..." />
                          </SelectTrigger>
                          <SelectContent>
                            {quadras.map((quadra) => (
                              <SelectItem key={quadra.id} value={quadra.id}>
                                {quadra.name}
                                {quadra.area && (
                                  <Badge variant="outline" className="ml-2">
                                    {quadra.area}m²
                                  </Badge>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedQuadra && (
                      <div>
                        <p className="font-medium">3. Selecione o lote:</p>
                        <Select
                          value={selectedProperty}
                          onValueChange={setSelectedProperty}
                        >
                          <SelectTrigger className="w-full max-w-md">
                            <SelectValue placeholder="Selecione um lote..." />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedProperty && (
                          <p className="text-sm text-green-600">
                            ✓ Lote selecionado: {properties.find(p => p.id === selectedProperty)?.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Encontradas {csvData.totalRows} linhas no CSV com {csvData.headers.length} colunas.
                Mapeie as colunas do arquivo para os campos da tabela {getTableDisplayName()}.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {csvData.headers.map((header, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      Coluna CSV
                    </label>
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                      {header}
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      Campo da Tabela
                    </label>
                    <Select
                      value={mapping[header] || '__skip__'}
                      onValueChange={(value) => handleMappingChange(header, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o campo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__">Pular coluna</SelectItem>
                        {dbColumns.map((col) => (
                          <SelectItem key={col.column_name} value={col.column_name}>
                            {col.column_name} ({col.data_type})
                            {col.is_nullable === 'NO' && ' *'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                * Campos obrigatórios
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset}>
                  Reiniciar
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!validateMapping()}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Iniciar Importação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              3. Importando Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-lg">Importando dados para {getTableDisplayName()}...</p>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {Math.round(importProgress)}% concluído
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Importação Concluída
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.totalRows}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Linhas
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.importedRows}
                </div>
                <div className="text-sm text-muted-foreground">
                  Importadas
                </div>
              </div>
              {importResult.duplicates !== undefined && (
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.duplicates}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Duplicatas
                  </div>
                </div>
              )}
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.errors.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Erros
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Erros encontrados:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                Importar Outro Arquivo
              </Button>
              {onCancel && (
                <Button onClick={onCancel}>
                  Concluir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
