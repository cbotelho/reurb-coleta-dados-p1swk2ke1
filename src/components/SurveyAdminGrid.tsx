const generatePDF = async () => {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Configurações do Supabase não encontradas.");
    }

    const url = `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin?id=eq.${selectedSurveyId}`;
    
    console.log('🌐 Buscando dados em:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status} ao buscar dados`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error("Registro não encontrado.");
    }
    
    const record = data[0];
    
    // Criar PDF com layout oficial
    const pdf = new jsPDF();
    
    // ============ CONFIGURAÇÕES GERAIS ============
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;
    
    // ============ CABEÇALHO COM LOGOS ============
    // Logo GEA (esquerda)
    try {
      const geaLogo = await loadImage('/gea_logo.jpg');
      pdf.addImage(geaLogo, 'JPEG', margin, y, 30, 30);
    } catch (e) {
      console.log('Logo GEA não carregada');
    }
    
    // Logo Amapá Terras (direita)
    try {
      const amapaLogo = await loadImage('/amapaTerra.jpeg');
      pdf.addImage(amapaLogo, 'JPEG', pageWidth - margin - 30, y, 30, 30);
    } catch (e) {
      console.log('Logo Amapá Terras não carregada');
    }
    
    // Título centralizado
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GOVERNO DO ESTADO DO AMAPÁ', pageWidth / 2, y + 10, { align: 'center' });
    pdf.text('Amapá Terras - Instituto de Terras do Amapá', pageWidth / 2, y + 18, { align: 'center' });
    
    y += 35;
    
    // ============ TÍTULO PRINCIPAL ============
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE VISTORIA REURB', pageWidth / 2, y, { align: 'center' });
    
    y += 10;
    
    // Linha divisória
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    
    y += 15;
    
    // ============ DADOS DO PROJETO ============
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Projeto:', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(record.projeto || 'Não informado', margin + 25, y);
    
    y += 8;
    
    // ============ DADOS PRINCIPAIS (2 COLUNAS) ============
    const col1X = margin;
    const col2X = pageWidth / 2;
    
    // Função para adicionar linha de dado
    const addDataLine = (label: string, value: any, col: number, currentY: number) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label + ':', col === 1 ? col1X : col2X, currentY);
      pdf.setFont('helvetica', 'normal');
      const textX = col === 1 ? col1X + 40 : col2X + 40;
      pdf.text(formatValue(value), textX, currentY);
      return currentY + 7;
    };
    
    const formatValue = (value: any): string => {
      if (value === null || value === undefined || value === '') return 'Não informado';
      return String(value);
    };
    
    // Coluna 1
    y = addDataLine('Formulário', record.formulario, 1, y);
    y = addDataLine('REURB Nº', record.id ? `REURB Nº.: ${record.id}` : 'Não informado', 1, y);
    y = addDataLine('TIPO DE REURB', record.tipo_reurb || 'REURB-S', 1, y);
    y = addDataLine('Quadra', record.quadra, 1, y);
    y = addDataLine('Lote', record.lote, 1, y);
    y = addDataLine('Requerente', record.requerente, 1, y);
    y = addDataLine('RG', record.rg, 1, y);
    
    // Coluna 2 (reset Y para começar na mesma altura)
    let yCol2 = y - (7 * 6); // Voltar para mesma altura da coluna 1
    yCol2 = addDataLine('CPF', record.cpf, 2, yCol2);
    yCol2 = addDataLine('Profissão', record.profissao, 2, yCol2);
    yCol2 = addDataLine('NIS', record.nis, 2, yCol2);
    yCol2 = addDataLine('Estado Civil', record.estado_civil, 2, yCol2);
    yCol2 = addDataLine('Cônjuge', record.conjuge, 2, yCol2);
    yCol2 = addDataLine('Renda Familiar', record.renda_familiar, 2, yCol2);
    
    // Ajustar Y para a próxima seção
    y = Math.max(y, yCol2) + 10;
    
    // ============ DADOS DO IMÓVEL E FAMILIARES ============
    // Reset para 2 colunas
    let yTemp = y;
    
    yTemp = addDataLine('Moradores', record.num_moradores, 1, yTemp);
    yTemp = addDataLine('Endereço', record.endereco, 1, yTemp);
    yTemp = addDataLine('CPF Cônjuge', record.cpf_conjuge, 1, yTemp);
    yTemp = addDataLine('Tempo Moradia', record.tempo_moradia, 1, yTemp);
    yTemp = addDataLine('Construção', record.construcao, 1, yTemp);
    yTemp = addDataLine('Filhos', record.num_filhos, 1, yTemp);
    
    yTemp = y; // Reset para coluna 2
    yTemp = addDataLine('Filhos Menores', record.filhos_menores, 2, yTemp);
    yTemp = addDataLine('Tipo Aquisição', record.tipo_aquisicao, 2, yTemp);
    yTemp = addDataLine('Uso Imóvel', record.uso_imovel, 2, yTemp);
    yTemp = addDataLine('Telhado', record.telhado, 2, yTemp);
    yTemp = addDataLine('Piso', record.piso, 2, yTemp);
    yTemp = addDataLine('Divisa', record.divisa, 2, yTemp);
    
    y = Math.max(yTemp, yTemp) + 10;
    
    // ============ INFRAESTRUTURA ============
    // Título da seção
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('INFRAESTRUTURA:', margin, y);
    y += 8;
    
    // Infraestrutura em 2 colunas
    let yInfra = y;
    
    yInfra = addDataLine('Água', record.agua, 1, yInfra);
    yInfra = addDataLine('Esgoto', record.esgoto, 1, yInfra);
    yInfra = addDataLine('Pavimentação', record.pavimentacao, 1, yInfra);
    
    yInfra = y; // Reset para coluna 2
    yInfra = addDataLine('Energia', record.energia, 2, yInfra);
    yInfra = addDataLine('Comodos', record.comodos, 2, yInfra);
    yInfra = addDataLine('Análise IA', record.analise_ia, 2, yInfra);
    
    y = Math.max(yInfra, yInfra) + 15;
    
    // ============ ASSINATURAS ============
    // Título das assinaturas
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASSINATURAS', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    // Linha divisória
    pdf.line(margin, y, pageWidth - margin, y);
    y += 5;
    
    // Container para assinaturas
    const signatureWidth = (pageWidth - 2 * margin - 20) / 2;
    
    // Assinatura do Vistoriador (esquerda)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Vistoriador:', margin, y);
    
    if (record.assinatura_vistoriador && record.assinatura_vistoriador.trim() !== '') {
      try {
        const imgData = record.assinatura_vistoriador.includes(',') 
          ? record.assinatura_vistoriador.split(',')[1] 
          : record.assinatura_vistoriador;
        pdf.addImage(imgData, 'PNG', margin, y + 5, 80, 30);
        y += 40;
      } catch (err) {
        pdf.setFont('helvetica', 'normal');
        pdf.text('(assinatura digital)', margin, y + 10);
        y += 15;
      }
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.text('__________________________', margin, y + 10);
      y += 20;
    }
    
    // Assinatura do Requerente (direita)
    y = y - 40; // Reset Y para mesma linha
    pdf.setFont('helvetica', 'bold');
    pdf.text('Requerente:', pageWidth - margin - 80, y);
    
    if (record.assinatura_requerente && record.assinatura_requerente.trim() !== '') {
      try {
        const imgData = record.assinatura_requerente.includes(',') 
          ? record.assinatura_requerente.split(',')[1] 
          : record.assinatura_requerente;
        pdf.addImage(imgData, 'PNG', pageWidth - margin - 80, y + 5, 80, 30);
      } catch (err) {
        pdf.setFont('helvetica', 'normal');
        pdf.text('(assinatura digital)', pageWidth - margin - 80, y + 10);
      }
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.text('__________________________', pageWidth - margin - 80, y + 10);
    }
    
    y += 50;
    
    // ============ RODAPÉ ============
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const footerY = pageHeight - 10;
    pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, footerY, { align: 'center' });
    pdf.text(`ID do Registro: ${record.id}`, pageWidth / 2, footerY - 5, { align: 'center' });
    
    // Converter para blob e URL
    const blob = pdf.output('blob');
    const urlObj = URL.createObjectURL(blob);
    
    console.log('✅ PDF formatado gerado com sucesso!');
    setPdfUrl(urlObj);
    
  } catch (err: any) {
    console.error('❌ Erro ao gerar PDF:', err);
    setErrorPdf(err.message || 'Erro ao gerar PDF');
    hasProcessedRef.current = '';
  } finally {
    setLoadingPdf(false);
  }
};

// Função auxiliar para carregar imagens
const loadImage = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = src;
  });
};