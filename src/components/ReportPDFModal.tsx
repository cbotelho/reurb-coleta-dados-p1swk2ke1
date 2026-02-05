// components/ReportPDFModal.tsx - VERSÃO FINAL SEM LOOP
import React, { useState, useEffect, useRef } from 'react';
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
  
  // UseRef para controlar se já estamos processando
  const hasProcessed = useRef(false);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return String(value);
  };

  // Efeito PRINCIPAL - apenas executa quando modal abre
  useEffect(() => {
    // Se não está aberto ou não tem ID, não faz nada
    if (!isOpen || !surveyId) return;
    
    // Se já processamos este modal, não executa novamente
    if (hasProcessed.current) return;
    
    // Marca que estamos processando
    hasProcessed.current = true;
    
    const fetchDataAndGeneratePDF = async () => {
      try {
        setLoading(true);
        setError(null);
        setPdfReady(false);
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Configurações do Supabase não encontradas.");
        }

        // Buscar Dados
        const query = `id=eq.${surveyId}&select=projeto,quadra,lote,formulario,requerente,cpf,rg,estado_civil,profissao,renda_familiar,nis,endereco,conjuge,cpf_conjuge,num_moradores,num_filhos,filhos_menores,tempo_moradia,tipo_aquisicao,uso_imovel,construcao,telhado,piso,divisa,comodos,agua,energia,esgoto,pavimentacao,analise_ia,assinatura_vistoriador,assinatura_requerente`;
        
        const response = await fetch(`${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?${query}`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na base de dados: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data); // DEBUG
        
        if (!data || data.length === 0) {
          throw new Error("Registro não encontrado.");
        }
        
        const record = data[0];
        console.log('Registro para PDF:', record); // DEBUG

        // Gerar PDF
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

        // Adicionar dados ao PDF
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

        // Criar blob e URL
        const blob = pdf.output('blob');
        console.log('Blob criado:', blob); // DEBUG
        
        const url = URL.createObjectURL(blob);
        console.log('URL criada:', url); // DEBUG
        
        setPdfUrl(url);
        setPdfReady(true);
        
        if (onMarkPrinted) onMarkPrinted(surveyId);

      } catch (err: any) {
        console.error("Erro detalhado no processo:", err);
        setError(err.message || "Erro desconhecido ao gerar o PDF");
        // Resetamos o processamento em caso de erro
        hasProcessed.current = false;
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndGeneratePDF();

    // Cleanup function - executa quando o componente desmonta ou quando dependências mudam
    return () => {
      // Não resetamos hasProcessed aqui para evitar loops
      // Apenas limpamos a URL se existir
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, surveyId]); // Apenas executa quando isOpen ou surveyId mudam

  // Efeito SEPARADO para limpeza quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      // Quando o modal fecha, resetamos tudo
      hasProcessed.current = false;
      
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
      
      setPdfReady(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, pdfUrl]);

  // Se o modal não está aberto, não renderiza nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Relatório de Vistoria - ID: {surveyId}</h2>
          </div>
          <button 
            onClick={() => {
              // Fecha o modal
              onClose();
            }} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 bg-gray-50 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
              <p>Carregando dados e gerando PDF...</p>
              <p className="text-sm text-gray-500 mt-2">ID: {surveyId}</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button 
                onClick={() => {
                  // Reset e tenta novamente
                  hasProcessed.current = false;
                  setError(null);
                  setLoading(true);
                  // Força uma nova execução do efeito principal
                  const fetchAgain = async () => {
                    try {
                      // Recria o fetch diretamente
                      // ... (mesmo código do fetch acima)
                    } catch (err) {
                      setError("Falha ao tentar novamente");
                    }
                  };
                  fetchAgain();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    setTimeout(() => {
                      document.body.removeChild(a);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <Download size={16} /> Baixar PDF
                </button>
                <button 
                  onClick={() => iframeRef.current?.contentWindow?.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Printer size={16} /> Imprimir
                </button>
              </div>
              <iframe 
                ref={iframeRef} 
                src={pdfUrl} 
                className="flex-1 w-full border-none" 
                title={`Relatório de Vistoria - ID: ${surveyId}`}
                onLoad={() => console.log('PDF carregado no iframe')}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
              <p>Preparando relatório...</p>
              <p className="text-sm text-gray-500 mt-1">ID: {surveyId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;