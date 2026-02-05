// components/ReportPDFModal.tsx - VERSÃO SIMPLIFICADA SEM LOOPS
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
  
  // Flag para controlar se já processamos
  const isProcessing = useRef(false);

  // Função separada para gerar PDF
  const generatePDF = async (record: any) => {
    const pdf = new jsPDF();
    let y = 20;
    
    pdf.setFontSize(16);
    pdf.text('RELATÓRIO DE VISTORIA REURB', 105, y, { align: 'center' });
    
    y += 15;
    pdf.setFontSize(10);
    
    const formatValue = (value: any): string => {
      if (value === null || value === undefined || value === '') return 'N/A';
      return String(value);
    };
    
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

    return pdf.output('blob');
  };

  // Efeito PRINCIPAL - executa quando o modal abre
  useEffect(() => {
    // Se não está aberto ou não tem ID, não faz nada
    if (!isOpen || !surveyId) {
      return;
    }
    
    // Se já está processando, não faz nada
    if (isProcessing.current) {
      return;
    }
    
    console.log('🔍 Iniciando processo de geração de PDF para ID:', surveyId);
    
    // Marca que estamos processando
    isProcessing.current = true;
    
    const fetchAndGenerate = async () => {
      try {
        console.log('📥 Buscando dados do servidor...');
        setLoading(true);
        setError(null);
        setPdfReady(false);
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Configurações do Supabase não encontradas.");
        }

        // Buscar Dados
        const query = `id=eq.${surveyId}`;
        
        console.log('🌐 URL da requisição:', `${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?${query}`);
        
        const response = await fetch(`${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?${query}`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 Status da resposta:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na base de dados: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        
        if (!data || data.length === 0) {
          throw new Error("Registro não encontrado.");
        }
        
        const record = data[0];
        console.log('📄 Registro para PDF:', record);

        // Gerar PDF
        console.log('🖨️ Gerando PDF...');
        const blob = await generatePDF(record);
        
        // Criar URL
        const url = URL.createObjectURL(blob);
        console.log('🔗 URL do PDF criada:', url);
        
        // Atualizar estados
        setPdfUrl(url);
        setPdfReady(true);
        
        if (onMarkPrinted) {
          onMarkPrinted(surveyId);
        }
        
        console.log('✅ PDF gerado com sucesso!');

      } catch (err: any) {
        console.error('❌ Erro no processo:', err);
        setError(err.message || "Erro desconhecido ao gerar o PDF");
        // Resetamos a flag em caso de erro para permitir nova tentativa
        isProcessing.current = false;
      } finally {
        setLoading(false);
      }
    };

    // Executa a função
    fetchAndGenerate();

    // Cleanup function
    return () => {
      console.log('🧹 Cleanup do modal');
      // Não resetamos isProcessing aqui para evitar loops
    };
  }, [isOpen, surveyId]); // Apenas executa quando isOpen ou surveyId mudam

  // Efeito SEPARADO para limpeza quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      console.log('🚪 Modal fechado, limpando recursos...');
      
      // Resetamos a flag
      isProcessing.current = false;
      
      // Limpamos a URL se existir
      if (pdfUrl) {
        console.log('🧼 Revogando URL do PDF');
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
      
      // Resetamos todos os estados
      setPdfReady(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]); // Executa apenas quando isOpen muda

  // Se o modal não está aberto, não renderiza nada
  if (!isOpen) return null;

  console.log('🎨 Renderizando modal, estado atual:', {
    loading,
    error,
    pdfReady,
    hasPdfUrl: !!pdfUrl,
    isProcessing: isProcessing.current
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Relatório de Vistoria</h2>
            <span className="text-sm text-gray-500">ID: {surveyId}</span>
          </div>
          <button 
            onClick={onClose}
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
              <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns instantes</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-2">Erro ao gerar relatório</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => {
                  // Força uma nova tentativa
                  isProcessing.current = false;
                  setError(null);
                  // O useEffect principal vai detectar que não está mais processando e tentar novamente
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
                  onClick={() => {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.print();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Printer size={16} /> Imprimir
                </button>
              </div>
              <iframe 
                ref={iframeRef} 
                src={pdfUrl}
                className="flex-1 w-full border-none bg-white"
                title={`Relatório de Vistoria - ID: ${surveyId}`}
                onLoad={() => console.log('✅ PDF carregado no iframe')}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
              <p>Preparando relatório...</p>
              <p className="text-sm text-gray-500 mt-1">Aguarde</p>
            </div>
          )}
        </div>
        
        {/* Botão de debug no canto inferior direito */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => {
              console.log('🐛 Estado atual:', {
                isOpen,
                surveyId,
                loading,
                error,
                pdfReady,
                pdfUrl: !!pdfUrl,
                isProcessing: isProcessing.current
              });
            }}
            className="text-xs px-2 py-1 bg-gray-800 text-white rounded opacity-50 hover:opacity-100"
          >
            Debug
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;