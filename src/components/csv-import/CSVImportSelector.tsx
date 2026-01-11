import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowLeft } from 'lucide-react';
import { CSVImporter } from './CSVImporter';

interface CSVImportSelectorProps {
  onCancel: () => void;
}

export function CSVImportSelector({ onCancel }: CSVImportSelectorProps) {
  const [importType, setImportType] = React.useState<'quadras' | 'properties' | 'surveys' | null>(null);

  if (importType) {
    return (
      <CSVImporter
        tableName={
          importType === 'quadras' 
            ? 'reurb_quadras' 
            : importType === 'surveys'
            ? 'reurb_surveys'
            : 'reurb_properties'
        }
        onImportComplete={(result) => {
          console.log('Importação concluída:', result);
          setImportType(null);
        }}
        onCancel={() => setImportType(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Importação de Dados CSV</h2>
          <p className="text-muted-foreground">
            Selecione o tipo de dado que deseja importar para o sistema REURB.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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
                  <li>area</li>
                  <li>description</li>
                  <li>status</li>
                  <li>document_url</li>
                  <li>image_url</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  ⚠️ O projeto será selecionado na próxima tela
                </p>
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
                <p className="text-xs text-green-600 mt-2 font-medium">
                  ⚠️ Projeto e Quadra serão selecionados na próxima tela
                </p>
              </div>
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Importar Lotes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => setImportType('surveys')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importar Vistorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Importar dados de vistorias vinculadas a lotes específicos.
              </p>
              <div className="text-xs bg-purple-50 p-3 rounded">
                <p className="font-medium mb-1">Campos esperados:</p>
                <ul className="list-disc list-inside space-y-1 text-purple-700">
                  <li>tipo_imovel</li>
                  <li>situacao_ocupacao</li>
                  <li>tempo_moradia</li>
                  <li>possui_documento_posse</li>
                  <li>tipo_uso</li>
                  <li>area_construida_vistoria</li>
                  <li>numero_comodos</li>
                  <li>tipo_construcao</li>
                  <li>possui_agua_encanada</li>
                  <li>possui_energia_eletrica</li>
                  <li>possui_esgoto</li>
                  <li>observacoes</li>
                </ul>
                <p className="text-xs text-purple-600 mt-2 font-medium">
                  ⚠️ Projeto, Quadra e Lote serão selecionados na próxima tela
                </p>
              </div>
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Importar Vistorias
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
