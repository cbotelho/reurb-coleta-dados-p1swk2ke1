import bcrypt from 'bcryptjs';

const password = 'Reurb1234@';
const hash = await bcrypt.hash(password, 10);
console.log('HASH:' + hash);
