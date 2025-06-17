// Ficheiro: simec/backend-simec/routes/segurosRoutes.js
// VERSÃO 100% COMPLETA E ATUALIZADA PARA PRISMA E MÚLTIPLOS VÍNCULOS

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../services/prismaService.js';
import { registrarLog } from '../services/logService.js';

const router = express.Router();

// Configuração do Multer (sem alterações)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/seguros';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// ROTA: GET /api/seguros
// FINALIDADE: Listar todos os seguros.
router.get('/', async (req, res) => {
    try {
        const seguros = await prisma.seguro.findMany({
            include: {
                equipamento: { select: { id: true, modelo: true, tag: true } }, // Inclui equipamento
                unidade: { select: { id: true, nomeSistema: true } } // Inclui unidade
            },
            orderBy: { dataFim: 'asc' }
        });
        res.json(seguros);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar seguros.', error: error.message });
    }
});

// ROTA: GET /api/seguros/:id
// FINALIDADE: Obter um seguro específico.
router.get('/:id', async (req, res) => {
    try {
        const seguro = await prisma.seguro.findUnique({
            where: { id: req.params.id },
            include: { 
                anexos: true, 
                equipamento: true, // Inclui o objeto equipamento
                unidade: true      // Inclui o objeto unidade
            }
        });

        if (seguro) {
            res.json(seguro);
        } else {
            res.status(404).json({ message: 'Seguro não encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar seguro.', error: error.message });
    }
});

// ROTA: POST /api/seguros
// FINALIDADE: Criar uma nova apólice de seguro.
router.post('/', async (req, res) => {
    const { apoliceNumero, seguradora, dataInicio, dataFim, equipamentoId, unidadeId, cobertura, ...outrosDados } = req.body;
    
    if (!apoliceNumero || !seguradora || !dataInicio || !dataFim) {
        return res.status(400).json({ message: 'Número da Apólice, Seguradora, Data de Início e Fim são obrigatórios.' });
    }

    // Validação de vínculo: não pode ter os dois ao mesmo tempo
    if (equipamentoId && unidadeId) {
        return res.status(400).json({ message: 'Um seguro não pode ser vinculado a um equipamento e uma unidade ao mesmo tempo.' });
    }

    try {
        const dataPayload = {
            apoliceNumero,
            seguradora,
            dataInicio: new Date(dataInicio),
            dataFim: new Date(dataFim),
            cobertura,
            // 'conect' só será adicionado se o ID existir, caso contrário será undefined e ignorado pelo Prisma
            ...(equipamentoId && { equipamento: { connect: { id: equipamentoId } } }),
            ...(unidadeId && { unidade: { connect: { id: unidadeId } } }),
            ...outrosDados // Para outros campos que podem ser enviados
        };

        const novoSeguro = await prisma.seguro.create({
            data: dataPayload
        });

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'CRIAÇÃO',
            entidade: 'Seguro',
            entidadeId: novoSeguro.id,
            detalhes: `Apólice de seguro nº ${novoSeguro.apoliceNumero} foi criada.`
        });

        res.status(201).json(novoSeguro);
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: 'Já existe uma apólice com este número.' });
        // Captura erros de relação não encontrada para equipamento OU unidade
        if (error.code === 'P2025') return res.status(404).json({ message: 'Equipamento ou Unidade associado(a) não encontrado(a).' });
        console.error('Erro ao criar seguro:', error); // Log mais detalhado
        res.status(500).json({ message: 'Erro ao criar seguro.', error: error.message });
    }
});

