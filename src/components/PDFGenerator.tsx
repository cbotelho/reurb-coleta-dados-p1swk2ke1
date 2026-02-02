// components/PDFGenerator.tsx
import React, { useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { VistoriaFormData, Quadra, Lote } from '../types/vistoria';
import { X, Download, Loader } from 'lucide-react';

interface PDFGeneratorProps {
  formData: VistoriaFormData;
  quadra?: Quadra;
  lote?: Lote;
  fotos: File[];
  onClose: () => void;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ 
  formData, 
  quadra, 
  lote, 
  fotos, 
  onClose 
}) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(true);
  const [pdfUrl, setPdfUrl] = React.useState<string>('');

  const generatePDF = async () => {
    if (!pdfRef.current) return;

    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      // Auto download
      pdf.save(`vistoria_${lote?.name || 'lote'}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generatePDF();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Pré-visualização do PDF</h2>
            <p className="text-gray-600">Vistoria - {lote?.name} - {quadra?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Gerando PDF...</p>
              <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="mb-6">
                <a
                  href={pdfUrl}
                  download
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Baixar PDF Novamente
                </a>
              </div>
              
              {/* Preview container - Esta será convertida para PDF */}
              <div 
                ref={pdfRef} 
                className="w-[210mm] bg-white p-10 shadow-lg border"
                style={{ minHeight: '297mm' }}
              >
                {/* Cabeçalho Oficial */}
                <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">R</span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">REURB - SISTEMA DE REGULARIZAÇÃO FUNDIÁRIA</h1>
                      <p className="text-lg text-gray-600">Prefeitura Municipal - Secretaria de Habitação e Regularização Fundiária</p>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mt-4">FORMULÁRIO DE VISTORIA TÉCNICA</h2>
                  <p className="text-gray-600">Processo de Regularização de Loteamentos</p>
                </div>

                {/* Informações Básicas */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">1. IDENTIFICAÇÃO DO IMÓVEL</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-700">Quadra:</p>
                      <p className="text-lg">{quadra?.name || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Lote:</p>
                      <p className="text-lg">{lote?.name || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Área Total:</p>
                      <p className="text-lg">{lote?.area || '0'} m²</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Endereço:</p>
                      <p className="text-lg">{lote?.address || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Dados da Vistoria */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">2. DADOS DA VISTORIA</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-700">Data:</p>
                      <p className="text-lg">{formatDate(formData.data_vistoria)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Horário:</p>
                      <p className="text-lg">{formData.horario_inicio} às {formData.horario_termino}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Vistoriador:</p>
                      <p className="text-lg">{formData.vistoriador_name}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Matrícula:</p>
                      <p className="text-lg">{formData.vistoriador_matricula}</p>
                    </div>
                  </div>
                </div>

                {/* Proprietário */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">3. PROPRIETÁRIO/POSSUIDOR</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-700">Nome:</p>
                      <p className="text-lg">{formData.proprietario_nome}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">CPF:</p>
                      <p className="text-lg">{formData.proprietario_cpf}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Telefone:</p>
                      <p className="text-lg">{formData.proprietario_telefone}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">E-mail:</p>
                      <p className="text-lg">{formData.proprietario_email}</p>
                    </div>
                  </div>
                </div>

                {/* Características da Construção */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">4. CARACTERÍSTICAS DA CONSTRUÇÃO</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-semibold text-gray-700">Tipo de Construção:</p>
                      <p className="text-lg capitalize">{formData.tipo_construcao}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Estado de Conservação:</p>
                      <p className="text-lg capitalize">{formData.estado_conservacao}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Ano de Construção:</p>
                      <p className="text-lg">{formData.ano_construcao || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Infraestrutura */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">5. INFRAESTRUTURA DISPONÍVEL</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_agua ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Água encanada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_energia ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Energia elétrica</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_esgoto ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Rede de esgoto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_coleta_lixo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Coleta de lixo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_pavimentacao ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Pavimentação</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_iluminacao_publica ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Iluminação pública</span>
                    </div>
                  </div>
                </div>

                {/* Documentação */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">6. DOCUMENTAÇÃO</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_matricula ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Matrícula do imóvel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_escritura ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Escritura pública</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_contrato_compra ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Contrato de compra e venda</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${formData.possui_declaracao_posse ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Declaração de posse</span>
                    </div>
                  </div>
                  {formData.documentos_observacoes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="font-semibold">Observações:</p>
                      <p>{formData.documentos_observacoes}</p>
                    </div>
                  )}
                </div>

                {/* Conflitos */}
                {formData.existe_conflito && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">7. CONFLITOS IDENTIFICADOS</h3>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="font-semibold text-yellow-800">Tipo de conflito: {formData.tipo_conflito}</p>
                      <p className="mt-2 text-yellow-700">{formData.descricao_conflito}</p>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {formData.observacoes_gerais && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">8. OBSERVAÇÕES GERAIS</h3>
                    <div className="p-4 bg-gray-50 rounded">
                      <p>{formData.observacoes_gerais}</p>
                    </div>
                  </div>
                )}

                {/* Recomendações */}
                {formData.recomendacoes && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">9. RECOMENDAÇÕES</h3>
                    <div className="p-4 bg-blue-50 rounded">
                      <p>{formData.recomendacoes}</p>
                    </div>
                  </div>
                )}

                {/* Assinaturas */}
                <div className="mt-12 pt-8 border-t border-gray-300">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="border-b border-gray-400 pb-2 mb-4">
                        <p className="font-semibold">PROPRIETÁRIO/POSSUIDOR</p>
                      </div>
                      <p className="mt-8 pt-8 border-t border-gray-300">
                        {formData.proprietario_nome}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">CPF: {formData.proprietario_cpf}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="border-b border-gray-400 pb-2 mb-4">
                        <p className="font-semibold">VISTORIADOR TÉCNICO</p>
                      </div>
                      <p className="mt-8 pt-8 border-t border-gray-300">
                        {formData.vistoriador_name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Matrícula: {formData.vistoriador_matricula}</p>
                    </div>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
                  <p>Documento gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                  <p className="mt-1">Sistema REURB - Prefeitura Municipal</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;