# Exemplos de CSV para Importação REURB

## 📄 Exemplo CSV - Quadras (reurb_quadras)

```csv
name,project_id,area,description,status,document_url,image_url
Quadra A,550e8400-e29b-41d4-a716-446655440000,1500.50,Quadra principal do projeto,ativo,https://docs.com/quadra-a.pdf,https://images.com/quadra-a.jpg
Quadra B,550e8400-e29b-41d4-a716-446655440001,1200.75,Quadra secundária,ativo,https://docs.com/quadra-b.pdf,https://images.com/quadra-b.jpg
Quadra C,550e8400-e29b-41d4-a716-446655440002,2000.00,Quadra de expansão,pendente,https://docs.com/quadra-c.pdf,
```

## 📄 Exemplo CSV - Lotes/Propriedades (reurb_properties)

```csv
name,quadra_id,address,area,area_terreno,area_construida,latitude,longitude,status,tipo_posse,situacao_fundiaria,matricula_imovel,data_ocupacao,possui_conflito,descricao_conflito
Lote 1,550e8400-e29b-41d4-a716-446655440000,Rua das Flores, 123,300.5,350.0,120.0,-10.1234,-45.6789,ativo,posse direta,regularizada,12345-6,2020-01-15,false,
Lote 2,550e8400-e29b-41d4-a716-446655440000,Rua das Flores, 456,250.0,280.0,100.0,-10.1235,-45.6790,ativo,usucapião,em processo,12346-7,2018-05-20,true,Conflito de divisa com vizinho
Lote 3,550e8400-e29b-41d4-a716-446655440001,Avenida Principal, 789,400.0,400.0,200.0,-10.1240,-45.6800,pendente,posse direta,irregular,,2019-03-10,false,
```

## 📝 Observações Importantes

### Campos Obrigatórios
- **Quadras**: Apenas `name` é obrigatório (NOT NULL)
- **Lotes**: Apenas `name` é obrigatório (NOT NULL)

### Campos Especiais

#### UUIDs
- `project_id` e `quadra_id` devem ser UUIDs válidos
- Formato: `550e8400-e29b-41d4-a716-446655440000`
- Se não tiver, pode deixar vazio (nullable)

#### Campos Numéricos
- `area`, `area_terreno`, `area_construida`: números decimais
- Use ponto como separador decimal: `1500.50`

#### Campos Booleanos
- `possui_conflito`: aceita `true/false`, `1/0`, `sim/não`, `yes/no`

#### Datas
- `data_ocupacao`: formato `YYYY-MM-DD` (ex: `2020-01-15`)

#### Coordenadas
- `latitude` e `longitude`: números decimais negativos para Brasil
- Exemplo: `-10.1234`, `-45.6789`

#### Campos Texto
- `status`, `tipo_posse`, `situacao_fundiaria`: texto livre
- Sugestões de valores:
  - `status`: ativo, pendente, inativo, suspenso
  - `tipo_posse`: posse direta, usucapião, posse indireta
  - `situacao_fundiaria`: regularizada, em processo, irregular

## 🚀 Para Testar

1. **Copie** um dos exemplos acima
2. **Salve** como arquivo `.csv` (ex: `quadras_exemplo.csv`)
3. **Acesse** `/importar-csv` no sistema
4. **Faça upload** do arquivo
5. **Mapeie** as colunas conforme necessário
6. **Importe** os dados

## ⚠️ Dicas

- Use um editor de planilhas (Excel, Google Sheets) para criar o CSV
- Salve como "CSV (Separado por vírgulas)"
- Verifique se os UUIDs são válidos antes de importar
- Teste com poucos registros primeiro
- Mantenha backup dos dados antes de importações em massa
