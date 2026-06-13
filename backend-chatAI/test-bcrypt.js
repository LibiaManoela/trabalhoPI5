import bcrypt from 'bcryptjs';

// Hash que foi inserido no banco
const hashNoBanco = '$2b$12$XTO0u4A6c9ScjTdvGXGR5.x29VytIAhcLvxyU8SOqGCtXNwlekfWu';

// Senha que o usuário quer usar
const senha = '123456';

console.log('Testando bcrypt...');
console.log('Hash no banco:', hashNoBanco);
console.log('Senha testada:', senha);

// Testar se a senha bate com o hash
const matches = bcrypt.compareSync(senha, hashNoBanco);
console.log('Comparação bcrypt.compareSync:', matches);

// Gerar um novo hash localmente para comparação
const salt = bcrypt.genSaltSync(10);
const novoHash = bcrypt.hashSync(senha, salt);
console.log('\nNovo hash gerado localmente:', novoHash);
const novaComparacao = bcrypt.compareSync(senha, novoHash);
console.log('Comparação com novo hash:', novaComparacao);
