import { supabase } from '@/lib/supabase/client';
import { TableColumn, ColumnMapping, ImportResult, CSVImportConfig, ParsedCSVData } from '@/types/csv-import.types';
import Papa from 'papaparse';

export class CSVImportService {
  // Verificar se usuário pode importar
  static async canImport(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('can_import_csv', { table_name: tableName });

      if (error) {
        console.error('Erro ao verificar permissão:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Erro em canImport:', error);
      return false;
    }
  }

  // Buscar colunas de uma tabela específica
  static async getTableColumns(tableName: string): Promise<TableColumn[]> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_table_columns', { table_name_input: tableName });

      if (error) {
        console.error('Erro ao buscar colunas da tabela:', error);
        throw new Error(`Erro ao buscar colunas: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro em getTableColumns:', error);
      throw error;
    }
  }

  // Parse do arquivo CSV
  static parseCSV(file: File): Promise<ParsedCSVData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('Avisos do parsing CSV:', results.errors);
          }

          const headers = Object.keys(results.data[0] || {});
          const cleanData = results.data.filter(row => 
            Object.values(row).some(value => value !== null && value !== undefined && value !== '')
          );

          resolve({
            headers,
            data: cleanData,
            totalRows: cleanData.length
          });
        },
        error: (error) => {
          reject(new Error(`Erro ao ler arquivo CSV: ${error.message}`));
        }
      });
    });
  }

  // Transformar dados baseado no mapeamento
  static transformData(
    csvData: any[], 
    mapping: ColumnMapping, 
    dbColumns: TableColumn[]
  ): any[] {
    const columnTypes = new Map(
      dbColumns.map(col => [col.column_name, col.data_type])
    );

    return csvData.map((row, index) => {
      const transformedRow: any = {};

      Object.entries(mapping).forEach(([csvCol, dbCol]) => {
        if (!csvCol || !dbCol) return;

        const value = row[csvCol];
        const expectedType = columnTypes.get(dbCol);

        // Conversão de tipos
        if (value !== null && value !== undefined && value !== '') {
          transformedRow[dbCol] = this.convertType(value, expectedType);
        }
      });

      return transformedRow;
    });
  }

  // Conversão de tipos baseado no tipo do PostgreSQL
  private static convertType(value: string, pgType: string): any {
    if (!value) return null;

    const cleanValue = value.toString().trim();

    // UUID
    if (pgType?.includes('uuid')) {
      // Validação básica de UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(cleanValue) ? cleanValue : null;
    }

    // Tipos numéricos inteiros
    if (pgType?.includes('int') || pgType?.includes('bigint')) {
      const num = parseInt(cleanValue.replace(/[^\d-]/g, ''));
      return isNaN(num) ? null : num;
    }

    // Tipos decimais/float/double precision
    if (pgType?.includes('decimal') || pgType?.includes('float') || pgType?.includes('double') || pgType?.includes('numeric')) {
      const num = parseFloat(cleanValue.replace(/[^\d.-]/g, ''));
      return isNaN(num) ? null : num;
    }

    // Boolean
    if (pgType?.includes('boolean')) {
      const lower = cleanValue.toLowerCase();
      return ['true', '1', 'sim', 'yes', 'verdadeiro'].includes(lower);
    }

    // Date
    if (pgType?.includes('date') && !pgType?.includes('timestamp')) {
      const date = new Date(cleanValue);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }

    // Timestamp/DateTime
    if (pgType?.includes('timestamp') || pgType?.includes('datetime')) {
      const date = new Date(cleanValue);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }

    // Array (para o campo images)
    if (pgType?.includes('ARRAY')) {
      // Se o valor vier como JSON string ou separado por vírgulas
      try {
        if (cleanValue.startsWith('[')) {
          return JSON.parse(cleanValue);
        }
        return cleanValue.split(',').map(item => item.trim()).filter(Boolean);
      } catch {
        return [cleanValue];
      }
    }

    // JSON/JSONB
    if (pgType?.includes('json')) {
      try {
        return JSON.parse(cleanValue);
      } catch {
        return { value: cleanValue };
      }
    }

    // Text/Varchar (padrão)
    return cleanValue;
  }

  // Importar dados em lotes
  static async importData(
    config: CSVImportConfig,
    transformedData: any[],
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> {
    const { tableName, batchSize = 500, conflictColumn, skipDuplicates = true } = config;
    const errors: string[] = [];
    let importedRows = 0;
    let duplicates = 0;

    try {
      // Processar em lotes
      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        
        try {
          let result;
          
          if (skipDuplicates && conflictColumn) {
            // Usar upsert para evitar duplicatas
            result = await (supabase as any)
              .from(tableName)
              .upsert(batch, { 
                onConflict: conflictColumn,
                ignoreDuplicates: true 
              });
          } else {
            // Insert normal
            result = await (supabase as any)
              .from(tableName)
              .insert(batch);
          }

          if (result.error) {
            errors.push(`Lote ${i + 1}-${Math.min(i + batchSize, transformedData.length)}: ${result.error.message}`);
          } else {
            importedRows += batch.length;
          }

          // Atualizar progresso
          const progress = Math.min((i + batchSize) / transformedData.length * 100, 100);
          onProgress?.(progress);

        } catch (error) {
          errors.push(`Erro no lote ${i + 1}-${Math.min(i + batchSize, transformedData.length)}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        totalRows: transformedData.length,
        importedRows,
        errors,
        duplicates
      };

    } catch (error) {
      return {
        success: false,
        totalRows: transformedData.length,
        importedRows: 0,
        errors: [`Erro geral na importação: ${error}`]
      };
    }
  }

  // Validar mapeamento antes da importação
  static validateMapping(
    mapping: ColumnMapping, 
    requiredColumns: string[]
  ): { isValid: boolean; missingColumns: string[] } {
    const mappedColumns = Object.values(mapping).filter(Boolean);
    const missingColumns = requiredColumns.filter(col => !mappedColumns.includes(col));

    return {
      isValid: missingColumns.length === 0,
      missingColumns
    };
  }
}
