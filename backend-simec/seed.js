// Ficheiro: simec/backend-simec/seed.js
// Versão: 2.2 (Sênior - Com normalização de username)
// Descrição: Script para popular o banco de dados com o usuário administrador inicial.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarAdminInicial() {
  console.log('Iniciando script de seed para o Prisma...');

  // --- DADOS DO ADMINISTRADOR DA APLICAÇÃO ---
  const adminUsername = 'admin';
  const adminNome = 'Administrador do Sistema';
  const adminSenhaPlana = '751953';

  try {
    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(adminSenhaPlana, salt);

    const user = await prisma.usuario.upsert({
      where: { username: adminUsername.toLowerCase() },
      update: {
        // Dados para atualizar se o usuário 'admin' já existir.
        senha: senhaCriptografada,
        nome: adminNome,
      },
      create: {
        // Dados para criar o usuário 'admin' pela primeira vez.
        username: adminUsername.toLowerCase(), // Garante que seja salvo em minúsculas
        nome: adminNome,
        senha: senhaCriptografada,
        role: 'admin',
      },
    });

    console.log('----------------------------------------------------');
    console.log('✅ Usuário administrador configurado com sucesso!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log('----------------------------------------------------');

  } catch (error) {
    console.error('❌ Erro ao executar o script de seed do Prisma:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

criarAdminInicial();