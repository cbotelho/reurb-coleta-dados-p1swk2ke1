import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '../components/ui/button';
import SurveyAdminGrid from '../components/SurveyAdminGrid';

interface SurveyAdmin {
  id: string;
  formulario: string;
  projeto: string;
  quadra: string;
  lote: string;
  requerente: string;
  cpf: string;
}

const ReportConfig: React.FC = () => {
  const [showGrid, setShowGrid] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyAdmin | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [printedIds, setPrintedIds] = useState<string[]>([]);

  const handleShowGrid = () => {
    setShowGrid(true);
  };

  const handleSelectSurvey = (surveyId: string) => {
    // Aqui você pode buscar os dados completos se necessário
    // Por enquanto, apenas marcamos como selecionado
    console.log('Survey selecionado:', surveyId);
  };

  const handleMarkPrinted = (id: string) => {
    setPrintedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleClosePdfModal = () => {
    setIsPdfModalOpen(false);
  };

  const handleCloseGrid = () => {
    setShowGrid(false);
    setSelectedSurvey(null);
    setIsPdfModalOpen(false);
  };

  return (
    <div className="p-6">
      {/* Outros conteúdos do ReportConfig... */}
      
      {/* Botão para mostrar a Grid - APENAS se não estiver mostrando */}
      {!showGrid ? (
        <Button 
          onClick={handleShowGrid} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Gerar PDF das Vistorias
        </Button>
      ) : (
        <div className="mt-6">
          {/* Botão para fechar a Grid */}
          <div className="mb-4">
            <Button 
              onClick={handleCloseGrid} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar para Configurações
            </Button>
          </div>
          
          {/* COMPONENTE GRID AQUI! */}
          <SurveyAdminGrid 
            onSelect={handleSelectSurvey}
            printedIds={printedIds}
          />
        </div>
      )}
      
    </div>
  );
};

export default ReportConfig;