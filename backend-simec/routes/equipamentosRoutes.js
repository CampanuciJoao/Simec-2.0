// Ficheiro: simec/backend-simec/routes/equipamentosRoutes.js
// VERSÃO FINAL SÊNIOR - COMPLETA, CONSISTENTE E VERIFICADA

// --- 1. Importações ---
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../services/prismaService.js';
import { registrarLog } from '../services/logService.js';
import { admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- 2. Configuração do Multer para Upload de Anexos ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join('uploads', 'equipamentos');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });

// --- 3. Função Auxiliar para Datas ---
const parseDate = (dateString) => (dateString ? new Date(dateString) : null);


// ==========================================================================
// SEÇÃO: ROTAS PRINCIPAIS DE EQUIPAMENTOS (CRUD)
// ==========================================================================

/** @route   GET /api/equipamentos */
router.get('/', async (req, res) => {
    try {
        const equipamentos = await prisma.equipamento.findMany({
            include: { unidade: { select: { id: true, nomeSistema: true } } },
            orderBy: { modelo: 'asc' }
        });
        res.json(equipamentos);
    } catch (error) {
        console.error("Erro ao buscar equipamentos:", error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar equipamentos.' });
    }
});

/** @route   GET /api/equipamentos/:id */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const equipamento = await prisma.equipamento.findUnique({
            where: { id },
            include: {
                unidade: true,
                acessorios: { orderBy: { nome: 'asc' } },
                anexos: { orderBy: { createdAt: 'desc' } }
            }
        });
        if (!equipamento) return res.status(404).json({ message: 'Equipamento não encontrado.' });
        res.json(equipamento);
    } catch (error) {
        console.error(`Erro ao buscar equipamento ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar o equipamento.' });
    }
});

/** @route   POST /api/equipamentos */
router.post('/', async (req, res) => {
    const { dataInstalacao, ...dados } = req.body;
    if (!dados.tag || !dados.modelo || !dados.unidadeId) {
        return res.status(400).json({ message: 'Tag, Modelo e Unidade são campos obrigatórios.' });
    }
    try {
        const novoEquipamento = await prisma.equipamento.create({
            data: { ...dados, dataInstalacao: parseDate(dataInstalacao) }
        });
        await registrarLog({
            usuarioId: req.usuario.id, acao: 'CRIAÇÃO', entidade: 'Equipamento',
            entidadeId: novoEquipamento.id, detalhes: `Equipamento "${novoEquipamento.modelo}" (Tag: ${novoEquipamento.tag}) foi criado.`
        });
        res.status(201).json(novoEquipamento);
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: 'Já existe um equipamento com esta Tag ou Número de Património.' });
        if (error.code === 'P2025') return res.status(404).json({ message: 'A Unidade especificada não foi encontrada.' });
        res.status(500).json({ message: 'Erro ao criar equipamento.' });
    }
});

/** @route   PUT /api/equipamentos/:id */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { dataInstalacao, ...dados } = req.body;
    try {
        const dadosParaAtualizar = { ...dados };
        if (dataInstalacao !== undefined) dadosParaAtualizar.dataInstalacao = parseDate(dataInstalacao);
        const equipamentoAtualizado = await prisma.equipamento.update({
            where: { id }, data: dadosParaAtualizar
        });
        await registrarLog({
            usuarioId: req.usuario.id, acao: 'EDIÇÃO', entidade: 'Equipamento',
            entidadeId: id, detalhes: `Dados do equipamento "${equipamentoAtualizado.modelo}" foram atualizados.`
        });
        res.json(equipamentoAtualizado);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Equipamento não encontrado.' });
        if (error.code === 'P2002') return res.status(409).json({ message: 'Já existe um equipamento com esta Tag ou Número de Património.' });
        res.status(500).json({ message: 'Erro ao atualizar equipamento.' });
    }
});

/** @route   DELETE /api/equipamentos/:id */
router.delete('/:id', admin, async (req, res) => {
    const { id } = req.params;
    try {
        const equipamentoExcluido = await prisma.equipamento.delete({ where: { id } });
        await registrarLog({
            usuarioId: req.usuario.id, acao: 'EXCLUSÃO', entidade: 'Equipamento',
            entidadeId: id, detalhes: `Equipamento "${equipamentoExcluido.modelo}" foi excluído.`
        });
        res.status(200).json({ message: 'Equipamento excluído com sucesso.' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Equipamento não encontrado.' });
        res.status(500).json({ message: 'Erro ao excluir equipamento.' });
    }
});


// ==========================================================================
// SEÇÃO: ROTAS ANINHADAS DE ACESSÓRIOS
// ==========================================================================

/** @route   GET /api/equipamentos/:equipamentoId/acessorios */
router.get('/:equipamentoId/acessorios', async (req, res) => {
    const { equipamentoId } = req.params;
    try {
        const acessorios = await prisma.acessorio.findMany({
            where: { equipamentoId: equipamentoId },
            orderBy: { nome: 'asc' }
        });
        res.json(acessorios);
    } catch (error) {
        console.error(`Erro ao buscar acessórios para o equipamento ${equipamentoId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar acessórios.' });
    }
});

