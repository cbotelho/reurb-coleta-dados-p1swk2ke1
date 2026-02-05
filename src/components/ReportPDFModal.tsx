// components/ReportPDFModal.tsx - VERSÃO FINAL SIMPLES
import React, { useState, useEffect } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

interface ReportPDFModalProps {
  surveyId: string;
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
  const [error, setError] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<any>(null);

  // BUSCA DIRETA NA VIEW - IGUAL SEU EXEMPLO
  const fetchSurveyData = async (id: string) => {
    if (!id || id === 'undefined') {
      setError('ID do registro inválido');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Buscando dados para ID:', id);
      
      // USANDO SUAS VARIÁVEIS DE AMBIENTE
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variáveis de ambiente do Supabase não configuradas');
      }
      
      // CONSULTA DIRETA - IGUAL SEU EXEMPLO SQL
      const response = await fetch(
        `${supabaseUrl}/rest/v1/vw_reurb_surveys_admin?id=eq.${id}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('Registro não encontrado');
      }
      
      console.log('✅ Dados encontrados:', {
        id: data[0].id,
        formulario: data[0].formulario,
        requerente: data[0].requerente
      });
      
      setSurveyData(data[0]);
      return data[0];
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar dados:', err);
      setError(`Falha ao carregar dados: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // GERAR PDF SIMPLES
  const generatePDF = async () => {
    if (!surveyData) {
      setError('Dados do registro não disponíveis');
      return;
    }
    
    try {
      console.log('📄 Iniciando geração do PDF...');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let y = 20;
      const margin = 20;
      const pageWidth = 210;
      
      // CABEÇALHO
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 128);
      pdf.text('RELATÓRIO DE VISTORIA - REURB', pageWidth / 2, y, { align: 'center' });
      
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Sistema de Regularização Fundiária Urbana', pageWidth / 2, y, { align: 'center' });
      pdf.text('Prefeitura Municipal', pageWidth / 2, y + 5, { align: 'center' });
      
      y += 20;
      
      // LINHA DIVISÓRIA
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      // SEÇÃO: DADOS DO FORMULÁRIO
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO FORMULÁRIO', margin, y);
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // FUNÇÃO AUXILIAR PARA FORMATAR VALORES
      const formatValue = (value: any) => {
        if (value === null || value === undefined || value === '') return 'N/A';
        if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
        return String(value);
      };
      
      // DADOS PRINCIPAIS - ESQUERDA
      const leftData = [
        ['ID do Registro:', surveyData.id],
        ['Formulário:', surveyData.formulario],
        ['Projeto:', surveyData.projeto],
        ['Quadra:', surveyData.quadra],
        ['Lote:', surveyData.lote],
        ['Requerente:', surveyData.requerente],
        ['CPF:', surveyData.cpf],
        ['RG:', surveyData.rg],
        ['Estado Civil:', surveyData.estado_civil],
        ['Profissão:', surveyData.profissao]
      ];
      
      // DADOS PRINCIPAIS - DIREITA
      const rightData = [
        ['Renda Familiar:', surveyData.renda_familiar],
        ['NIS:', surveyData.nis],
        ['Endereço:', surveyData.endereco],
        ['Cônjuge:', surveyData.conjuge],
        ['CPF Cônjuge:', surveyData.cpf_conjuge],
        ['Nº Moradores:', surveyData.num_moradores],
        ['Nº Filhos:', surveyData.num_filhos],
        ['Filhos Menores:', surveyData.filhos_menores],
        ['Tempo Moradia:', surveyData.tempo_moradia],
        ['Tipo Aquisição:', surveyData.tipo_aquisicao]
      ];
      
      // DESENHAR COLUNA ESQUERDA
      let currentY = y;
      leftData.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, currentY);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(value), margin + 50, currentY);
        
        currentY += 7;
      });
      
      // DESENHAR COLUNA DIREITA
      currentY = y;
      rightData.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin + 100, currentY);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(value), margin + 150, currentY);
        
        currentY += 7;
      });
      
      y = Math.max(y + leftData.length * 7, currentY) + 10;
      
      // SEÇÃO: CARACTERÍSTICAS DO IMÓVEL
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CARACTERÍSTICAS DO IMÓVEL', margin, y);
      y += 10;
      
      const caracteristicas = [
        ['Uso do Imóvel:', surveyData.uso_imovel, 'Tipo Construção:', surveyData.construcao],
        ['Telhado:', surveyData.telhado, 'Piso:', surveyData.piso],
        ['Divisa:', surveyData.divisa, 'Cômodos:', surveyData.comodos],
        ['Água:', surveyData.agua, 'Energia:', surveyData.energia],
        ['Esgoto:', surveyData.esgoto, 'Pavimentação:', surveyData.pavimentacao]
      ];
      
      caracteristicas.forEach(([label1, value1, label2, value2]) => {
        // Primeira coluna
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(label1), margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(value1), margin + 40, y);
        
        // Segunda coluna
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(label2), margin + 100, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatValue(value2), margin + 140, y);
        
        y += 7;
      });
      
      y += 10;
      
      // ANÁLISE IA (SE EXISTIR)
      if (surveyData.analise_ia) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ANÁLISE DO SISTEMA:', margin, y);
        y += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const analiseLines = pdf.splitTextToSize(surveyData.analise_ia, 170);
        
        analiseLines.forEach((line: string) => {
          if (y > 250) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, margin + 5, y);
          y += 6;
        });
        
        y += 10;
      }
      
      // QUEBRA DE PÁGINA SE NECESSÁRIO PARA ASSINATURAS
      if (y > 180) {
        pdf.addPage();
        y = 20;
      }
      
      // ASSINATURAS
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ASSINATURAS', pageWidth / 2, y, { align: 'center' });
      y += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Linhas para assinatura
      pdf.text('___________________________', margin, y);
      pdf.text('___________________________', margin + 105, y);
      y += 6;
      
      pdf.text('Assinatura do Requerente', margin + 15, y);
      pdf.text('Assinatura do Vistoriador', margin + 120, y);
      y += 8;
      
      pdf.text(surveyData.requerente || '', margin + 10, y);
      pdf.text('Vistoriador Responsável', margin + 120, y);
      y += 6;
      
      if (surveyData.cpf) {
        pdf.text(`CPF: ${surveyData.cpf}`, margin + 10, y);
      }
      
      // RODAPÉ
      const dataGeracao = new Date().toLocaleDateString('pt-BR');
      const horaGeracao = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      y = 285;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Documento gerado em: ${dataGeracao} às ${horaGeracao}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
      pdf.text(`ID do registro: ${surveyData.id}`, pageWidth / 2, y, { align: 'center' });
      
      // GERAR URL DO PDF
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // MARCAR COMO IMPRESSO
      onMarkPrinted(surveyData.id);
      
      console.log('✅ PDF gerado com sucesso!');
      
    } catch (err) {
      console.error('❌ Erro ao gerar PDF:', err);
      setError('Erro ao gerar o PDF. Por favor, tente novamente.');
    }
  };

  // BAIXAR PDF
  const handleDownload = () => {
    if (!pdfUrl || !surveyData) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Relatorio_REURB_${surveyData.formulario || surveyData.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // IMPRIMIR
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

  // EFEITO PRINCIPAL
  useEffect(() => {
    if (isOpen && surveyId) {
      console.log('🚀 Modal PDF aberto para ID:', surveyId);
      
      // BUSCAR DADOS E GERAR PDF
      fetchSurveyData(surveyId).then(data => {
        if (data) {
          // Pequeno delay para garantir renderização
          setTimeout(() => {
            generatePDF();
          }, 100);
        }
      });
    }
    
    // LIMPAR AO FECHAR
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, surveyId]);

  // RESETAR AO FECHAR
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSurveyData(null);
        setPdfUrl('');
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Relatório de Vistoria REURB
              </h2>
              <p className="text-sm text-gray-600">
                ID: {surveyId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* CONTEÚDO */}
        <div className="flex-1 p-6 overflow-auto">
          {error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 max-w-md mx-auto">
                <p className="font-medium">{error}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => surveyId && fetchSurveyData(surveyId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">
                {surveyData ? 'Gerando PDF...' : 'Buscando dados do registro...'}
              </p>
              <p className="text-sm text-gray-500 mt-2">ID: {surveyId}</p>
            </div>
          ) : pdfUrl ? (
            <div className="space-y-4">
              <div className="flex gap-3">
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
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[500px] border-0"
                  title="Visualização do PDF"
                />
              </div>
            </div>
          ) : null}
        </div>
        
        {/* RODAPÉ */}
        <div className="p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {surveyData ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Requerente:</span> {surveyData.requerente || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Formulário:</span> {surveyData.formulario || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Quadra/Lote:</span> {surveyData.quadra || 'N/A'} / {surveyData.lote || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Projeto:</span> {surveyData.projeto || 'N/A'}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Aguardando dados do registro...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPDFModal;