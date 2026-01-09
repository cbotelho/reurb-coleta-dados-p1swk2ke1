// Tipos para o sistema de importação CSV
export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface ColumnMapping {
  [csvColumnName: string]: string; // Chave: coluna CSV, Valor: coluna do banco
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: string[];
  duplicates?: number;
}

export interface CSVImportConfig {
  tableName: 'reurb_quadras' | 'reurb_properties';
  batchSize: number;
  conflictColumn?: string;
  skipDuplicates: boolean;
}

export interface ParsedCSVData {
  headers: string[];
  data: any[];
  totalRows: number;
}
