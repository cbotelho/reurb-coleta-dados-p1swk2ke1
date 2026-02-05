// components/ReportPDFModal.tsx - VERSÃO MÍNIMA
import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';

interface ReportPDFModalProps {
  surveyId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReportPDFModal: React.FC<ReportPDFModalProps> = ({ 
  surveyId, 
  isOpen, 
  onClose 
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Efeito MÍNIMO - apenas para teste
  useEffect(() => {
    console.log('🟢 MODAL ABERTO com ID:', surveyId);
    
    if (!isOpen || !surveyId) return;

    // Simula um tempo de carregamento e cria um PDF simples
    const timer = setTimeout(() => {
      console.log('📄 Gerando PDF de teste...');
      
      // Cria um PDF de teste simples
      const pdfContent = `
        <html>
          <head>
            <title>Relatório Teste</title>
            <style>
              body { font-family: Arial; padding: 20px; }
              h1 { color: #333; }
              .info { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>RELATÓRIO DE TESTE</h1>
            <div class="info"><strong>ID da Vistoria:</strong> ${surveyId}</div>
            <div class="info"><strong>Data:</strong> ${new Date().toLocaleDateString()}</div>
            <div class="info"><strong>Este é um PDF de teste.</strong></div>
            <div class="info">O PDF real seria gerado com jsPDF.</div>
          </body>
        </html>
      `;
      
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      console.log('✅ PDF de teste criado, URL:', url);
      setPdfUrl(url);
      setLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, surveyId]);

  // Não renderiza se não está aberto
  if (!isOpen) {
    console.log('🔴 Modal não renderizado (isOpen=false)');
    return null;
  }

  console.log('🎨 Renderizando modal...');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        
        {/* Cabeçalho */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Relatório de Vistoria</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p>Carregando relatório...</p>
                <p className="text-sm text-gray-500 mt-1">ID: {surveyId}</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <>
              <div className="p-2 border-b flex gap-2">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = pdfUrl;
                    a.download = `Relatorio_${surveyId}.html`;
                    a.click();
                  }}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded flex items-center gap-1"
                >
                  <Download size={14} /> Baixar
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded flex items-center gap-1"
                >
                  <Printer size={14} /> Imprimir
                </button>
              </div>
              <iframe 
                src={pdfUrl} 
                className="flex-1 w-full border-0"
                title={`Relatório - ${surveyId}`}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p>Erro ao carregar relatório</p>
            </div>
          )}
        </div>

        {/* Debug info */}
        <div className="px-4 py-2 border-t text-xs text-gray-500">
          <div>Modal aberto: Sim | ID: {surveyId} | Carregando: {loading ? 'Sim' : 'Não'}</div>
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;