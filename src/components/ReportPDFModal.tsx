// components/ReportPDFModal.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [pdfReady, setPdfReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Controle de estado de processamento
  const isProcessing = useRef(false);
  const lastProcessedId = useRef<string>('');

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return String(value);
  };

  // Função principal de processamento - memoizada para evitar recriações
  const processReport = useCallback(async (id: string) => {
    if (!id || isProcessing.current) return;
    
    try {
      isProcessing.current = true;
      setLoading(true);
      setError(null);
      setPdfReady(false);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Configurações do Supabase não encontradas.");
      }

      // 1. Buscar Dados - corrigido o campo "energy" para "energia"
      const query = `id=eq.${id}&select=projeto,quadra,lote,formulario,requerente,cpf,rg,estado_civil,profissao,renda_familiar,nis,endereco,conjuge,cpf_conjuge,num_moradores,num_filhos,filhos_menores,tempo_moradia,tipo_aquisicao,uso_imovel,construcao,telhado,piso,divisa,comodos,agua,energia,esgoto,pavimentacao,analise_ia,assinatura_vistoriador,assinatura_requerente`;
      
      const response = await fetch(`${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?${query}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Erro na base de dados: ${response.status}`);
      
      const data = await response.json();
      if (!data || data.length === 0) throw new Error("Registro não encontrado.");
      
      const record = data[0];

      // 2. Gerar PDF
      const pdf = new jsPDF();
      let y = 20;
      
      pdf.setFontSize(16);
      pdf.text('RELATÓRIO DE VISTORIA REURB', 105, y, { align: 'center' });
      
      y += 15;
      pdf.setFontSize(10);
      
      const addRow = (label: string, value: any, label2: string, value2: any) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 20, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(value), 50, y);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(label2, 110, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(value2), 140, y);
        y += 8;
      };

      addRow('Projeto:', record.projeto, 'Formulário:', record.formulario);
      addRow('Quadra:', record.quadra, 'Lote:', record.lote);
      addRow('Requerente:', record.requerente, 'CPF:', record.cpf);
      addRow('Endereço:', record.endereco, 'Renda:', record.renda_familiar);
      
      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Características do Imóvel:', 20, y);
      y += 8;
      
      addRow('Construção:', record.construcao, 'Telhado:', record.telhado);
      addRow('Piso:', record.piso, 'Divisa:', record.divisa);
      addRow('Água:', record.agua, 'Energia:', record.energia);
      
      if (record.analise_ia) {
        y += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Análise Técnica:', 20, y);
        y += 7;
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(record.analise_ia, 170);
        pdf.text(lines, 20, y);
      }

      // 3. Finalizar
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      setPdfReady(true);
      
      if (onMarkPrinted) onMarkPrinted(id);

    } catch (err: any) {
      console.error("Erro no processo:", err);
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  }, [onMarkPrinted]);

  // Efeito de controle principal
  useEffect(() => {
    if (isOpen && surveyId && surveyId !== lastProcessedId.current) {
      lastProcessedId.current = surveyId;
      processReport(surveyId);
    }

    return () => {
      // Cleanup quando o componente desmonta ou surveyId muda
      isProcessing.current = false;
    };
  }, [isOpen, surveyId, processReport]);

  // Cleanup específico para quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      lastProcessedId.current = '';
      isProcessing.current = false;
      
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
      setPdfReady(false);
      setError(null);
    }
  }, [isOpen, pdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Relatório de Vistoria</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 bg-gray-50 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
              <p>Carregando dados...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button 
                onClick={() => {
                  lastProcessedId.current = '';
                  processReport(surveyId);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : pdfReady && pdfUrl ? (
            <div className="h-full flex flex-col">
              <div className="p-2 bg-white border-b flex gap-2 justify-center">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = pdfUrl;
                    a.download = `Relatorio_${surveyId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700"
                >
                  <Download size={16} /> Baixar
                </button>
                <button 
                  onClick={() => iframeRef.current?.contentWindow?.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
                >
                  <Printer size={16} /> Imprimir
                </button>
              </div>
              <iframe 
                ref={iframeRef} 
                src={pdfUrl} 
                className="flex-1 w-full border-none" 
                title="Visualizador de PDF"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
              <p>Preparando relatório...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;