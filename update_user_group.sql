-- Atualizar grupo de acesso do usuário administrador

-- Verificar grupo atual do usuário
SELECT 
    id,
    nome_usuario,
    email,
    grupo_acesso,
    situacao
FROM reurb_profiles 
WHERE email = 'cbotelho.80@urbanus.tec.br';

-- Atualizar para grupo Administradores
UPDATE reurb_profiles 
SET grupo_acesso = 'Administradores',
    updated_at = NOW()
WHERE email = 'cbotelho.80@urbanus.tec.br';

-- Verificar se atualizou
SELECT 
    id,
    nome_usuario,
    email,
    grupo_acesso,
    situacao,
    updated_at
FROM reurb_profiles 
WHERE email = 'cbotelho.80@urbanus.tec.br';
