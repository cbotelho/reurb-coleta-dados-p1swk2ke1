# download_all_data.py
import psycopg2
import pandas as pd
import json
import csv
import os
from datetime import datetime
import zipfile
from tqdm import tqdm

class SupabaseDataExporter:
    def __init__(self, connection_params):
        """
        Inicializa o exportador de dados
        """
        self.conn_params = connection_params
        self.conn = None
        self.cursor = None
        self.output_dir = f"supabase_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
    def connect(self):
        """Estabelece conexão com o banco"""
        try:
            self.conn = psycopg2.connect(**self.conn_params)
            self.cursor = self.conn.cursor()
            print("✅ Conexão estabelecida com sucesso!")
            return True
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
            return False
    
    def get_all_tables(self):
        """Obtém todas as tabelas do schema public"""
        query = """
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
        """
        self.cursor.execute(query)
        return self.cursor.fetchall()
    
    def get_table_columns(self, table_name):
        """Obtém colunas de uma tabela"""
        query = """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = %s
        ORDER BY ordinal_position;
        """
        self.cursor.execute(query, (table_name,))
        return self.cursor.fetchall()
    
    def get_table_data(self, table_name, limit=None):
        """Obtém dados de uma tabela"""
        limit_clause = f" LIMIT {limit}" if limit else ""
        query = f"SELECT * FROM {table_name}{limit_clause};"
        
        try:
            self.cursor.execute(query)
            columns = [desc[0] for desc in self.cursor.description]
            data = self.cursor.fetchall()
            return columns, data
        except Exception as e:
            print(f"❌ Erro ao buscar dados da tabela {table_name}: {e}")
            return [], []
    
    def export_table_to_csv(self, table_name, columns, data):
        """Exporta tabela para CSV"""
        csv_path = os.path.join(self.output_dir, 'csv', f"{table_name}.csv")
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(columns)
            writer.writerows(data)
        
        return csv_path
    
    def export_table_to_json(self, table_name, columns, data):
        """Exporta tabela para JSON"""
        json_path = os.path.join(self.output_dir, 'json', f"{table_name}.json")
        
        # Converter para dicionário
        records = []
        for row in data:
            record = {}
            for i, col in enumerate(columns):
                # Converter tipos específicos para serialização JSON
                value = row[i]
                if isinstance(value, (datetime, pd.Timestamp)):
                    value = value.isoformat()
                elif isinstance(value, (dict, list)):
                    pass  # Mantém como está
                elif value is None:
                    value = None
                record[col] = value
            records.append(record)
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump({
                "table_name": table_name,
                "timestamp": datetime.now().isoformat(),
                "row_count": len(data),
                "data": records
            }, f, indent=2, ensure_ascii=False, default=str)
        
        return json_path
    
    def export_table_to_sql(self, table_name, columns, data):
        """Exporta tabela para SQL INSERT"""
        sql_path = os.path.join(self.output_dir, 'sql', f"{table_name}.sql")
        
        with open(sql_path, 'w', encoding='utf-8') as f:
            f.write(f"-- Dados da tabela: {table_name}\n")
            f.write(f"-- Exportado em: {datetime.now()}\n")
            f.write(f"-- Total de registros: {len(data)}\n\n")
            
            if data:
                # Gerar INSERTs em lotes
                batch_size = 100
                for i in range(0, len(data), batch_size):
                    batch = data[i:i+batch_size]
                    columns_str = ', '.join(f'"{col}"' for col in columns)
                    f.write(f"INSERT INTO {table_name} ({columns_str}) VALUES\n")
                    
                    rows = []
                    for row in batch:
                        values = []
                        for value in row:
                            if value is None:
                                values.append('NULL')
                            elif isinstance(value, (int, float)):
                                values.append(str(value))
                            elif isinstance(value, bool):
                                values.append('TRUE' if value else 'FALSE')
                            else:
                                # Escapar aspas simples
                                escaped = str(value).replace("'", "''")
                                values.append(f"'{escaped}'")
                        
                        rows.append(f"  ({', '.join(values)})")
                    
                    f.write(',\n'.join(rows))
                    f.write(';\n\n')
        
        return sql_path
    
    def export_table_to_excel(self, table_name, columns, data):
        """Exporta tabela para Excel"""
        excel_path = os.path.join(self.output_dir, 'excel', f"{table_name}.xlsx")
        
        df = pd.DataFrame(data, columns=columns)
        
        # Converter tipos de data
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    df[col] = pd.to_datetime(df[col])
                except:
                    pass
        
        df.to_excel(excel_path, index=False, engine='openpyxl')
        return excel_path
    
    def create_database_dump(self):
        """Cria dump completo do banco usando pg_dump"""
        dump_path = os.path.join(self.output_dir, 'database_dump.sql')
        
        # Comando pg_dump
        dump_cmd = f"""
        pg_dump -h {self.conn_params['host']} \
                -p {self.conn_params['port']} \
                -U {self.conn_params['user']} \
                -d {self.conn_params['database']} \
                --clean --if-exists --no-owner --no-privileges \
                --schema=public \
                --file="{dump_path}"
        """
        
        # Definir senha como variável de ambiente
        import subprocess
        import os
        os.environ['PGPASSWORD'] = self.conn_params['password']
        
        try:
            print("📦 Criando dump completo do banco...")
            subprocess.run(dump_cmd, shell=True, check=True)
            print(f"✅ Dump criado: {dump_path}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Erro ao criar dump: {e}")
        
        return dump_path
    
    def export_all_data(self, formats=None, limit_per_table=None):
        """
        Exporta todos os dados em múltiplos formatos
        
        Args:
            formats: Lista de formatos ['csv', 'json', 'sql', 'excel']
            limit_per_table: Limite de registros por tabela (None para todos)
        """
        if formats is None:
            formats = ['csv', 'json', 'sql']
        
        # Criar diretórios de saída
        os.makedirs(self.output_dir, exist_ok=True)
        for fmt in formats:
            os.makedirs(os.path.join(self.output_dir, fmt), exist_ok=True)
        
        # Obter todas as tabelas
        tables = self.get_all_tables()
        print(f"📊 Encontradas {len(tables)} tabelas\n")
        
        # Relatório de progresso
        report = {
            "export_date": datetime.now().isoformat(),
            "database": self.conn_params['database'],
            "host": self.conn_params['host'],
            "tables": []
        }
        
        # Exportar cada tabela
        for table_name, table_type in tqdm(tables, desc="Exportando tabelas"):
            print(f"\n📋 Processando: {table_name} ({table_type})")
            
            # Obter colunas e dados
            columns = [col[0] for col in self.get_table_columns(table_name)]
            col_names, data = self.get_table_data(table_name, limit_per_table)
            
            if not data:
                print(f"   ⚠️  Tabela vazia ou sem acesso")
                continue
            
            table_report = {
                "table_name": table_name,
                "table_type": table_type,
                "columns": len(columns),
                "rows_exported": len(data),
                "formats": [],
                "files": {}
            }
            
            # Exportar em cada formato solicitado
            for fmt in formats:
                try:
                    if fmt == 'csv':
                        file_path = self.export_table_to_csv(table_name, col_names, data)
                    elif fmt == 'json':
                        file_path = self.export_table_to_json(table_name, col_names, data)
                    elif fmt == 'sql':
                        file_path = self.export_table_to_sql(table_name, col_names, data)
                    elif fmt == 'excel':
                        file_path = self.export_table_to_excel(table_name, col_names, data)
                    
                    table_report["formats"].append(fmt)
                    table_report["files"][fmt] = os.path.basename(file_path)
                    print(f"   ✅ Exportado {fmt.upper()}: {len(data)} registros")
                    
                except Exception as e:
                    print(f"   ❌ Erro ao exportar {fmt.upper()}: {e}")
            
            report["tables"].append(table_report)
        
        # Salvar relatório
        report_path = os.path.join(self.output_dir, 'export_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # Compactar tudo em ZIP
        self.create_zip_archive()
        
        print(f"\n🎉 Exportação concluída!")
        print(f"📁 Diretório: {os.path.abspath(self.output_dir)}")
        print(f"📄 Relatório: {report_path}")
        
        return self.output_dir
    
    def create_zip_archive(self):
        """Cria arquivo ZIP com todos os dados"""
        zip_path = f"{self.output_dir}.zip"
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(self.output_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, self.output_dir)
                    zipf.write(file_path, arcname)
        
        print(f"📦 Arquivo ZIP criado: {zip_path}")
        return zip_path
    
    def close(self):
        """Fecha conexão"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("🔌 Conexão fechada")

def main():
    """Função principal"""
    # Configurações de conexão
    CONNECTION_PARAMS = {
        'host': 'db.SEU_PROJETO.supabase.co',
        'port': 5432,
        'database': 'postgres',
        'user': 'postgres',
        'password': 'SUA_SENHA_DO_PROJETO'
    }
    
    # OU usar variáveis de ambiente (recomendado)
    import os
    CONNECTION_PARAMS = {
        'host': os.getenv('SUPABASE_HOST', 'db.SEU_PROJETO.supabase.co'),
        'port': int(os.getenv('SUPABASE_PORT', 5432)),
        'database': os.getenv('SUPABASE_DB', 'postgres'),
        'user': os.getenv('SUPABASE_USER', 'postgres'),
        'password': os.getenv('SUPABASE_PASSWORD', '')
    }
    
    # Criar exportador
    exporter = SupabaseDataExporter(CONNECTION_PARAMS)
    
    try:
        # Conectar
        if not exporter.connect():
            return
        
        # Exportar todos os dados
        # formats: escolha entre ['csv', 'json', 'sql', 'excel']
        # limit_per_table: None para todos os dados, ou número para limitar
        output_dir = exporter.export_all_data(
            formats=['csv', 'json', 'sql'],
            limit_per_table=None  # None para exportar tudo
        )
        
    except Exception as e:
        print(f"❌ Erro durante exportação: {e}")
    finally:
        exporter.close()

if __name__ == "__main__":
    main()