// components/ReportPDFModal.tsx - MODAL PARA GERAR PDF
import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react'; // ADICIONEI FileText AQUI
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

interface ReportPDFModalProps {
  surveyData: SurveyAdmin;
  isOpen: boolean;
  onClose: () => void;
  onMarkPrinted: (id: string) => void;
}

const ReportPDFModal: React.FC<ReportPDFModalProps> = ({ 
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
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO DE VISTORIA - REURB', 105, y, { align: 'center' });
      
      y += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema de Regularização Fundiária Urbana', 105, y, { align: 'center' });
      pdf.text('Prefeitura Municipal', 105, y + 6, { align: 'center' });
      
      y += 20;
      
      // Informações do formulário
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO FORMULÁRIO', 20, y);
      y += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const dados = [
        `ID do Registro: ${surveyData.id}`,
        `Número do Formulário: ${surveyData.formulario}`,
        `Projeto REURB: ${surveyData.projeto}`,
        `Quadra: ${surveyData.quadra}`,
        `Lote: ${surveyData.lote}`,
        `Requerente: ${surveyData.requerente}`,
        `CPF: ${surveyData.cpf}`
      ];
      
      dados.forEach(item => {
        pdf.text(item, 25, y);
        y += 7;
      });
      
      y += 10;
      
      // Seção de observações
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMAÇÕES ADICIONAIS', 20, y);
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('A presente vistoria foi realizada de acordo com as normas estabelecidas', 20, y);
      y += 5;
      pdf.text('pelo Programa REURB - Regularização Fundiária Urbana.', 20, y);
      
      y += 15;
      
      // Assinaturas
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ASSINATURAS', 105, y, { align: 'center' });
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('_________________________________', 25, y);
      pdf.text('_________________________________', 110, y);
      y += 5;
      pdf.text('Vistoriador Responsável', 40, y);
      pdf.text('Coordenador REURB', 125, y);
      
      // Rodapé
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const horaAtual = new Date().toLocaleTimeString('pt-BR');
      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Documento gerado em: ${dataAtual} às ${horaAtual}`, 105, 280, { align: 'center' });
      pdf.text(`ID do registro: ${surveyData.id}`, 105, 285, { align: 'center' });
      
      // Gerar URL do PDF
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfGenerated(true);
      
      // Marcar como impresso
      onMarkPrinted(surveyData.id);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `RELATORIO_${surveyData.formulario}_${surveyData.cpf}.pdf`;
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
    
    // Limpar URL ao fechar
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, surveyData]);

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
                Formulário: {surveyData.formulario}
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
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Gerando PDF...</p>
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
                    ID: {surveyData.id}
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
              <p className="text-gray-600">Erro ao gerar o PDF.</p>
              <button
                onClick={generatePDF}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
        
        {/* Rodapé */}
        <div className="p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Requerente:</span> {surveyData.requerente}
              </div>
              <div>
                <span className="font-medium">CPF:</span> {surveyData.cpf}
              </div>
              <div>
                <span className="font-medium">Quadra/Lote:</span> {surveyData.quadra} / {surveyData.lote}
              </div>
              <div>
                <span className="font-medium">Projeto:</span> {surveyData.projeto}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;