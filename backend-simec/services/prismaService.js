// simec/backend-simec/services/prismaService.js
// VERSÃO ATUALIZADA - COM INICIALIZAÇÃO EXPLÍCITA DA URL

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv'; // Importa a biblioteca dotenv

// Garante que as variáveis de ambiente sejam carregadas o mais cedo possível
dotenv.config(); 

const databaseUrl = process.env.DATABASE_URL;

// LOG DE DEPURAÇÃO CRÍTICO: Verifica a URL no momento da criação do client
console.log('[PrismaService] Inicializando Prisma Client com a URL:', databaseUrl);
if (!databaseUrl) {
    console.error("ERRO CRÍTICO: A variável de ambiente DATABASE_URL não foi encontrada em prismaService.js. Verifique seu ficheiro .env e a inicialização do dotenv.");
}

// Cria a instância do Prisma Client, passando a URL do banco de dados explicitamente.
// Isso garante que o Prisma use exatamente esta string de conexão,
// contornando qualquer problema de cache ou de carregamento implícito.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;