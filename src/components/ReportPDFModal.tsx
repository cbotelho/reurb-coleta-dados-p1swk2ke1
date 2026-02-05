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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Flag para controlar execução única por ID
  const lastProcessedId = useRef<string>('');

  // Efeito PRINCIPAL - executa quando modal abre com ID
  useEffect(() => {
    console.log('🔍 useEffect executando. isOpen:', isOpen, 'surveyId:', surveyId);
    
    // Se modal não está aberto ou não tem ID, sai
    if (!isOpen || !surveyId) {
      console.log('❌ Modal não está aberto ou sem ID');
      return;
    }
    
    // Se já processamos este ID, não faz nada
    if (lastProcessedId.current === surveyId) {
      console.log('⏭️ Já processamos este ID:', surveyId);
      return;
    }
    
    console.log('🚀 Iniciando processamento para ID:', surveyId);
    
    // Marca que estamos processando este ID
    lastProcessedId.current = surveyId;
    
    const fetchAndGeneratePDF = async () => {
      try {
        console.log('📥 Buscando dados para ID:', surveyId);
        setLoading(true);
        setError(null);
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Configurações do Supabase não encontradas.");
        }

        // Query completa para pegar todos os campos
        const response = await fetch(
          `${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?id=eq.${surveyId}`,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

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

        // Adicionar dados
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
        const url = URL.createObjectURL(blob);
        console.log('🔗 URL do PDF criada');
        
        setPdfUrl(url);
        
        if (onMarkPrinted) {
          onMarkPrinted(surveyId);
        }
        
        console.log('✅ PDF gerado com sucesso!');

      } catch (err: any) {
        console.error('❌ Erro no processo:', err);
        setError(err.message || "Erro ao gerar relatório");
        // Em caso de erro, resetamos para permitir nova tentativa
        lastProcessedId.current = '';
      } finally {
        setLoading(false);
      }
    };

    // Executa a função
    fetchAndGeneratePDF();

    // Cleanup - apenas limpa a URL
    return () => {
      console.log('🧹 Cleanup do effect');
      // Não resetamos lastProcessedId aqui para evitar loops
    };
  }, [isOpen, surveyId, onMarkPrinted]);

  // Efeito separado para limpeza quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      console.log('🚪 Modal fechado, limpando...');
      
      // Limpa a URL se existir
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
      
      // Reseta o ID processado
      lastProcessedId.current = '';
      
      // Limpa estados
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  // Não renderiza nada se o modal não está aberto
  if (!isOpen) return null;

  console.log('🎨 Renderizando modal. Estado:', {
    loading,
    error,
    hasPdfUrl: !!pdfUrl,
    lastProcessedId: lastProcessedId.current
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Relatório de Vistoria</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 bg-gray-50 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
              <p>Gerando relatório...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button 
                onClick={() => {
                  // Força reprocessamento
                  lastProcessedId.current = '';
                  // O useEffect principal vai detectar que não processamos este ID ainda
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : pdfUrl ? (
            <div className="h-full flex flex-col">
              {/* Botões de ação */}
              <div className="p-2 bg-white border-b flex gap-2 justify-center">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = pdfUrl;
                    a.download = `Relatorio_${surveyId}.pdf`;
                    a.click();
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
              
              {/* Visualizador PDF */}
              <iframe 
                ref={iframeRef} 
                src={pdfUrl} 
                className="flex-1 w-full border-none"
                title={`Relatório de Vistoria - ${surveyId}`}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p>Preparando...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;