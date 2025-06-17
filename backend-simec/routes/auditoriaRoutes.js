// Ficheiro: simec/backend-simec/routes/auditoriaRoutes.js
// VERSÃO FINAL SÊNIOR - COM PAGINAÇÃO E FILTROS EFICIENTES

import express from 'express';
import prisma from '../services/prismaService.js';
import { admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/auditoria
 * @desc    Lista logs de auditoria com filtros e paginação do lado do servidor.
 * @access  Admin
 */
router.get('/', admin, async (req, res) => {
    // Extrai filtros e parâmetros de paginação da query string
    const { autorId, acao, entidade, entidadeId, dataInicio, dataFim, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    try {
        const whereClause = {};
        if (autorId) whereClause.autorId = autorId;
        if (acao) whereClause.acao = acao;
        if (entidade) whereClause.entidade = entidade;
        if (entidadeId) whereClause.entidadeId = entidadeId;
        if (dataInicio || dataFim) {
            whereClause.timestamp = {};
            if (dataInicio) whereClause.timestamp.gte = new Date(dataInicio);
            if (dataFim) {
                const fimDoDia = new Date(dataFim);
                fimDoDia.setHours(23, 59, 59, 999);
                whereClause.timestamp.lte = fimDoDia;
            }
        }

        // Executa duas queries em paralelo: uma para os dados da página, outra para a contagem total
        const [logs, totalLogs] = await prisma.$transaction([
            prisma.logAuditoria.findMany({
                where: whereClause,
                skip: skip,
                take: limitNum,
                include: {
                    autor: { select: { id: true, nome: true } }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            }),
            prisma.logAuditoria.count({ where: whereClause })
        ]);

        // Retorna um objeto estruturado com os logs e informações de paginação
        res.json({
            logs,
            pagination: {
                total: totalLogs,
                page: pageNum,
                limit: limitNum,
                hasNextPage: (skip + logs.length) < totalLogs
            }
        });

    } catch (error) {
        console.error("Erro ao buscar log de auditoria:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar logs." });
    }
});

/**
 * @route   GET /api/auditoria/filtros
 * @desc    Obtém listas de valores únicos para popular os menus de filtro no frontend.
 * @access  Admin
 */
router.get('/filtros', admin, async (req, res) => {
    try {
        const [usuarios, acoesDistintas, entidadesDistintas] = await Promise.all([
            prisma.usuario.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
            prisma.logAuditoria.findMany({ select: { acao: true }, distinct: ['acao'] }),
            prisma.logAuditoria.findMany({ select: { entidade: true }, distinct: ['entidade'] })
        ]);

        const acoes = acoesDistintas.map(item => item.acao).sort();
        const entidades = entidadesDistintas.map(item => item.entidade).sort();

        res.json({ usuarios, acoes, entidades });

    } catch (error) {
        console.error("Erro ao buscar dados para filtros de auditoria:", error);
        res.status(500).json({ message: "Erro ao buscar dados para filtros." });
    }
});

export default router;