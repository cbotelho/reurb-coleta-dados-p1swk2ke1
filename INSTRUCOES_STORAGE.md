# Como corrigir o erro "must be owner of table objects"

O erro `42501: must be owner of table objects` acontece porque a ferramenta que você usou para rodar o SQL (provavelmente uma extensão do VS Code ou cliente externo) não está conectada como o "superusuário" do banco de dados (`postgres`), ou o Supabase protege o esquema `storage` contra edições externas.

Para resolver, você tem duas opções:

## Opção A: Rodar no Painel do Supabase (Recomendado)
O Editor SQL do próprio site do Supabase roda com permissões elevadas.

1. Acesse seu projeto no site do [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá no menu lateral **SQL Editor**.
3. Clique em **New Query**.
4. Cole o conteúdo exato do arquivo `migration/fix_storage_policy.sql`.
5. Clique em **Run**.

## Opção B: Configurar via Interface Gráfica (Sem Código)
Se preferir, você pode configurar isso clicando nos botões do painel "Storage":

1. No menu lateral do Supabase, clique em **Storage**.
2. Crie um novo bucket (se não existir):
   - Name: `reurb-images`
   - Public: **Ligado (ON)**
   - Save.
3. Clique na aba **Policies** (no topo da tela do Storage).
4. Em `reurb-images`, clique em **New Policy**.
5. Escolha **"Get started quickly"** -> **"Give users access to all files"**.
   - Isso vai criar permissões de SELECT, INSERT, UPDATE, DELETE para todos.
   - (Ou selecione apenas "Authenticated" se quiser forçar login).
6. Clique em **Use this template** e depois **Review** e **Save**.

Após fazer um desses passos, o **Upload via App** passará a funcionar e não salvará mais Base64 no banco.
