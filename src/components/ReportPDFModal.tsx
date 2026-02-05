// components/ReportPDFModal.tsx - VERSÃO ULTRA-RESILIENTE (CORREÇÃO DE TRAVAMENTO)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Printer, FileText, AlertCircle, Loader2, RefreshCcw } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReportPDFModalProps {
  surveyId: string;
  isOpen: boolean;
  onClose: () => void;
  onMarkPrinted?: (id: string) => void;
}

interface SurveyData {
  id: string;
  projeto: string;
  quadra: string;
  lote: string;
  formulario: string;
  requerente: string;
  cpf: string;
  rg: string;
  estado_civil: string;
  profissao: string;
  renda_familiar: string;
  nis: string;
  endereco: string;
  conjuge: string;
  cpf_conjuge: string;
  num_moradores: any;
  num_filhos: any;
  filhos_menores: any;
  tempo_moradia: string;
  tipo_aquisicao: string;
  uso_imovel: string;
  construcao: string;
  telhado: string;
  piso: string;
  divisa: string;
  comodos: any;
  agua: string;
  energia: string;
  esgoto: string;
  pavimentacao: string;
  analise_ia: string;
  assinatura_vistoriador?: string;
  assinatura_requerente?: string;
  [key: string]: any;
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
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Formatação segura de valores
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'Não informado';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return String(value);
  };

  // GERAÇÃO DO PDF (Separada para ser chamada após o fetch)
  const generatePDF = useCallback(async (data: SurveyData) => {
    console.log("Iniciando geração do PDF para:", data.id);
    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
      });

      const margin = 20;
      const pageWidth = 210;
      const pageHeight = 297;
      let y = 20;
      
      // Título
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RELATÓRIO DE VISTORIA REURB', pageWidth / 2, y, { align: 'center' });
      
      y += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`ID: ${data.id || 'N/A'}`, pageWidth / 2, y, { align: 'center' });
      
      y += 10;
      pdf.setDrawColor(200);
      pdf.line(margin, y, pageWidth - margin, y);
      
      // Dados principais
      y += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. DADOS DO REGISTRO', margin, y);
      
      y += 8;
      pdf.setFontSize(10);
      const rows = [
        ['Projeto:', data.projeto, 'Formulário:', data.formulario],
        ['Quadra:', data.quadra, 'Lote:', data.lote],
        ['Requerente:', data.requerente, 'CPF:', data.cpf],
        ['RG:', data.rg, 'Est. Civil:', data.estado_civil],
        ['Endereço:', data.endereco, 'Renda:', data.renda_familiar]
      ];

      rows.forEach(row => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(row[0]), margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[1]), margin + 25, y);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(row[2]), margin + 100, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[3]), margin + 125, y);
        y += 7;
      });

      // Características
      y += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('2. CARACTERÍSTICAS DO IMÓVEL', margin, y);
      y += 8;
      pdf.setFontSize(10);

      const caracteristicas = [
        ['Construção:', data.construcao, 'Telhado:', data.telhado],
        ['Piso:', data.piso, 'Divisa:', data.divisa],
        ['Cômodos:', data.comodos, 'Uso:', data.uso_imovel],
        ['Água:', data.agua, 'Energia:', data.energia],
        ['Esgoto:', data.esgoto, 'Pavimento:', data.pavimentacao]
      ];

      caracteristicas.forEach(row => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(row[0]), margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[1]), margin + 25, y);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(row[2]), margin + 100, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[3]), margin + 125, y);
        y += 7;
      });

      // Análise IA
      if (data.analise_ia) {
        y += 10;
        if (y > 240) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', 'bold');
        pdf.text('3. ANÁLISE TÉCNICA', margin, y);
        y += 7;
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(data.analise_ia, pageWidth - (margin * 2));
        pdf.text(lines, margin, y);
        y += (lines.length * 5) + 10;
      }

      // Assinaturas
      if (y > 250) { pdf.addPage(); y = 40; } else { y = 260; }
      pdf.line(margin, y, margin + 60, y);
      pdf.line(pageWidth - margin - 60, y, pageWidth - margin, y);
      y += 5;
      pdf.setFontSize(8);
      pdf.text('REQUERENTE', margin + 30, y, { align: 'center' });
      pdf.text('VISTORIADOR', pageWidth - margin - 30, y, { align: 'center' });

      // Finalização
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setPdfUrl(url);
      setPdfReady(true);
      console.log("PDF gerado com sucesso e URL criada.");
      
      if (onMarkPrinted) onMarkPrinted(data.id);
    } catch (err) {
      console.error("Erro crítico na geração do PDF:", err);
      setError("Falha ao processar o documento PDF.");
    }
  }, [onMarkPrinted]);

  // BUSCA DE DADOS
  const fetchData = useCallback(async () => {
    if (!surveyId) return;
    
    setLoading(true);
    setError(null);
    setPdfReady(false);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Configurações do banco de dados (Supabase) ausentes.");
      }

      console.log("Iniciando fetch para ID:", surveyId);
      
      // URL de consulta conforme sua regra
      const queryUrl = `${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?id=eq.${surveyId}&select=projeto,quadra,lote,formulario,requerente,cpf,rg,estado_civil,profissao,renda_familiar,nis,endereco,conjuge,cpf_conjuge,num_moradores,num_filhos,filhos_menores,tempo_moradia,tipo_aquisicao,uso_imovel,construcao,telhado,piso,divisa,comodos,agua,energia,esgoto,pavimentacao,analise_ia,assinatura_vistoriador,assinatura_requerente`;

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dados recebidos:", data);

      if (!data || data.length === 0) {
        throw new Error("Nenhum registro encontrado para este ID.");
      }

      const record = { ...data[0], id: surveyId };
      setSurveyData(record);
      
      // Chamar a geração do PDF após um pequeno delay para garantir que o estado do dado foi processado
      setTimeout(() => generatePDF(record), 100);

    } catch (err: any) {
      console.error("Erro na busca de dados:", err);
      setError(err.message || "Ocorreu um erro ao carregar os dados.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [surveyId, generatePDF]);

  // Efeito para abrir o modal
  useEffect(() => {
    if (isOpen && surveyId) {
      fetchData();
    }
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
    };
  }, [isOpen, surveyId, fetchData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Relatório de Vistoria</h2>
              <p className="text-xs text-gray-500 font-mono">ID: {surveyId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-50 overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-700">Buscando dados no servidor...</p>
              <p className="text-sm text-gray-500">Isso pode levar alguns segundos</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-red-50 p-6 rounded-full mb-6">
                <AlertCircle className="w-16 h-16 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Falha na Carregamento</h3>
              <p className="text-gray-600 max-w-md mb-8">{error}</p>
              <button 
                onClick={fetchData}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-semibold"
              >
                <RefreshCcw className="w-5 h-5" /> Tentar Novamente
              </button>
            </div>
          ) : pdfReady ? (
            <div className="h-full flex flex-col">
              <div className="p-3 bg-white border-b flex gap-3 justify-center shadow-sm z-20">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `Relatorio_${surveyData?.formulario || 'REURB'}.pdf`;
                    link.click();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium shadow-sm"
                >
                  <Download className="w-4 h-4" /> Baixar Relatório
                </button>
                <button 
                  onClick={() => iframeRef.current?.contentWindow?.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </div>
              <iframe 
                ref={iframeRef}
                src={pdfUrl} 
                className="flex-1 w-full border-none"
                title="Visualização do PDF"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium text-gray-700">Gerando documento...</p>
              <p className="text-sm text-gray-500">Formatando dados para o PDF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;