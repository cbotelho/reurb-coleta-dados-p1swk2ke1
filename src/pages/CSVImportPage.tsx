import React, { useState } from 'react';
import { CSVImporter } from '@/components/csv-import/CSVImporter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowLeft } from 'lucide-react';
import { ImportResult } from '@/types/csv-import.types';

export default function CSVImportPage() {
  const [importType, setImportType] = useState<'quadras' | 'properties' | null>(null);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const handleImportComplete = (result: ImportResult) => {
    setLastResult(result);
  };

  const handleBack = () => {
    setImportType(null);
  };

  if (importType) {
    return (
      <CSVImporter
        tableName={importType === 'quadras' ? 'reurb_quadras' : 'reurb_properties'}
        onImportComplete={handleImportComplete}
        onCancel={handleBack}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Importação de Dados</h1>
        <p className="text-muted-foreground">
          Selecione o tipo de dado que deseja importar para o sistema REURB.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => setImportType('quadras')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importar Quadras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Importar dados de quadras para projetos existentes.
              </p>
              <div className="text-xs bg-blue-50 p-3 rounded">
                <p className="font-medium mb-1">Campos esperados:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>name (obrigatório)</li>
                  <li>project_id</li>
                  <li>area</li>
                  <li>description</li>
                  <li>status</li>
                  <li>document_url</li>
                  <li>image_url</li>
                </ul>
              </div>
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Importar Quadras
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => setImportType('properties')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importar Lotes/Propriedades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Importar dados de lotes e propriedades individuais.
              </p>
              <div className="text-xs bg-green-50 p-3 rounded">
                <p className="font-medium mb-1">Campos esperados:</p>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>name (obrigatório)</li>
                  <li>quadra_id</li>
                  <li>address</li>
                  <li>area</li>
                  <li>area_terreno</li>
                  <li>area_construida</li>
                  <li>latitude</li>
                  <li>longitude</li>
                  <li>status</li>
                  <li>tipo_posse</li>
                  <li>situacao_fundiaria</li>
                  <li>matricula_imovel</li>
                  <li>data_ocupacao</li>
                  <li>possui_conflito</li>
                </ul>
              </div>
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Importar Lotes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Última Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded">
                <div className="text-lg font-bold">{lastResult.totalRows}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-lg font-bold text-green-600">{lastResult.importedRows}</div>
                <div className="text-xs text-muted-foreground">Importados</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-lg font-bold text-yellow-600">{lastResult.duplicates || 0}</div>
                <div className="text-xs text-muted-foreground">Duplicatas</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-lg font-bold text-red-600">{lastResult.errors.length}</div>
                <div className="text-xs text-muted-foreground">Erros</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
