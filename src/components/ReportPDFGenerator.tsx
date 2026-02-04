// components/ReportPDFGenerator.tsx
import React, { useState, useEffect } from 'react';
import { X, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SurveyAdmin {
  id: string;
  formulario: string;
  projeto: string;
  quadra: string;
  lote: string;
  requerente: string;
  cpf: string;
}

interface ReportPDFGeneratorProps {
  surveyData: SurveyAdmin;
  isOpen: boolean;
  onClose: () => void;
  onMarkPrinted: (id: string) => void;
}

const ReportPDFGenerator: React.FC<ReportPDFGeneratorProps> = ({ 
  surveyData, 
  isOpen, 
  onClose, 
  onMarkPrinted 
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const generatePDF = async () => {
    if (!surveyData) return;
    
    setLoading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let y = 20;
      
      // Título
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO DE VISTORIA DETALHADO', 105, y, { align: 'center' });
      
      y += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema NEXTREURB - Governo do Estado do Amapá', 105, y, { align: 'center' });
      
      y += 15;
      
      // Linha divisória
      pdf.setLineWidth(0.5);
      pdf.line(20, y, 190, y);
      y += 10;
      
      // Dados do formulário
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. DADOS DO FORMULÁRIO', 20, y);
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const dados = [
        { label: 'ID do Registro:', value: surveyData.id },
        { label: 'Número do Formulário:', value: surveyData.formulario },
        { label: 'Projeto REURB:', value: surveyData.projeto },
        { label: 'Quadra:', value: surveyData.quadra },
        { label: 'Lote:', value: surveyData.lote },
        { label: 'Nome do Requerente:', value: surveyData.requerente },
        { label: 'CPF:', value: surveyData.cpf }
      ];
      
      dados.forEach((item, index) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.label}`, 20, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${item.value || 'N/A'}`, 70, y);
        y += 6;
        
        // Quebra de página se necessário
        if (y > 250 && index < dados.length - 1) {
          pdf.addPage();
          y = 20;
        }
      });
      
      y += 10;
      
      // Seção de observações/assinaturas
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. CONCLUSÃO E ASSINATURAS', 20, y);
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Vistoria realizada conforme normativas do REURB - Regularização Fundiária Urbana.', 20, y);
      y += 15;
      
      // Linha para assinatura do vistoriador
      pdf.line(20, y, 100, y);
      pdf.text('Assinatura do Vistoriador', 20, y + 5);
      
      pdf.line(110, y, 190, y);
      pdf.text('Assinatura do Responsável', 110, y + 5);
      
      y += 25;
      
      // Data e local
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const horaAtual = new Date().toLocaleTimeString('pt-BR');
      
      pdf.text(`Local: Governo do Estado do Amapá`, 20, y);
      pdf.text(`Data: ${dataAtual}`, 20, y + 6);
      pdf.text(`Hora: ${horaAtual}`, 20, y + 12);
      
      // Rodapé
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Documento gerado em: ${dataAtual} às ${horaAtual}`, 105, 280, { align: 'center' });
      pdf.text(`ID do documento: ${surveyData.id}`, 105, 285, { align: 'center' });
      
      // Gerar URL do PDF
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfGenerated(true);
      
      // Marcar como impresso
      onMarkPrinted(surveyData.id);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `RELATORIO_VISTORIA_${surveyData.formulario}_${surveyData.cpf}.pdf`;
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
    if (isOpen && surveyData && !pdfGenerated) {
      generatePDF();
    }
  }, [isOpen, surveyData]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Relatório de Vistoria - {surveyData.formulario}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Requerente: {surveyData.requerente} | CPF: {surveyData.cpf}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 overflow-hidden p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Gerando PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="h-full">
              <div className="flex items-center gap-4 mb-4">
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
                <span className="text-sm text-gray-500 ml-auto">
                  ID: {surveyData.id}
                </span>
              </div>
              
              <div className="border rounded-lg h-[calc(90vh-200px)]">
                <iframe
                  src={pdfUrl}
                  title="Visualizador de PDF"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Não foi possível gerar o PDF.</p>
            </div>
          )}
        </div>
        
        {/* Rodapé */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <span className="font-medium">Quadra:</span> {surveyData.quadra} | 
              <span className="font-medium ml-2">Lote:</span> {surveyData.lote}
            </div>
            <div>
              <span className="font-medium">Projeto:</span> {surveyData.projeto}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPDFGenerator;