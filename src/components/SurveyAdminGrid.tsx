// ==================== FUNÇÃO PARA GERAR PDF ====================
const generateFormattedPDF = async (surveyId: string) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Configurações do Supabase não encontradas.");
    }

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

    // Função para carregar imagem do Supabase Storage
    const loadImageFromStorage = async (path: string): Promise<string> => {
      try {
        // Se for URL completa
        if (path.startsWith('http')) {
          return await loadImage(path);
        }
        // Se for path do storage
        const url = `${SUPABASE_URL}/storage/v1/object/public/${path}`;
        return await loadImage(url);
      } catch (error) {
        console.warn('Erro ao carregar imagem:', path);
        return '';
      }
    };

    const url = `${SUPABASE_URL}/rest/v1/vw_reurb_surveys_admin?id=eq.${surveyId}`;
    
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
    const margin = 15;
    let y = margin;
    
    // ============ CABEÇALHO COM LOGOS ============
    // Logo GEA (esquerda)
    try {
      const geaLogo = await loadImage('/gea_logo.jpg');
      pdf.addImage(geaLogo, 'JPEG', margin, y, 25, 25);
    } catch (e) {
      console.log('Logo GEA não carregada');
    }
    
    // Logo Amapá Terras (direita)
    try {
      const amapaLogo = await loadImage('/amapaTerra.jpeg');
      pdf.addImage(amapaLogo, 'JPEG', pageWidth - margin - 25, y, 25, 25);
    } catch (e) {
      console.log('Logo Amapá Terras não carregada');
    }
    
    // Título centralizado
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GOVERNO DO ESTADO DO AMAPÁ', pageWidth / 2, y + 8, { align: 'center' });
    pdf.text('Amapá Terras - Instituto de Terras do Amapá', pageWidth / 2, y + 14, { align: 'center' });
    
    y += 30;
    
    // ============ TÍTULO PRINCIPAL ============
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE VISTORIA REURB', pageWidth / 2, y, { align: 'center' });
    
    y += 10;
    
    // Linha divisória
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    
    y += 15;
    
    // ============ DADOS DO PROJETO ============
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Projeto:', margin, y);
    pdf.setFont('helvetica', 'normal');
    
    const projetoText = record.projeto || 'Não informado';
    const projetoLines = pdf.splitTextToSize(projetoText, 120);
    pdf.text(projetoLines, margin + 22, y);
    y += projetoLines.length * 5 + 10;
    
    // ============ DADOS PRINCIPAIS (LAYOUT EM 2 COLUNAS FIXAS) ============
    const col1X = margin;
    const col2X = 110; // Posição fixa para segunda coluna
    const lineHeight = 6;
    
    // Função otimizada para adicionar dados
    const addField = (label: string, value: any, col: number, currentY: number) => {
      const x = col === 1 ? col1X : col2X;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, x, currentY);
      
      pdf.setFont('helvetica', 'normal');
      const formattedValue = formatValue(value);
      
      // Calcula largura máxima para o valor
      const maxWidth = col === 1 ? 80 : 85;
      const lines = pdf.splitTextToSize(formattedValue, maxWidth);
      
      // Adiciona o valor
      pdf.text(lines, x + 22, currentY);
      
      // Retorna nova posição Y
      return currentY + (Math.max(1, lines.length) * lineHeight);
    };
    
    const formatValue = (value: any): string => {
      if (value === null || value === undefined || value === '') return 'Não informado';
      if (value === true) return 'Sim';
      if (value === false) return 'Não';
      return String(value);
    };
    
    // Extrair número REURB do formulário
    let reurbNumber = 'Não informado';
    if (record.formulario) {
      // Remove "REURB N°.:" e pega só o número
      reurbNumber = record.formulario.replace(/REURB\s*N[°\.:]\s*[:]?\s*/i, '').trim();
    }
    
    // Tipo de REURB (usa análise_ia se disponível)
    const tipoReurb = record.analise_ia || 'REURB-S';
    
    // ===== COLUNA 1 =====
    let y1 = y;
    y1 = addField('Formulário', 'REURB', 1, y1);
    y1 = addField('REURB Nº', reurbNumber, 1, y1);
    y1 = addField('TIPO DE REURB', tipoReurb, 1, y1);
    y1 = addField('Quadra', record.quadra, 1, y1);
    y1 = addField('Lote', record.lote, 1, y1);
    y1 = addField('Requerente', record.requerente, 1, y1);
    y1 = addField('RG', record.rg, 1, y1);
    y1 = addField('CPF', record.cpf, 1, y1);
    
    // ===== COLUNA 2 =====
    let y2 = y;
    y2 = addField('Profissão', record.profissao, 2, y2);
    y2 = addField('NIS', record.nis, 2, y2);
    y2 = addField('Estado Civil', record.estado_civil, 2, y2);
    y2 = addField('Cônjuge', record.conjuge, 2, y2);
    y2 = addField('Renda Familiar', record.renda_familiar, 2, y2);
    y2 = addField('Moradores', record.num_moradores, 2, y2);
    y2 = addField('Filhos', record.num_filhos, 2, y2);
    y2 = addField('Filhos Menores', record.filhos_menores, 2, y2);
    
    // Ajusta Y para a maior coluna
    y = Math.max(y1, y2) + 12;
    
    // ============ DADOS DO IMÓVEL ============
    // Linha divisória
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;
    
    // Título da seção
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DO IMÓVEL', margin, y);
    y += 10;
    
    // Reset Y para as colunas
    y1 = y;
    y2 = y;
    
    // Coluna 1 - Dados do imóvel
    y1 = addField('Endereço', record.endereco, 1, y1);
    y1 = addField('Tempo Moradia', record.tempo_moradia, 1, y1);
    y1 = addField('Tipo Aquisição', record.tipo_aquisicao, 1, y1);
    y1 = addField('Uso Imóvel', record.uso_imovel, 1, y1);
    y1 = addField('Construção', record.construcao, 1, y1);
    y1 = addField('Telhado', record.telhado, 1, y1);
    
    // Coluna 2 - Mais dados do imóvel
    y2 = addField('Piso', record.piso, 2, y2);
    y2 = addField('Divisa', record.divisa, 2, y2);
    y2 = addField('Comodos', record.comodos, 2, y2);
    y2 = addField('Água', record.agua, 2, y2);
    y2 = addField('Energia', record.energia, 2, y2);
    y2 = addField('Esgoto', record.esgoto, 2, y2);
    y2 = addField('Pavimentação', record.pavimentacao, 2, y2);
    y2 = addField('Análise IA', record.analise_ia, 2, y2);
    
    y = Math.max(y1, y2) + 15;
    
    // ============ DOCUMENTOS DA VISTORIA (SE HOUVER) ============
    let documentosText = 'Nenhum documento anexado';
    if (record.documentos_vistoria) {
      try {
        const documentos = typeof record.documentos_vistoria === 'string' 
          ? JSON.parse(record.documentos_vistoria)
          : record.documentos_vistoria;
        
        if (Array.isArray(documentos) && documentos.length > 0) {
          documentosText = `Documentos anexados (${documentos.length}): ${documentos.join(', ')}`;
        } else if (typeof documentos === 'object' && documentos !== null) {
          documentosText = `Documentos: ${Object.keys(documentos).join(', ')}`;
        }
      } catch (e) {
        documentosText = `Documentos: ${record.documentos_vistoria}`;
      }
    }
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Documentos da Vistoria:', margin, y);
    pdf.setFont('helvetica', 'normal');
    const docLines = pdf.splitTextToSize(documentosText, pageWidth - 2 * margin - 22);
    pdf.text(docLines, margin + 22, y);
    y += docLines.length * 5 + 10;
    
    // ============ ASSINATURAS ============
    // Verifica se ainda cabe na página
    if (y > pageHeight - 100) {
      pdf.addPage();
      y = margin;
    }
    
    // Título das assinaturas
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASSINATURAS', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    // Linha divisória
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 12;
    
    // Assinaturas lado a lado
    const signatureY = y;
    const signatureWidth = 70;
    const signatureHeight = 20;
    
    // Assinatura do Vistoriador (esquerda)
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VISTORIADOR:', margin, signatureY);
    
    if (record.assinatura_vistoriador && record.assinatura_vistoriador.trim() !== '') {
      try {
        const imgData = record.assinatura_vistoriador.includes(',') 
          ? record.assinatura_vistoriador.split(',')[1] 
          : record.assinatura_vistoriador;
        pdf.addImage(imgData, 'PNG', margin, signatureY + 5, signatureWidth, signatureHeight);
      } catch (err) {
        pdf.setFont('helvetica', 'normal');
        pdf.line(margin, signatureY + 12, margin + signatureWidth, signatureY + 12);
      }
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.line(margin, signatureY + 12, margin + signatureWidth, signatureY + 12);
    }
    
    // Assinatura do Requerente (direita)
    pdf.setFont('helvetica', 'bold');
    pdf.text('REQUERENTE:', pageWidth - margin - signatureWidth, signatureY);
    
    if (record.assinatura_requerente && record.assinatura_requerente.trim() !== '') {
      try {
        const imgData = record.assinatura_requerente.includes(',') 
          ? record.assinatura_requerente.split(',')[1] 
          : record.assinatura_requerente;
        pdf.addImage(imgData, 'PNG', pageWidth - margin - signatureWidth, signatureY + 5, signatureWidth, signatureHeight);
      } catch (err) {
        pdf.setFont('helvetica', 'normal');
        pdf.line(pageWidth - margin - signatureWidth, signatureY + 12, pageWidth - margin, signatureY + 12);
      }
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.line(pageWidth - margin - signatureWidth, signatureY + 12, pageWidth - margin, signatureY + 12);
    }
    
    y = signatureY + signatureHeight + 25;
    
    // ============ FOTOS DE FACHADA (3 COLUNAS NO RODAPÉ) ============
    // Verifica se precisa de nova página para as fotos
    if (y > pageHeight - 100) {
      pdf.addPage();
      y = margin;
    }
    
    // Título da seção de fotos
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FOTOS DE FACHADA DO IMÓVEL', pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    // Linha divisória
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 12;
    
    // Processar fotos de fachada
    let fotosArray: string[] = [];
    
    if (record.fotos_fachada) {
      try {
        // Tentar parsear como JSON
        const fotos = typeof record.fotos_fachada === 'string' 
          ? JSON.parse(record.fotos_fachada)
          : record.fotos_fachada;
        
        if (Array.isArray(fotos)) {
          fotosArray = fotos.filter((foto: any) => foto && typeof foto === 'string');
        } else if (typeof fotos === 'string' && fotos.trim() !== '') {
          fotosArray = [fotos];
        }
      } catch (e) {
        // Se não for JSON, trata como string única
        if (typeof record.fotos_fachada === 'string' && record.fotos_fachada.trim() !== '') {
          fotosArray = [record.fotos_fachada];
        }
      }
    }
    
    // Configurações para layout de 3 colunas
    const fotoWidth = (pageWidth - 2 * margin - 20) / 3; // 20px de espaçamento
    const fotoHeight = 50;
    const fotoSpacing = 10;
    
    if (fotosArray.length > 0) {
      let fotoY = y;
      let colIndex = 0;
      
      // Processar no máximo 6 fotos por página (2 linhas de 3)
      const maxFotosPerPage = 6;
      const fotosToShow = fotosArray.slice(0, maxFotosPerPage);
      
      for (let i = 0; i < fotosToShow.length; i++) {
        const foto = fotosToShow[i];
        const col = i % 3;
        const row = Math.floor(i / 3);
        
        const fotoX = margin + col * (fotoWidth + fotoSpacing);
        const currentFotoY = fotoY + row * (fotoHeight + fotoSpacing + 15);
        
        // Adicionar número da foto
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Foto ${i + 1}`, fotoX + fotoWidth / 2, currentFotoY - 2, { align: 'center' });
        
        // Tentar carregar e adicionar a imagem
        try {
          const imgData = await loadImageFromStorage(foto);
          if (imgData) {
            pdf.addImage(imgData, 'JPEG', fotoX, currentFotoY, fotoWidth, fotoHeight);
          } else {
            // Placeholder se imagem não carregar
            pdf.setFillColor(240, 240, 240);
            pdf.rect(fotoX, currentFotoY, fotoWidth, fotoHeight, 'F');
            pdf.setFontSize(7);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Imagem não disponível', fotoX + fotoWidth / 2, currentFotoY + fotoHeight / 2, { align: 'center' });
            pdf.setTextColor(0, 0, 0);
          }
        } catch (error) {
          // Placeholder em caso de erro
          pdf.setFillColor(240, 240, 240);
          pdf.rect(fotoX, currentFotoY, fotoWidth, fotoHeight, 'F');
          pdf.setFontSize(7);
          pdf.setTextColor(150, 150, 150);
          pdf.text('Erro ao carregar', fotoX + fotoWidth / 2, currentFotoY + fotoHeight / 2, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
        
        // Atualizar Y máximo
        if (row === 1) {
          y = Math.max(y, currentFotoY + fotoHeight + 20);
        }
      }
      
      // Se houver mais fotos, adicionar indicação
      if (fotosArray.length > maxFotosPerPage) {
        const maisFotos = fotosArray.length - maxFotosPerPage;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`+ ${maisFotos} foto(s) adicional(is) no sistema`, pageWidth / 2, y, { align: 'center' });
        y += 8;
      }
      
      y = fotoY + 2 * (fotoHeight + fotoSpacing + 15) + 15;
    } else {
      // Mensagem se não houver fotos
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Nenhuma foto de fachada disponível', pageWidth / 2, y + 25, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      y += 60;
    }
    
    // ============ RODAPÉ ============
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const footerY = pageHeight - 8;
    pdf.text(`ID do Registro: ${record.id}`, margin, footerY - 5);
    pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, footerY, { align: 'center' });
    pdf.text(`Total de fotos: ${fotosArray.length}`, pageWidth - margin, footerY - 5, { align: 'right' });
    
    // Converter para blob e URL
    const blob = pdf.output('blob');
    const urlObj = URL.createObjectURL(blob);
    
    console.log('✅ PDF formatado gerado com sucesso!');
    return urlObj;
    
  } catch (err: any) {
    console.error('❌ Erro ao gerar PDF:', err);
    throw err;
  }
};