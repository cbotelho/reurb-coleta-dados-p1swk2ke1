-- Resetar senhas de todos os usuários para padrão (exceto Administrador Carlos Botelho)
-- Senha padrão: Reurb1234@

UPDATE auth.users
SET encrypted_password = crypt('Reurb1234@', gen_salt('bf'))
WHERE email != 'cbotelho.80@urbanus.tec.br';
