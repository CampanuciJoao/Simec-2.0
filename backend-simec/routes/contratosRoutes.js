// Ficheiro: simec/backend-simec/routes/contratosRoutes.js
// Versão: 2.0 (Sênior - Refatorado com CRUD completo e documentado)
// Descrição: Define todos os endpoints da API para o recurso 'Contrato',
// incluindo listagem, busca, criação, atualização e exclusão.

// --- 1. Importações ---
import express from 'express';
import prisma from '../services/prismaService.js';
import { registrarLog } from '../services/logService.js';
import { admin } from '../middleware/authMiddleware.js'; // Importamos o middleware de admin para rotas restritas.

// --- 2. Inicialização do Roteador ---
const router = express.Router();

// --- 3. Definição das Rotas ---

/**
 * @route   GET /api/contratos
 * @desc    Lista todos os contratos. Otimizado para a página de listagem.
 * @access  Protegido
 */
router.get('/', async (req, res) => {
    try {
        // Usamos 'include' para trazer dados de relações (M-N) em uma única query otimizada (evita o problema N+1).
        const contratos = await prisma.contrato.findMany({
            include: {
                unidadesCobertas: { select: { nomeSistema: true } }, // Seleciona apenas os campos necessários para a UI.
                equipamentosCobertos: { select: { modelo: true, tag: true } }
            },
            orderBy: { dataFim: 'asc' } // Ordena por data de vencimento, os mais próximos primeiro.
        });
        res.json(contratos);
    } catch (error) {
        console.error("Erro ao buscar contratos:", error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar contratos.' });
    }
});

/**
 * @route   GET /api/contratos/:id
 * @desc    Busca um contrato específico pelo seu ID, com todos os dados para a página de detalhes/edição.
 * @access  Protegido
 */
router.get('/:id', async (req, res) => {
    try {
        const contrato = await prisma.contrato.findUnique({
            where: { id: req.params.id },
            // Para a página de edição, trazemos os objetos completos das relações.
            include: { unidadesCobertas: true, equipamentosCobertos: true, anexos: true }
        });

        if (contrato) {
            res.json(contrato);
        } else {
            // Se o Prisma não encontrar o registro, retornamos 404, que é o status correto.
            res.status(404).json({ message: 'Contrato não encontrado.' });
        }
    } catch (error) {
        console.error(`Erro ao buscar contrato ${req.params.id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar o contrato.' });
    }
});


/**
 * @route   POST /api/contratos
 * @desc    Cria um novo contrato. Esta era a rota que estava faltando.
 * @access  Protegido
 */
router.post('/', async (req, res) => {
    // 1. Desestruturamos os dados do corpo da requisição para clareza.
    const { 
        numeroContrato, categoria, fornecedor, dataInicio, dataFim, status, 
        unidadesCobertasIds, equipamentosCobertosIds 
    } = req.body;

    // 2. Validação de servidor: garante que os campos essenciais foram enviados.
    if (!numeroContrato || !categoria || !fornecedor || !dataInicio || !dataFim) {
        return res.status(400).json({ message: 'Número do Contrato, Categoria, Fornecedor e datas de vigência são obrigatórios.' });
    }

    try {
        // 3. Montamos o payload para o Prisma, convertendo datas e tratando as relações.
        const dadosParaCriar = {
            numeroContrato,
            categoria,
            fornecedor,
            dataInicio: new Date(dataInicio),
            dataFim: new Date(dataFim),
            status: status || 'Ativo',
            // O Prisma usa a sintaxe 'connect' para criar relações muitos-para-muitos.
            // Mapeamos os arrays de IDs para o formato que o Prisma espera.
            unidadesCobertas: unidadesCobertasIds?.length > 0 
                ? { connect: unidadesCobertasIds.map(id => ({ id })) } 
                : undefined,
            equipamentosCobertos: equipamentosCobertosIds?.length > 0 
                ? { connect: equipamentosCobertosIds.map(id => ({ id })) } 
                : undefined,
        };

        // 4. Executamos a criação do registro no banco de dados.
        const novoContrato = await prisma.contrato.create({ data: dadosParaCriar });

        // 5. Registramos a ação no log de auditoria para rastreabilidade.
        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'CRIAÇÃO',
            entidade: 'Contrato',
            entidadeId: novoContrato.id,
            detalhes: `Contrato nº ${novoContrato.numeroContrato} foi criado.`
        });

        // 6. Retornamos o status 201 (Created), que é o correto para um POST bem-sucedido, junto com o objeto criado.
        res.status(201).json(novoContrato);

    } catch (error) {
        // 7. Tratamos erros específicos do banco de dados para dar feedback claro ao usuário.
        if (error.code === 'P2002') { // Violação de chave única
            return res.status(409).json({ message: 'Já existe um contrato com este número.' });
        }
        if (error.code === 'P2025') { // Registro relacionado não encontrado
            return res.status(404).json({ message: 'Uma das unidades ou equipamentos selecionados não foi encontrado.' });
        }
        
        console.error("Erro ao criar contrato:", error);
        res.status(500).json({ message: 'Erro interno do servidor ao criar o contrato.', error: error.message });
    }
});


/**
 * @route   PUT /api/contratos/:id
 * @desc    Atualiza um contrato existente.
 * @access  Protegido
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { unidadesCobertasIds, equipamentosCobertosIds, ...dadosContrato } = req.body;
        
        // Converte as strings de data para objetos Date, se existirem.
        if (dadosContrato.dataInicio) dadosContrato.dataInicio = new Date(dadosContrato.dataInicio);
        if (dadosContrato.dataFim) dadosContrato.dataFim = new Date(dadosContrato.dataFim);

        // A sintaxe 'set' do Prisma para relações M-N substitui completamente as conexões existentes.
        // Isso simplifica a lógica de atualização: enviamos a nova lista completa de IDs.
        const dadosParaAtualizar = {
            ...dadosContrato,
            unidadesCobertas: { set: unidadesCobertasIds?.map(id => ({ id })) || [] },
            equipamentosCobertos: { set: equipamentosCobertosIds?.map(id => ({ id })) || [] }
        };

        const contratoAtualizado = await prisma.contrato.update({
            where: { id },
            data: dadosParaAtualizar
        });

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'EDIÇÃO',
            entidade: 'Contrato',
            entidadeId: id,
            detalhes: `Contrato nº ${contratoAtualizado.numeroContrato} foi atualizado.`
        });

        res.json(contratoAtualizado);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Contrato não encontrado.' });
        console.error("Erro ao atualizar contrato:", error);
        res.status(500).json({ message: 'Erro interno ao atualizar contrato.' });
    }
});


/**
 * @route   DELETE /api/contratos/:id
 * @desc    Exclui um contrato.
 * @access  Admin
 */
router.delete('/:id', admin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscamos o contrato primeiro para ter seu número para o log de auditoria.
        const contratoParaExcluir = await prisma.contrato.findUnique({ where: { id } });
        if (!contratoParaExcluir) return res.status(404).json({ message: 'Contrato não encontrado.' });
        
        await prisma.contrato.delete({ where: { id } });

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'EXCLUSÃO',
            entidade: 'Contrato',
            entidadeId: id,
            detalhes: `Contrato nº ${contratoParaExcluir.numeroContrato} foi excluído permanentemente.`
        });
        
        // Status 204 (No Content) é o ideal para uma exclusão bem-sucedida, pois não há corpo na resposta.
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Contrato não encontrado.' });
        console.error("Erro ao excluir contrato:", error);
        res.status(500).json({ message: 'Erro interno ao excluir contrato.' });
    }
});


// --- 4. Exportação do Módulo ---
export default router;