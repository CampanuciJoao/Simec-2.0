// Ficheiro: routes/userRoutes.js
// VERSÃO FINAL - COM EDIÇÃO UNIFICADA DE USUÁRIO

import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../services/prismaService.js';
import { admin } from '../middleware/authMiddleware.js';
import { registrarLog } from '../services/logService.js';

const router = express.Router();

// --- TODAS AS ROTAS AQUI SÃO PROTEGIDAS E REQUEREM PERMISSÃO DE ADMIN ---

// ROTA: GET /api/users - Listar todos os usuários
router.get('/', admin, async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        username: true,
        nome: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários.', error: error.message });
  }
});

// ROTA: POST /api/users - Criar um novo usuário
router.post('/', admin, async (req, res) => {
    const { username, senha, nome, role = 'user' } = req.body;
    if (!username || !senha || !nome) {
        return res.status(400).json({ message: 'Nome de usuário, senha e nome completo são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const novoUsuario = await prisma.usuario.create({
            data: {
                username: username.toLowerCase(),
                senha: senhaCriptografada,
                nome,
                role,
            },
        });

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'CRIAÇÃO',
            entidade: 'Usuário',
            entidadeId: novoUsuario.id,
            detalhes: `Usuário "${novoUsuario.nome}" (login: ${novoUsuario.username}, role: ${novoUsuario.role}) foi criado.`,
        });

        const { senha: _, ...usuarioCriado } = novoUsuario;
        res.status(201).json(usuarioCriado);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

// ROTA: PUT /api/users/:id - Atualiza um usuário (nome, role e senha opcional)
router.put('/:id', admin, async (req, res) => {
    const { id: userIdToUpdate } = req.params;
    const { nome, role, senha: novaSenha } = req.body; // Pega a senha opcional

    if (!nome || !role) {
        return res.status(400).json({ message: 'Nome e Função (role) são obrigatórios.' });
    }

    try {
        const dadosParaAtualizar = {
            nome,
            role,
        };

        // Se uma nova senha foi fornecida, criptografa e adiciona aos dados para atualizar
        if (novaSenha) {
            if (novaSenha.length < 6) {
                return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres.' });
            }
            const salt = await bcrypt.genSalt(10);
            dadosParaAtualizar.senha = await bcrypt.hash(novaSenha, salt);
        }

        const usuarioAtualizado = await prisma.usuario.update({
            where: { id: userIdToUpdate },
            data: dadosParaAtualizar,
        });

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'EDIÇÃO',
            entidade: 'Usuário',
            entidadeId: userIdToUpdate,
            detalhes: `Dados do usuário "${usuarioAtualizado.nome}" foram atualizados.` + (novaSenha ? ' A senha também foi alterada.' : ''),
        });

        const { senha: _, ...usuarioSemSenha } = usuarioAtualizado;
        res.json(usuarioSemSenha);

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar usuário.', error: error.message });
    }
});

// ROTA: DELETE /api/users/:id - Excluir um usuário
router.delete('/:id', admin, async (req, res) => {
    const { id: userIdToDelete } = req.params;

    if (req.usuario.id === userIdToDelete) {
        return res.status(403).json({ message: 'Ação não permitida. Você não pode excluir sua própria conta.' });
    }

    try {
        const usuarioParaExcluir = await prisma.usuario.delete({
            where: { id: userIdToDelete },
        });

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'EXCLUSÃO',
            entidade: 'Usuário',
            entidadeId: userIdToDelete,
            detalhes: `O usuário "${usuarioParaExcluir.nome}" (login: ${usuarioParaExcluir.username}) foi excluído.`,
        });

        res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

// Exporta o router
export default router;