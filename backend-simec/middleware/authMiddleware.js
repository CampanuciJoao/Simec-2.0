// Ficheiro: middleware/authMiddleware.js
// VERSÃO SÊNIOR REVISADA - SEM ALTERAÇÕES DE LÓGICA, APENAS COMENTÁRIOS

import jwt from 'jsonwebtoken';
import prisma from '../services/prismaService.js';

/**
 * Middleware para proteger rotas. Verifica a validade do token JWT e a 
 * existência do usuário no banco de dados.
 * @param {import('express').Request} req - O objeto da requisição Express.
 * @param {import('express').Response} res - O objeto da resposta Express.
 * @param {import('express').NextFunction} next - A função para passar o controle para o próximo middleware.
 */
export const proteger = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extrai o token do cabeçalho "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // 2. Verifica se o token é válido e decodifica o payload
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. VALIDAÇÃO CRÍTICA: Busca o usuário no banco de dados usando o ID do token.
            // Isso garante que tokens de usuários excluídos ou desativados não funcionem.
            const usuarioAtual = await prisma.usuario.findUnique({
                where: { id: decoded.id },
                // Otimização: seleciona apenas os campos necessários para o objeto `req.usuario`.
                // Jamais selecione o campo `senha`.
                select: {
                    id: true,
                    nome: true,
                    role: true
                }
            });

            if (!usuarioAtual) {
                return res.status(401).json({ message: 'Não autorizado. O usuário deste token não existe mais.' });
            }

            // 4. Anexa o objeto do usuário (fresco do banco de dados) à requisição.
            // Agora, todas as rotas protegidas subsequentes terão acesso a `req.usuario`.
            req.usuario = usuarioAtual;
            
            next(); // Prossegue para a rota solicitada.

        } catch (error) {
            console.error('Erro no middleware de autenticação:', error.message);
            // Erros comuns aqui: TokenExpiredError, JsonWebTokenError
            res.status(401).json({ message: 'Não autorizado. O token falhou ou expirou.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado. Nenhum token foi fornecido.' });
    }
};

/**
 * Middleware para verificar se o usuário autenticado tem permissão de administrador.
 * Deve ser usado SEMPRE APÓS o middleware `proteger`.
 * @param {import('express').Request} req - O objeto da requisição (deve conter `req.usuario`).
 * @param {import('express').Response} res - O objeto da resposta.
 * @param {import('express').NextFunction} next - A função `next`.
 */
export const admin = (req, res, next) => {
    // Confia que `proteger` já populou `req.usuario` com dados válidos.
    if (req.usuario && req.usuario.role === 'admin') {
        next();
    } else {
        // 403 Forbidden: O servidor entendeu a requisição, mas se recusa a autorizá-la.
        res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
    }
};