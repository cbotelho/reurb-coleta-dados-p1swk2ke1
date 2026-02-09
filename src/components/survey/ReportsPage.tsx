// pages/ReportsPage.tsx ou no componente onde está o botão
import React, { useState } from 'react';
import SurveyAdminGrid from '../../components/SurveyAdminGrid';
import ReportPDFModal from '../../components/ReportPDFGenerator';
import { FileText } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const [showGrid, setShowGrid] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [printedIds, setPrintedIds] = useState<string[]>([]);

  const handleShowGrid = () => {
    setShowGrid(true);
  };

  const handleSelectSurvey = (surveyData: any) => {
    setSelectedSurvey(surveyData);
    setIsPdfModalOpen(true);
  };

  const handleMarkPrinted = (id: string) => {
    setPrintedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleClosePdfModal = () => {
    setIsPdfModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Botão para mostrar a Grid */}
        {!showGrid ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Gerar Relatórios de Vistorias
              </h1>
              <p className="text-gray-600 mb-6">
                Clique no botão abaixo para acessar a lista de vistorias e gerar relatórios em PDF
              </p>
            </div>
            
            <button
              onClick={handleShowGrid}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <FileText className="w-5 h-5" />
              Gerar PDF das Vistorias
            </button>
          </div>
        ) : (
          <>
            {/* Botão de voltar */}
            <div className="mb-4">
              <button
                onClick={() => setShowGrid(false)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← Voltar
              </button>
            </div>
            
            {/* Grid de Pesquisa */}
            <SurveyAdminGrid
              onSelect={handleSelectSurvey}
              printedIds={printedIds}
            />
          </>
        )}
        
        {/* Modal do PDF */}
        {selectedSurvey && (
          <ReportPDFModal
            surveyData={selectedSurvey}
            isOpen={isPdfModalOpen}
            onClose={handleClosePdfModal}
            onMarkPrinted={handleMarkPrinted}
          />
        )}
      </div>
    </div>
  );
};

export default ReportsPage;