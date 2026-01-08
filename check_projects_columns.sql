SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reurb_projects' 
ORDER BY ordinal_position;
