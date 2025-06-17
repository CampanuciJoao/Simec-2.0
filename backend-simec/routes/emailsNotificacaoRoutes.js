// Ficheiro: backend-simec/routes/emailsNotificacaoRoutes.js
// Versão: 2.1 (Sênior - CRUD Completo com Rota de Edição Robusta)
// Descrição: Endpoints para o CRUD de e-mails de notificação. Acesso restrito a Admins.

import express from 'express';
import prisma from '../services/prismaService.js';
import { admin } from '../middleware/authMiddleware.js';
import { registrarLog } from '../services/logService.js';

const router = express.Router();

// Aplica o middleware de admin a todas as rotas neste ficheiro de uma só vez.
router.use(admin);

// GET /api/emails-notificacao - Lista todos os e-mails
router.get('/', async (req, res) => {
  try {
    const emails = await prisma.emailNotificacao.findMany({ orderBy: { email: 'asc' } });
    res.json(emails);
  } catch (error) {
    console.error("Erro ao buscar e-mails:", error);
    res.status(500).json({ message: "Erro ao buscar e-mails." });
  }
});

// POST /api/emails-notificacao - Adiciona um novo e-mail
router.post('/', async (req, res) => {
  const { email, nome, diasAntecedencia, recebeAlertasContrato, recebeAlertasManutencao, recebeAlertasSeguro } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'O campo e-mail é obrigatório.' });
  }
  try {
    const novoEmail = await prisma.emailNotificacao.create({
      data: { 
        email, 
        nome, 
        diasAntecedencia: parseInt(diasAntecedencia, 10) || 30,
        recebeAlertasContrato: !!recebeAlertasContrato, // Coerção para booleano para segurança
        recebeAlertasManutencao: !!recebeAlertasManutencao,
        recebeAlertasSeguro: !!recebeAlertasSeguro
      }
    });
    await registrarLog({
        usuarioId: req.usuario.id, acao: 'CRIAÇÃO', entidade: 'EmailNotificacao',
        entidadeId: novoEmail.id, detalhes: `E-mail "${novoEmail.email}" adicionado à lista de notificações.`
    });
    res.status(201).json(novoEmail);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
    console.error("Erro ao adicionar e-mail:", error);
    res.status(500).json({ message: "Erro ao adicionar e-mail." });
  }
});

// --- ROTA DE ATUALIZAÇÃO CORRIGIDA ---
// PUT /api/emails-notificacao/:id - Atualiza um e-mail existente
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    // CORREÇÃO: Removemos 'ativo' da desestruturação, pois ele não é enviado pelo formulário.
    const { nome, diasAntecedencia, recebeAlertasContrato, recebeAlertasManutencao, recebeAlertasSeguro } = req.body;

    try {
        const emailAtualizado = await prisma.emailNotificacao.update({
            where: { id },
            // O payload de atualização agora contém apenas os campos que o formulário gerencia.
            // O campo 'ativo' não é tocado, preservando seu valor atual no banco.
            data: {
                nome,
                diasAntecedencia: parseInt(diasAntecedencia, 10) || 30,
                recebeAlertasContrato: !!recebeAlertasContrato,
                recebeAlertasManutencao: !!recebeAlertasManutencao,
                recebeAlertasSeguro: !!recebeAlertasSeguro,
            }
        });
        await registrarLog({
            usuarioId: req.usuario.id, acao: 'EDIÇÃO', entidade: 'EmailNotificacao',
            entidadeId: id, detalhes: `Configurações do e-mail "${emailAtualizado.email}" foram atualizadas.`
        });
        res.json(emailAtualizado);
    } catch(error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'E-mail não encontrado.' });
        console.error("Erro ao atualizar e-mail:", error);
        res.status(500).json({ message: 'Erro ao atualizar e-mail.' });
    }
});

// DELETE /api/emails-notificacao/:id - Remove um e-mail
router.delete('/:id', async (req, res) => {
  try {
    const emailExcluido = await prisma.emailNotificacao.delete({ where: { id: req.params.id } });
    await registrarLog({
        usuarioId: req.usuario.id, acao: 'EXCLUSÃO', entidade: 'EmailNotificacao',
        entidadeId: emailExcluido.id, detalhes: `E-mail "${emailExcluido.email}" foi removido.`
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'E-mail não encontrado.' });
    console.error("Erro ao remover e-mail:", error);
    res.status(500).json({ message: "Erro ao remover e-mail." });
  }
});

export default router;
