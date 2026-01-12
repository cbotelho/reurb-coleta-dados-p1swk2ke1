-- Atualizar senha de todos os usuários (exceto Carlos Botelho)
-- Senha: Reurb1234@
-- Hash gerado: $2a$10$PgISnYnTLni0lTgrmZYmMOr9pn4zA68caMjg.69ZBilQxe7Dx1HGe

UPDATE auth.users
SET encrypted_password = '$2a$10$PgISnYnTLni0lTgrmZYmMOr9pn4zA68caMjg.69ZBilQxe7Dx1HGe'
WHERE email != 'cbotelho.80@urbanus.tec.br';
