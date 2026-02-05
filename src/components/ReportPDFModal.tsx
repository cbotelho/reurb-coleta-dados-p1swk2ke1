// components/ReportPDFModal.tsx - VERSÃO CORRIGIDA E OTIMIZADA
import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Printer, FileText, AlertCircle, Loader2 } from 'lucide-react';
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
  num_moradores: number;
  num_filhos: number;
  filhos_menores: number;
  tempo_moradia: string;
  tipo_aquisicao: string;
  uso_imovel: string;
  construcao: string;
  telhado: string;
  piso: string;
  divisa: string;
  comodos: number;
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

  // FUNÇÃO PARA BUSCAR DADOS DA VIEW vw_reurb_surveys_admin
  const fetchSurveyData = async (id: string): Promise<SurveyData | null> => {
    if (!id) {
      setError('ID do registro não fornecido');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configurações do banco de dados não encontradas.');
      }
      
      // Consulta conforme especificado: select ... from vw_reurb_surveys_admin where id = '...'
      const response = await fetch(
        `${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?id=eq.${id}&select=projeto,quadra,lote,formulario,requerente,cpf,rg,estado_civil,profissao,renda_familiar,nis,endereco,conjuge,cpf_conjuge,num_moradores,num_filhos,filhos_menores,tempo_moradia,tipo_aquisicao,uso_imovel,construcao,telhado,piso,divisa,comodos,agua,energia,esgoto,pavimentacao,analise_ia,assinatura_vistoriador,assinatura_requerente`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erro na consulta: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('Registro não encontrado na base de dados.');
      }
      
      const record = { ...data[0], id }; // Garantindo que o ID esteja no objeto
      setSurveyData(record);
      return record;
      
    } catch (err: any) {
      console.error('Erro fetch:', err);
      setError(err.message || 'Falha ao carregar dados do servidor');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'Não informado';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return String(value);
  };

  // GERAÇÃO DO DOCUMENTO PDF
  const generatePDF = async (data: SurveyData) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 20;
      const pageWidth = 210;
      const pageHeight = 297;
      let y = 20;
      
      // Título e Cabeçalho
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('RELATÓRIO DE VISTORIA REURB', pageWidth / 2, y, { align: 'center' });
      
      y += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`ID do Registro: ${data.id}`, pageWidth / 2, y, { align: 'center' });
      
      y += 15;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      
      // Seção 1: Identificação
      y += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(44, 62, 80);
      pdf.text('1. IDENTIFICAÇÃO DO PROJETO E REQUERENTE', margin, y);
      
      y += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      const col1 = margin;
      const col2 = margin + 90;
      
      const rowHeight = 7;
      
      // Grid de dados 1
      const basicInfo = [
        ['Projeto:', data.projeto, 'Formulário:', data.formulario],
        ['Quadra:', data.quadra, 'Lote:', data.lote],
        ['Requerente:', data.requerente, 'CPF:', data.cpf],
        ['RG:', data.rg, 'Estado Civil:', data.estado_civil],
        ['Profissão:', data.profissao, 'Renda Familiar:', data.renda_familiar],
        ['NIS:', data.nis, 'Endereço:', data.endereco]
      ];

      basicInfo.forEach(row => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[0], col1, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[1]), col1 + 25, y);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[2], col2, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[3]), col2 + 25, y);
        y += rowHeight;
      });

      // Cônjuge
      y += 3;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cônjuge:', col1, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatValue(data.conjuge), col1 + 25, y);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('CPF Cônjuge:', col2, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatValue(data.cpf_conjuge), col2 + 25, y);
      
      // Composição Familiar
      y += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. COMPOSIÇÃO FAMILIAR E MORADIA', margin, y);
      
      y += 10;
      pdf.setFontSize(10);
      const familyInfo = [
        ['Nº Moradores:', data.num_moradores, 'Nº Filhos:', data.num_filhos],
        ['Filhos Menores:', data.filhos_menores, 'Tempo Moradia:', data.tempo_moradia],
        ['Tipo Aquisição:', data.tipo_aquisicao, 'Uso do Imóvel:', data.uso_imovel]
      ];

      familyInfo.forEach(row => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[0], col1, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[1]), col1 + 35, y);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[2], col2, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[3]), col2 + 35, y);
        y += rowHeight;
      });

      // Características Físicas
      y += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. CARACTERÍSTICAS FÍSICAS DO IMÓVEL', margin, y);
      
      y += 10;
      pdf.setFontSize(10);
      const physicalInfo = [
        ['Construção:', data.construcao, 'Telhado:', data.telhado],
        ['Piso:', data.piso, 'Divisa:', data.divisa],
        ['Cômodos:', data.comodos, 'Pavimentação:', data.pavimentacao]
      ];

      physicalInfo.forEach(row => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[0], col1, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[1]), col1 + 25, y);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[2], col2, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(row[3]), col2 + 25, y);
        y += rowHeight;
      });

      // Infraestrutura
      y += 3;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Água:', col1, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatValue(data.agua), col1 + 25, y);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Energia:', col2, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatValue(data.energia), col2 + 25, y);
      
      y += rowHeight;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Esgoto:', col1, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatValue(data.esgoto), col1 + 25, y);

      // Análise IA
      if (data.analise_ia) {
        y += 15;
        if (y > pageHeight - 60) { pdf.addPage(); y = 20; }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('4. ANÁLISE TÉCNICA (IA)', margin, y);
        
        y += 10;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const splitText = pdf.splitTextToSize(data.analise_ia, pageWidth - (margin * 2));
        pdf.text(splitText, margin, y);
        y += (splitText.length * 5) + 10;
      }

      // Assinaturas
      if (y > pageHeight - 60) { pdf.addPage(); y = 30; } else { y += 20; }
      
      pdf.setDrawColor(0);
      pdf.line(margin, y, margin + 70, y);
      pdf.line(pageWidth - margin - 70, y, pageWidth - margin, y);
      
      y += 5;
      pdf.setFontSize(9);
      pdf.text('ASSINATURA DO REQUERENTE', margin + 35, y, { align: 'center' });
      pdf.text('ASSINATURA DO VISTORIADOR', pageWidth - margin - 35, y, { align: 'center' });
      
      y += 5;
      pdf.setFont('helvetica', 'italic');
      pdf.text(formatValue(data.requerente), margin + 35, y, { align: 'center' });
      
      // Rodapé com data
      const now = new Date().toLocaleString('pt-BR');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Documento gerado em ${now} • Sistema REURB Admin`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setPdfReady(true);
      
      if (onMarkPrinted) onMarkPrinted(data.id);
      
    } catch (err) {
      console.error('Erro PDF:', err);
      setError('Erro ao gerar o arquivo PDF.');
    }
  };

  useEffect(() => {
    if (isOpen && surveyId) {
      setPdfUrl('');
      setPdfReady(false);
      setError(null);
      
      const init = async () => {
        const data = await fetchSurveyData(surveyId);
        if (data) await generatePDF(data);
      };
      
      init();
    }
  }, [isOpen, surveyId]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Visualização do Relatório</h2>
              <p className="text-xs text-gray-500 font-mono">ID: {surveyId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-100">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-gray-600 font-medium">Consultando base de dados...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Ops! Algo deu errado</h3>
              <p className="text-gray-600 max-w-md mb-6">{error}</p>
              <button 
                onClick={() => surveyId && fetchSurveyData(surveyId).then(d => d && generatePDF(d))}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : pdfReady ? (
            <div className="flex-1 flex flex-col">
              <div className="p-3 bg-white border-b flex gap-3 justify-center">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `Relatorio_${surveyData?.formulario || 'Vistoria'}.pdf`;
                    link.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-shadow shadow-sm"
                >
                  <Download className="w-4 h-4" /> Baixar PDF
                </button>
                <button 
                  onClick={() => {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.print();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-shadow shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </div>
              <iframe 
                ref={iframeRef}
                src={pdfUrl} 
                className="flex-1 w-full border-none"
                title="Relatório PDF"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Gerando documento...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;