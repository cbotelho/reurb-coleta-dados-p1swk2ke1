import { Project, Lote, Quadra } from '@/types'
import { format } from 'date-fns'

export const reportService = {
  generateProjectReport: (
    project: Project,
    quadras: Quadra[],
    lotes: Lote[],
  ) => {
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0;">Relatório de Projeto</h1>
          <p style="color: #666;">Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #2563eb;">${project.field_348}</h2>
          <p><strong>ID:</strong> ${project.id || project.local_id}</p>
          <p><strong>Status:</strong> ${project.sync_status}</p>
          <p><strong>Total de Quadras:</strong> ${quadras.length}</p>
          <p><strong>Total de Lotes:</strong> ${lotes.length}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3>Quadras</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6; text-align: left;">
                <th style="padding: 10px; border: 1px solid #ddd;">Nome</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Área</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${quadras
                .map(
                  (q) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${q.field_329}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${q.field_330}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${q.sync_status}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Resumo de Lotes</h3>
          <p>Existem ${lotes.length} lotes cadastrados neste projeto. Detalhes completos disponíveis no relatório individual de lotes.</p>
        </div>
      </div>
    `
    printContent(content)
  },

  generateLoteReport: (lote: Lote, quadraName: string, projectName: string) => {
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0;">Ficha do Lote</h1>
          <p style="color: #666;">Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #666; margin-bottom: 5px;">Identificação</h3>
            <p style="font-size: 1.2em; font-weight: bold; margin: 0;">${lote.field_338}</p>
          </div>
          <div>
            <h3 style="color: #666; margin-bottom: 5px;">Área</h3>
            <p style="font-size: 1.2em; margin: 0;">${lote.field_339}</p>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <p><strong>Projeto:</strong> ${projectName}</p>
          <p><strong>Quadra:</strong> ${quadraName}</p>
          <p><strong>Status de Sincronização:</strong> ${lote.sync_status}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3>Memorial Descritivo</h3>
          <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px; min-height: 100px;">
            ${lote.field_340 || 'Nenhuma descrição informada.'}
          </div>
        </div>

        <div>
          <h3>Anexos</h3>
          <p>${lote.field_352 && lote.field_352.length > 0 ? `${lote.field_352.length} imagens anexadas.` : 'Nenhuma imagem anexada.'}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
            ${
              lote.field_352
                ?.map(
                  (img, i) => `
              <div style="width: 150px; height: 150px; background-color: #eee; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;">
                 <img src="${img}" style="max-width: 100%; max-height: 100%; object-fit: cover;" alt="Foto ${i + 1}" />
              </div>
            `,
                )
                .join('') || ''
            }
          </div>
        </div>
      </div>
    `
    printContent(content)
  },
}

function printContent(html: string) {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório REURB</title>
        </head>
        <body>
          ${html}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  } else {
    alert('Por favor, permita popups para gerar o relatório.')
  }
}