/** @route   POST /api/equipamentos/:equipamentoId/acessorios */
router.post('/:equipamentoId/acessorios', async (req, res) => {
    const { equipamentoId } = req.params;
    const { nome, numeroSerie, descricao } = req.body;
    if (!nome) return res.status(400).json({ message: 'O nome do acessório é obrigatório.' });
    try {
        const novoAcessorio = await prisma.acessorio.create({
            data: { nome, numeroSerie: numeroSerie || null, descricao: descricao || null, equipamento: { connect: { id: equipamentoId } } }
        });
        await registrarLog({
            usuarioId: req.usuario.id, acao: 'CRIAÇÃO', entidade: 'Acessório',
            entidadeId: novoAcessorio.id, detalhes: `Acessório "${nome}" adicionado ao equipamento ID ${equipamentoId}.`
        });
        res.status(201).json(novoAcessorio);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Equipamento não encontrado para vincular o acessório.' });
        if (error.code === 'P2002') return res.status(409).json({ message: 'Já existe um acessório com este número de série.' });
        res.status(500).json({ message: 'Erro ao criar acessório.' });
    }
});

/** @route   PUT /api/equipamentos/:equipamentoId/acessorios/:acessorioId */
router.put('/:equipamentoId/acessorios/:acessorioId', async (req, res) => {
    const { acessorioId } = req.params;
    const { nome, numeroSerie, descricao } = req.body;
    if (!nome) return res.status(400).json({ message: 'O nome do acessório é obrigatório.' });
    try {
        const acessorioAtualizado = await prisma.acessorio.update({
            where: { id: acessorioId }, data: { nome, numeroSerie: numeroSerie || null, descricao: descricao || null },
        });
        await registrarLog({
            usuarioId: req.usuario.id, acao: 'EDIÇÃO', entidade: 'Acessório',
            entidadeId: acessorioId, detalhes: `Acessório "${acessorioAtualizado.nome}" foi atualizado.`
        });
        res.json(acessorioAtualizado);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Acessório não encontrado.' });
        if (error.code === 'P2002') return res.status(409).json({ message: 'Já existe um acessório com este número de série.' });
        res.status(500).json({ message: 'Erro ao atualizar acessório.' });
    }
});

/** @route   DELETE /api/equipamentos/:equipamentoId/acessorios/:acessorioId */
router.delete('/:equipamentoId/acessorios/:acessorioId', async (req, res) => {
    const { acessorioId } = req.params;
    try {
        const acessorioExcluido = await prisma.acessorio.delete({ where: { id: acessorioId } });
        await registrarLog({
            usuarioId: req.usuario.id, acao: 'EXCLUSÃO', entidade: 'Acessório',
            entidadeId: acessorioId, detalhes: `Acessório "${acessorioExcluido.nome}" foi excluído.`
        });
        res.status(200).json({ message: 'Acessório excluído com sucesso.' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Acessório não encontrado.' });
        res.status(500).json({ message: 'Erro ao excluir acessório.' });
    }
});


// ==========================================================================
// SEÇÃO: ROTAS DE ANEXOS
// ==========================================================================

/** @route   POST /api/equipamentos/:equipamentoId/anexos */
router.post('/:equipamentoId/anexos', upload.array('anexosEquipamento'), async (req, res) => {
    const { equipamentoId } = req.params;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Nenhum ficheiro foi enviado.' });
    }
    try {
        const anexosData = req.files.map(file => ({
            nomeOriginal: file.originalname, path: file.path, tipoMime: file.mimetype, equipamentoId: equipamentoId
        }));
        await prisma.anexo.createMany({ data: anexosData });
        const anexosAtualizados = await prisma.anexo.findMany({ where: { equipamentoId } });
        res.status(201).json(anexosAtualizados);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar anexos.' });
    }
});

/** @route   DELETE /api/equipamentos/:equipamentoId/anexos/:anexoId */
router.delete('/:equipamentoId/anexos/:anexoId', async (req, res) => {
    const { anexoId } = req.params;
    try {
        const anexo = await prisma.anexo.findUnique({ where: { id: anexoId } });
        if (anexo?.path && fs.existsSync(anexo.path)) fs.unlinkSync(anexo.path);
        await prisma.anexo.delete({ where: { id: anexoId } });
        await registrarLog({
            usuarioId: req.usuario.id, acao: 'EXCLUSÃO', entidade: 'Anexo',
            entidadeId: anexoId, detalhes: `Anexo "${anexo?.nomeOriginal}" foi excluído.`
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Anexo não encontrado.' });
        res.status(500).json({ message: 'Erro ao excluir anexo.' });
    }
});

export default router;