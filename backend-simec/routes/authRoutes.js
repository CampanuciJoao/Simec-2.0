// Ficheiro: routes/authRoutes.js
// VERSÃO FINAL, COMPLETA E REVISADA - COM LOGS DE DEPURAÇÃO

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/prismaService.js';

const router = express.Router();

/**
 * ROTA: POST /api/auth/login
 * FINALIDADE: Autenticar um usuário e retornar um token JWT.
 */
router.post('/login', async (req, res) => {
    try {
        const { username, senha } = req.body;
        if (!username || !senha) {
            return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
        }

        console.log(`[AUTH] Tentativa de login para o usuário: '${username.toLowerCase()}'`);

        const usuario = await prisma.usuario.findUnique({
            where: { username: username.toLowerCase() },
        });

        if (!usuario) {
            console.log(`[AUTH] Falha: Usuário '${username.toLowerCase()}' não encontrado no banco de dados.`);
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        console.log('[AUTH] Usuário encontrado. Comparando senhas...');
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            console.log('[AUTH] Falha: A comparação de senhas falhou.');
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Se chegou aqui, a autenticação foi bem-sucedida
        console.log('[AUTH] Sucesso: Senha correta. Gerando token JWT...');
        const payload = {
            id: usuario.id,
            nome: usuario.nome,
            role: usuario.role,
        };

        // Assina o token com o payload, a chave secreta do ambiente e define uma expiração.
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, // Lê diretamente da variável de ambiente.
            { expiresIn: '8h' }
        );

        // Retorna o token e os dados básicos do usuário para o frontend.
        res.json({
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                username: usuario.username,
                role: usuario.role,
            },
        });

    } catch (error) {
        // Um erro aqui geralmente indica um problema no servidor (ex: JWT_SECRET faltando).
        console.error("Erro no processo de login:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

// Exporta o router para ser usado no ponto de entrada do servidor.
export default router;