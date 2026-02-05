// components/ReportPDFModal.tsx - MODAL PARA GERAR PDF

import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Não tipar fixo, pois queremos todos os campos
type SurveyRecord = Record<string, any>;

interface ReportPDFModalProps {
  surveyId: string; // Mudei de surveyData para surveyId
  isOpen: boolean;
  onClose: () => void;
  onMarkPrinted: (id: string) => void;
}

const ReportPDFModal: React.FC<ReportPDFModalProps> = ({ 
  surveyId, 
  isOpen, 
  onClose, 
  onMarkPrinted 
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar todos os campos do registro na view vw_reurb_surveys_admin
  const fetchSurveyData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar direto do Supabase REST API
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mbcstctoikcnicmeyjgh.supabase.co';
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!SUPABASE_KEY) throw new Error('Chave do Supabase não configurada.');

      const url = `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Erro ao buscar dados do registro');
      const data = await response.json();
      if (!data || !data[0]) throw new Error('Registro não encontrado');
      setSurveyData(data[0]);
      return data[0];
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Não foi possível carregar os dados do registro');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!surveyData) {
      setError('Dados do registro não disponíveis');
      return;
    }
    setLoading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let y = 20;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO DE VISTORIA - REURB', 105, y, { align: 'center' });
      y += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('NEXTREURB - Sistema de Regularização Fundiária Urbana', 105, y, { align: 'center' });
      pdf.text('Governo do Estado do Amapá', 105, y + 6, { align: 'center' });
      y += 20;

      // Exibir todos os campos do registro
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS COMPLETOS DO REGISTRO', 20, y);
      y += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Montar tabela de campos
      const entries = Object.entries(surveyData);
      const tableRows = entries.map(([key, value]) => [key, value === null || value === undefined ? '' : String(value)]);
      // Se muitos campos, dividir em páginas
      (pdf as any).autoTable({
        head: [['Campo', 'Valor']],
        body: tableRows,
        startY: y,
        theme: 'grid',
        headStyles: { fillColor: [33, 150, 243] },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 },
        tableWidth: 170,
      });

      // Rodapé
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const horaAtual = new Date().toLocaleTimeString('pt-BR');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Documento gerado em: ${dataAtual} às ${horaAtual}`, 105, 280, { align: 'center' });
      pdf.text(`ID do registro: ${surveyData.id || ''}`, 105, 285, { align: 'center' });

      // Gerar URL do PDF
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfGenerated(true);
      onMarkPrinted(surveyData.id);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setError('Erro ao gerar o PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `RELATORIO_${surveyData?.formulario || surveyId}_${surveyData?.cpf || ''}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  useEffect(() => {
    if (isOpen && surveyId) {
      // Buscar dados sempre que o modal abrir com um novo ID
      if (!surveyData || surveyData.id !== surveyId) {
        fetchSurveyData(surveyId).then(data => {
          if (data && !pdfGenerated) {
            generatePDF();
          }
        });
      }
    }
    
    // Limpar URL ao fechar
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, surveyId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Relatório de Vistoria
              </h2>
              <p className="text-sm text-gray-600">
                Registro ID: {surveyId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 p-6 overflow-auto">
          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
                <p className="font-medium">Erro: {error}</p>
              </div>
              <button
                onClick={() => fetchSurveyData(surveyId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">
                {surveyData ? 'Gerando PDF...' : 'Carregando dados...'}
              </p>
            </div>
          ) : pdfUrl ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <div className="ml-auto text-sm text-gray-500 flex items-center">
                  <span className="bg-gray-100 px-3 py-1 rounded">
                    ID: {surveyId}
                  </span>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  title="Visualizador de PDF"
                  className="w-full h-[500px] border-0"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Pronto para gerar o PDF</p>
              <button
                onClick={generatePDF}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Gerar PDF
              </button>
            </div>
          )}
        </div>
        
        {/* Rodapé */}
        <div className="p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {surveyData ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(surveyData).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            ) : (
              <p>Carregando informações do registro...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;