// ROTA: PUT /api/seguros/:id
// FINALIDADE: Atualizar uma apólice de seguro.
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { equipamentoId, unidadeId, ...dataToUpdate } = req.body;

    if (dataToUpdate.dataInicio) dataToUpdate.dataInicio = new Date(dataToUpdate.dataInicio);
    if (dataToUpdate.dataFim) dataToUpdate.dataFim = new Date(dataToUpdate.dataFim);

    // Validação de vínculo: não pode ter os dois ao mesmo tempo
    if (equipamentoId && unidadeId) {
        return res.status(400).json({ message: 'Um seguro não pode ser vinculado a um equipamento e uma unidade ao mesmo tempo.' });
    }

    try {
        const payloadDeAtualizacao = { ...dataToUpdate };
        
        // Lógica para conectar, desconectar ou manter o vínculo com equipamento/unidade
        // Se equipamentoId for fornecido, conecta. Se for null/undefined, desconecta.
        if (equipamentoId !== undefined) { // Verifica explicitamente se a propriedade foi enviada
            payloadDeAtualizacao.equipamento = equipamentoId ? { connect: { id: equipamentoId } } : { disconnect: true };
        }
        if (unidadeId !== undefined) { // Verifica explicitamente se a propriedade foi enviada
            payloadDeAtualizacao.unidade = unidadeId ? { connect: { id: unidadeId } } : { disconnect: true };
        }

        const seguroAtualizado = await prisma.seguro.update({
            where: { id },
            data: payloadDeAtualizacao
        });

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'EDIÇÃO',
            entidade: 'Seguro',
            entidadeId: id,
            detalhes: `Apólice de seguro nº ${seguroAtualizado.apoliceNumero} foi atualizada.`
        });

        res.json(seguroAtualizado);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Seguro, Equipamento ou Unidade associado(a) não encontrado(a).' });
        console.error('Erro ao atualizar seguro:', error); // Log mais detalhado
        res.status(500).json({ message: 'Erro ao atualizar seguro.', error: error.message });
    }
});

// ROTA: DELETE /api/seguros/:id
// FINALIDADE: Excluir uma apólice de seguro.
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const seguroParaExcluir = await prisma.seguro.findUnique({
            where: { id },
            include: { anexos: true }
        });

        if (!seguroParaExcluir) {
            return res.status(404).json({ message: 'Seguro não encontrado.' });
        }

        // Exclui os arquivos físicos associados
        (seguroParaExcluir.anexos || []).forEach(anexo => {
            if (anexo.path && fs.existsSync(anexo.path)) fs.unlinkSync(anexo.path);
        });

        await prisma.seguro.delete({ where: { id } });

        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'EXCLUSÃO',
            entidade: 'Seguro',
            entidadeId: id,
            detalhes: `Apólice de seguro nº ${seguroParaExcluir.apoliceNumero} foi excluída.`
        });

        res.status(200).json({ message: 'Seguro e seus anexos foram excluídos com sucesso.' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Seguro não encontrado.' });
        console.error('Erro ao excluir seguro:', error);
        res.status(500).json({ message: 'Erro ao excluir seguro.', error: error.message });
    }
});

// --- ROTAS DE ANEXOS --- (padrão já conhecido)

// ROTA: POST /api/seguros/:id/anexos
router.post('/:id/anexos', upload.array('apolices'), async (req, res) => {
    const { id: seguroId } = req.params;
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

    try {
        const anexosData = req.files.map(file => ({
            seguroId,
            nomeOriginal: file.originalname,
            path: file.path,
            tipoMime: file.mimetype,
        }));
        await prisma.anexo.createMany({ data: anexosData });
        const seguroAtualizado = await prisma.seguro.findUnique({
            where: { id: seguroId },
            include: { anexos: true }
        });
        res.status(201).json(seguroAtualizado);
    } catch (error) {
        console.error('Erro ao salvar anexos de seguro:', error);
        res.status(500).json({ message: 'Erro ao salvar anexos de seguro.', error: error.message });
    }
});

// ROTA: DELETE /api/seguros/:id/anexos/:anexoId
router.delete('/:id/anexos/:anexoId', async (req, res) => {
    const { anexoId } = req.params;
    try {
        const anexo = await prisma.anexo.findUnique({ where: { id: anexoId } });
        if (anexo && anexo.path && fs.existsSync(anexo.path)) {
            fs.unlinkSync(anexo.path);
        }
        await prisma.anexo.delete({ where: { id: anexoId } });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Anexo de seguro não encontrado.' });
        console.error('Erro ao excluir anexo de seguro:', error);
        res.status(500).json({ message: 'Erro ao excluir anexo de seguro.', error: error.message });
    }
});

// Exporta o router
export default router;