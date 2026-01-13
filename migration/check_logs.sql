-- VERIFICAR LOGS E ACTIVITY
-- Para descobrir o que aconteceu

-- 1. Verificar se há algum log de alteração recente
SELECT 
    'VERIFICAR MANUALMENTE' as acao,
    'Dashboard > Settings > Logs' as onde,
    'Procurar por DROP TABLE ou DELETE' as o_que_procurar;

-- 2. Verificar tabelas que sobraram
SELECT 
    table_name,
    'EXISTENTE' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%reurb%'
ORDER BY table_name;

-- 3. Verificar se há algum backup automático
SELECT 
    'BACKUP NECESSÁRIO' as proximo_passo,
    '1. Supabase Dashboard > Settings > Backups' as passo1,
    '2. Procurar por backup recente' as passo2,
    '3. Restaurar backup mais recente' as passo3,
    '4. Contactar suporte se não houver backup' as passo4;
