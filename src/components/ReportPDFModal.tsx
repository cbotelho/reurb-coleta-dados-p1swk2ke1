// components/ReportPDFModal.tsx - VERSÃO SIMPLES SEM LOOPS
import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText, AlertCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReportPDFModalProps {
  surveyId: string;
  isOpen: boolean;
  onClose: () => void;
  onMarkPrinted?: (id: string) => void;
}

const ReportPDFModal: React.FC<ReportPDFModalProps> = ({ 
  surveyId, 
  isOpen, 
  onClose, 
  onMarkPrinted 
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 FUNÇÃO ÚNICA para buscar dados e gerar PDF
  const generateReport = async (id: string) => {
    if (!id) {
      setError('ID não fornecido');
      return;
    }

    try {
      console.log('🔄 Iniciando geração para ID:', id);
      setLoading(true);
      setError(null);
      setPdfUrl('');

      // 1. BUSCAR DADOS
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Configurações não encontradas");
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?id=eq.${id}`, 
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error("Registro não encontrado");
      }

      const record = data[0];
      console.log('✅ Dados recebidos:', record);

      // 2. GERAR PDF
      const pdf = new jsPDF();
      
      // CABEÇALHO
      pdf.setFontSize(16);
      pdf.text('RELATÓRIO DE VISTORIA REURB', 105, 20, { align: 'center' });
      
      // DADOS BÁSICOS
      pdf.setFontSize(10);
      let y = 40;
      
      const addField = (label: string, value: any, x: number) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${label}:`, x, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(value || 'N/A'), x + 30, y);
      };

      addField('Projeto', record.projeto, 20);
      addField('Quadra', record.quadra, 20);
      addField('Lote', record.lote, 20);
      addField('Requerente', record.requerente, 20);
      addField('CPF', record.cpf, 20);
      
      y += 20;
      addField('Endereço', record.endereco, 20);
      addField('Renda', record.renda_familiar, 20);

      // 3. CRIAR URL DO PDF
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      
      // 4. MARCAR COMO IMPRESSO
      if (onMarkPrinted) {
        onMarkPrinted(id);
      }

      console.log('✅ PDF gerado com sucesso!');

    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 EFEITO ÚNICO E SIMPLES
  useEffect(() => {
    if (isOpen && surveyId) {
      // Gera o PDF quando o modal abre
      generateReport(surveyId);
    } else {
      // Limpa tudo quando o modal fecha
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
      setError(null);
      setLoading(false);
    }
  }, [isOpen, surveyId]); // 🔥 Apenas estas dependências

  // Não renderizar se não está aberto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Relatório de Vistoria</h2>
            <span className="text-sm text-gray-500">ID: {surveyId}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 flex flex-col">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p>Gerando relatório...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-red-600 font-medium mb-2">Erro</p>
              <p className="text-gray-600 text-center mb-4">{error}</p>
              <button 
                onClick={() => generateReport(surveyId)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <>
              {/* BOTÕES */}
              <div className="p-3 border-b flex gap-2 justify-center bg-gray-50">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `vistoria_${surveyId}.pdf`;
                    link.click();
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm"
                >
                  <Download size={16} />
                  Baixar
                </button>
                <button 
                  onClick={() => window.open(pdfUrl)?.print()}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
              </div>

              {/* PDF */}
              <iframe 
                src={pdfUrl}
                className="flex-1 w-full border-0"
                title={`Relatório ${surveyId}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;
