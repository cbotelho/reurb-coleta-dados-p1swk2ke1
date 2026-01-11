const bcrypt = require('bcryptjs');

const password = 'Reurb1234@';
const email = 'ivoneserrana@gmail.com';

// Gerar hash com 10 rounds
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('GERADOR DE HASH DE SENHA PARA REURB');
  console.log('='.repeat(80));
  console.log(`\nEmail: ${email}`);
  console.log(`Senha: ${password}`);
  console.log(`\nHash bcrypt gerado:\n${hash}\n`);
  
  // Gerar script SQL
  console.log('='.repeat(80));
  console.log('SCRIPT SQL PARA EXECUTAR NO SUPABASE:');
  console.log('='.repeat(80));
  
  const sqlScript = `-- ⚠️ CUIDADO: Este script atualiza a senha do usuário
-- Email: ${email}
-- Senha: ${password}
-- Data: ${new Date().toLocaleString('pt-BR')}

UPDATE auth.users
SET 
  encrypted_password = crypt('${password}', gen_salt('bf')),
  updated_at = now()
WHERE email = '${email}';

-- Verificar se foi atualizado:
SELECT id, email, updated_at FROM auth.users WHERE email = '${email}';`;

  console.log('\n' + sqlScript);
  
  console.log('\n' + '='.repeat(80));
  console.log('OU use este método mais seguro via RPC:');
  console.log('='.repeat(80));
  console.log(`\nSQLECT auth.admin_set_user_password('${email}', '${password}');\n`);
});
