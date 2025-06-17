// Ficheiro: simec/backend-simec/routes/dashboardRoutes.js
// Versão: 3.5 (Sênior - DADOS PARA GRÁFICO EMPILHADO)
// Descrição: Endpoint que agora agrupa as manutenções por tipo e mês para
//            suportar um gráfico de barras empilhadas no frontend.

import express from 'express';
import prisma from '../services/prismaService.js';
import { getMonth, getYear } from 'date-fns';

const router = express.Router();

// Função auxiliar para obter os últimos 6 meses no formato "Mês/Ano"
const getUltimosSeisMesesLabels = () => {
    const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const labels = [];
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        labels.push(`${mesesNomes[getMonth(d)]}/${getYear(d).toString().slice(-2)}`);
    }
    return labels;
};

/**
 * @route   GET /api/dashboard-data
 * @desc    Busca, agrega e formata todos os dados necessários para o dashboard.
 * @access  Protegido
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.usuario.id;
        const hoje = new Date();
        const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);

        const [
            totalEquipamentos,
            manutencoesPendentes,
            contratosVencendo,
            alertasNaoVistosCount,
            statusEquipamentosGroups,
            manutencoesDosUltimos6Meses,
            alertasRecentes
        ] = await Promise.all([
            prisma.equipamento.count(),
            prisma.manutencao.count({ where: { status: { in: ['Agendada', 'EmAndamento', 'AguardandoConfirmacao'] } } }),
            prisma.contrato.count({ where: { status: 'Ativo', dataFim: { gte: hoje, lte: new Date(new Date().setDate(hoje.getDate() + 30)) } } }),
            prisma.alerta.count({ where: { NOT: { lidoPorUsuarios: { some: { usuarioId: userId, visto: true } } } } }),
            prisma.equipamento.groupBy({ by: ['status'], _count: { id: true } }),
            // CORREÇÃO: Busca também o 'tipo' da manutenção
            prisma.manutencao.findMany({ where: { createdAt: { gte: seisMesesAtras } }, select: { createdAt: true, tipo: true } }),
            prisma.alerta.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { id: true, titulo: true, prioridade: true, link: true }
            })
        ]);

        // --- Processamento e Formatação para os Gráficos ---

        // 1. Gráfico de Donut: Status dos Equipamentos (sem alterações)
        const statusCores = {
            Operante: { light: '#22C55E', dark: '#4ADE80', textLight: '#15803D', textDark: '#D1FAE5' },
            EmManutencao: { light: '#F59E0B', dark: '#FBBF24', textLight: '#B45309', textDark: '#FEF3C7' },
            Inoperante: { light: '#EF4444', dark: '#F87171', textLight: '#B91C1C', textDark: '#FEE2E2' },
            UsoLimitado: { light: '#6366F1', dark: '#818CF8', textLight: '#4338CA', textDark: '#E0E7FF' },
        };
        const statusEquipamentosFormatado = {
            labels: statusEquipamentosGroups.map(g => g.status.replace(/([A-Z])/g, ' $1').trim()),
            data: statusEquipamentosGroups.map(g => g._count.id),
            colorsLight: statusEquipamentosGroups.map(g => statusCores[g.status]?.light || '#A8A29E'),
            colorsDark: statusEquipamentosGroups.map(g => statusCores[g.status]?.dark || '#A8A29E'),
            textColorsLight: statusEquipamentosGroups.map(g => statusCores[g.status]?.textLight || '#A8A29E'),
            textColorsDark: statusEquipamentosGroups.map(g => statusCores[g.status]?.textDark || '#A8A29E'),
        };

        // 2. Gráfico de Barras: Manutenções por Mês, detalhado por tipo
        const labelsMeses = getUltimosSeisMesesLabels();
        const tiposDeManutencao = ["Preventiva", "Corretiva", "Calibracao", "Inspecao"];
        
        const manutençõesAgrupadas = labelsMeses.reduce((acc, label) => {
            acc[label] = {};
            tiposDeManutencao.forEach(tipo => {
                acc[label][tipo] = 0;
            });
            return acc;
        }, {});

        const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        manutencoesDosUltimos6Meses.forEach(m => {
            const chaveMes = `${mesesNomes[getMonth(m.createdAt)]}/${getYear(m.createdAt).toString().slice(-2)}`;
            if (chaveMes in manutençõesAgrupadas && m.tipo) {
                manutençõesAgrupadas[chaveMes][m.tipo]++;
            }
        });
        
        const datasetsPorTipo = tiposDeManutencao.map(tipo => ({
            label: tipo,
            data: labelsMeses.map(mes => manutençõesAgrupadas[mes][tipo] || 0)
        }));

        const manutencoesPorMesFormatado = {
            labels: labelsMeses,
            datasets: datasetsPorTipo
        };

        // --- Montagem do Payload de Resposta Final ---
        const responsePayload = {
            equipamentosCount: totalEquipamentos,
            manutencoesCount: manutencoesPendentes,
            contratosVencendoCount: contratosVencendo,
            alertasAtivos: alertasNaoVistosCount,
            alertasRecentes: alertasRecentes,
            statusEquipamentos: statusEquipamentosFormatado,
            manutencoesPorTipoMes: manutencoesPorMesFormatado,
        };

        res.json(responsePayload);

    } catch (error) {
        console.error("[ERRO NO ENDPOINT /api/dashboard-data]:", error);
        res.status(500).json({ message: "Erro interno do servidor ao processar os dados do dashboard." });
    }
});

export default router;