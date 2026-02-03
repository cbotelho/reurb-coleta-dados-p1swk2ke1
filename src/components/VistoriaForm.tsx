// src/components/VistoriaForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, MapPin, Home, FileText, User, CheckCircle, Download, Save, Printer } from 'lucide-react';

interface VistoriaData {
  quadra_id: string;
  lote_id: string;
  vistoriador_nome: string;
  vistoriador_matricula: string;
  data_vistoria: string;
  proprietario_nome: string;
  proprietario_cpf: string;
  proprietario_telefone: string;
  tipo_construcao: string;
  estado_conservacao: string;
  possui_agua: boolean;
  possui_energia: boolean;
  possui_esgoto: boolean;
  observacoes: string;
  fotos: File[];
}

const VistoriaForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [quadras, setQuadras] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [selectedQuadra, setSelectedQuadra] = useState('');
  const [selectedLote, setSelectedLote] = useState('');
  const [fotos, setFotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<VistoriaData>({
    defaultValues: {
      data_vistoria: new Date().toISOString().split('T')[0],
      possui_agua: false,
      possui_energia: false,
      possui_esgoto: false,
    }
  });

  // Carregar quadras do Supabase
  useEffect(() => {
    const loadQuadras = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          'https://mbcstctoikcnicmeyjgh.supabase.co/rest/v1/quadras?select=id,name',
          {
            headers: {
              'apikey': 'sua_chave_aqui',
              'Authorization': 'Bearer sua_chave_aqui'
            }
          }
        );
        const data = await response.json();
        setQuadras(data);
      } catch (error) {
        console.error('Erro ao carregar quadras:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuadras();
  }, []);

  // Carregar lotes quando selecionar quadra
  useEffect(() => {
    if (!selectedQuadra) return;

    const loadLotes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://mbcstctoikcnicmeyjgh.supabase.co/rest/v1/lotes?quadra_id=eq.${selectedQuadra}&select=id,name,address,area`,
          {
            headers: {
              'apikey': 'sua_chave_aqui',
              'Authorization': 'Bearer sua_chave_aqui'
            }
          }
        );
        const data = await response.json();
        setLotes(data);
      } catch (error) {
        console.error('Erro ao carregar lotes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLotes();
  }, [selectedQuadra]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFotos(prev => [...prev, ...files]);
  };

  const removeFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  const generatePDF = () => {
    // Gerar PDF simples
    const pdfContent = `
      RELATÓRIO DE VISTORIA - REURB
      =============================
      
      Quadra: ${quadras.find(q => q.id === selectedQuadra)?.name || 'Não selecionada'}
      Lote: ${lotes.find(l => l.id === selectedLote)?.name || 'Não selecionado'}
      
      Data: ${watch('data_vistoria')}
      Vistoriador: ${watch('vistoriador_nome')}
      Matrícula: ${watch('vistoriador_matricula')}
      
      Proprietário: ${watch('proprietario_nome')}
      CPF: ${watch('proprietario_cpf')}
      Telefone: ${watch('proprietario_telefone')}
      
      Tipo de Construção: ${watch('tipo_construcao')}
      Estado de Conservação: ${watch('estado_conservacao')}
      
      Infraestrutura:
      - Água: ${watch('possui_agua') ? 'SIM' : 'NÃO'}
      - Energia: ${watch('possui_energia') ? 'SIM' : 'NÃO'}
      - Esgoto: ${watch('possui_esgoto') ? 'SIM' : 'NÃO'}
      
      Observações: ${watch('observacoes') || 'Nenhuma'}
      
      Total de Fotos: ${fotos.length}
      
      Assinatura do Vistoriador: _________________________
      Data: ${new Date().toLocaleDateString('pt-BR')}
    `;

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vistoria_${selectedQuadra}_${selectedLote}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onSubmit = async (data: VistoriaData) => {
    try {
      // Salvar no Supabase
      const response = await fetch('https://mbcstctoikcnicmeyjgh.supabase.co/rest/v1/vistorias', {
        method: 'POST',
        headers: {
          'apikey': 'sua_chave_aqui',
          'Authorization': 'Bearer sua_chave_aqui',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...data,
          quadra_id: selectedQuadra,
          lote_id: selectedLote,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Vistoria salva com sucesso!');
        generatePDF();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar vistoria');
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Formulário de Vistoria REURB
          </h1>
          <p className="text-gray-600 mt-2">Preencha os dados da vistoria técnica</p>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progresso</span>
              <span className="text-sm font-medium">{step}/4</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Seleção */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                1. Seleção do Lote
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Quadra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quadra *
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={selectedQuadra}
                    onChange={(e) => setSelectedQuadra(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Selecione uma quadra</option>
                    {quadras.map(quadra => (
                      <option key={quadra.id} value={quadra.id}>
                        {quadra.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lote */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote *
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={selectedLote}
                    onChange={(e) => setSelectedLote(e.target.value)}
                    disabled={!selectedQuadra || isLoading}
                  >
                    <option value="">Selecione um lote</option>
                    {lotes.map(lote => (
                      <option key={lote.id} value={lote.id}>
                        {lote.name} ({lote.area}m²)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedLote && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Lote Selecionado</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Nome</div>
                      <div className="font-medium">{lotes.find(l => l.id === selectedLote)?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Área</div>
                      <div className="font-medium">{lotes.find(l => l.id === selectedLote)?.area}m²</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Status</div>
                      <div className="font-medium">{lotes.find(l => l.id === selectedLote)?.status}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Endereço</div>
                      <div className="font-medium">{lotes.find(l => l.id === selectedLote)?.address || 'Não informado'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!selectedLote}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Vistoriador */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                2. Dados do Vistoriador
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Vistoriador *
                  </label>
                  <input
                    type="text"
                    {...register('vistoriador_nome', { required: 'Nome é obrigatório' })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Nome completo"
                  />
                  {errors.vistoriador_nome && (
                    <p className="text-red-500 text-sm mt-1">{errors.vistoriador_nome.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matrícula/Registro *
                  </label>
                  <input
                    type="text"
                    {...register('vistoriador_matricula', { required: 'Matrícula é obrigatória' })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Número de registro"
                  />
                  {errors.vistoriador_matricula && (
                    <p className="text-red-500 text-sm mt-1">{errors.vistoriador_matricula.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Vistoria *
                  </label>
                  <input
                    type="date"
                    {...register('data_vistoria', { required: true })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Proprietário e Características */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Home className="w-6 h-6 text-blue-600" />
                3. Dados da Propriedade
              </h2>
              
              <div className="space-y-6">
                {/* Proprietário */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Proprietário *
                    </label>
                    <input
                      type="text"
                      {...register('proprietario_nome', { required: 'Nome é obrigatório' })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF *
                    </label>
                    <input
                      type="text"
                      {...register('proprietario_cpf', { required: 'CPF é obrigatório' })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      {...register('proprietario_telefone')}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                {/* Características */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Construção
                    </label>
                    <select
                      {...register('tipo_construcao')}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Selecione</option>
                      <option value="alvenaria">Alvenaria</option>
                      <option value="madeira">Madeira</option>
                      <option value="mista">Mista</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado de Conservação
                    </label>
                    <select
                      {...register('estado_conservacao')}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Selecione</option>
                      <option value="otimo">Ótimo</option>
                      <option value="bom">Bom</option>
                      <option value="regular">Regular</option>
                      <option value="ruim">Ruim</option>
                    </select>
                  </div>
                </div>

                {/* Infraestrutura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Infraestrutura Disponível
                  </label>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('possui_agua')}
                        className="w-4 h-4"
                      />
                      <span>Água encanada</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('possui_energia')}
                        className="w-4 h-4"
                      />
                      <span>Energia elétrica</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('possui_esgoto')}
                        className="w-4 h-4"
                      />
                      <span>Rede de esgoto</span>
                    </label>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    {...register('observacoes')}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Descreva observações importantes sobre a vistoria..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Fotos e Finalização */}
          {step === 4 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Camera className="w-6 h-6 text-blue-600" />
                4. Fotos e Finalização
              </h2>
              
              {/* Upload de fotos */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Fotos da Vistoria
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Arraste e solte as fotos ou clique para selecionar</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                  >
                    Selecionar Fotos
                  </label>
                </div>

                {/* Lista de fotos */}
                {fotos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-700 mb-3">
                      Fotos selecionadas ({fotos.length})
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {fotos.map((foto, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(foto)}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <div className="text-xs text-center mt-1 truncate">
                            {foto.name.substring(0, 15)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex flex-wrap gap-4 justify-between items-center pt-6 border-t">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={generatePDF}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Gerar PDF
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    className="px-6 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Rascunho
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Finalizar Vistoria
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Resumo do Lote */}
        {selectedLote && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-800 mb-4">Resumo da Vistoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Quadra</div>
                <div className="font-medium">{quadras.find(q => q.id === selectedQuadra)?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Lote</div>
                <div className="font-medium">{lotes.find(l => l.id === selectedLote)?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Vistoriador</div>
                <div className="font-medium">{watch('vistoriador_nome') || 'Não informado'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Fotos</div>
                <div className="font-medium">{fotos.length} fotos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VistoriaForm;