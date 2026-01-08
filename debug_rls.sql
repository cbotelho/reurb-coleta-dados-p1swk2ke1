-- Check RLS policies on reurb_projects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reurb_projects';

-- Check if user has permissions
SELECT 
    has_table_privilege('auth.uid()', 'reurb_projects', 'UPDATE') as can_update,
    has_table_privilege('auth.uid()', 'reurb_projects', 'SELECT') as can_select,
    has_table_privilege('auth.uid()', 'reurb_projects', 'INSERT') as can_insert,
    has_table_privilege('auth.uid()', 'reurb_projects', 'DELETE') as can_delete;
