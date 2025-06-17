// Ficheiro: simec/backend-simec/routes/unidadesRoutes.js
// VERSÃO FINAL, COMPLETA E CORRIGIDA - COM ENDEREÇO NORMALIZADO

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../services/prismaService.js';
import { registrarLog } from '../services/logService.js';

const router = express.Router();

// Configuração do Multer para o armazenamento de anexos de unidades.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/unidades';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const nomeUnico = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, nomeUnico);
    }
});
const upload = multer({ storage: storage });


// --- ROTAS DE UNIDADES ---

// ROTA: GET /api/unidades - Listar todas as unidades
router.get('/', async (req, res) => {
    try {
        const unidades = await prisma.unidade.findMany({
            orderBy: { nomeSistema: 'asc' }
        });
        res.json(unidades);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar unidades.', error: error.message });
    }
});


// ROTA: GET /api/unidades/:id - Obter uma unidade com seus anexos
router.get('/:id', async (req, res) => {
    try {
        const unidade = await prisma.unidade.findUnique({
            where: { id: req.params.id },
            include: { anexos: true }
        });
        if (unidade) {
            res.json(unidade);
        } else {
            res.status(404).json({ message: 'Unidade não encontrada.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar unidade.', error: error.message });
    }
});


// ROTA: POST /api/unidades - Criar nova unidade
router.post('/', async (req, res) => {
    // Desestrutura todos os campos, incluindo os de endereço, diretamente do corpo da requisição.
    const { nomeSistema, nomeFantasia, cnpj, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;
    
    if (!nomeSistema) {
        return res.status(400).json({ message: 'Nome da Unidade é obrigatório.' });
    }

    try {
        // >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
        // O objeto `data` agora mapeia diretamente os campos de endereço para as colunas
        // correspondentes no modelo Unidade, em vez de aninhá-los em um objeto 'endereco'.
        const novaUnidade = await prisma.unidade.create({
            data: {
                nomeSistema,
                nomeFantasia,
                cnpj,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                cep
            }
        });
        
        await registrarLog({ 
            usuarioId: req.usuario.id,
            acao: 'CRIAÇÃO',
            entidade: 'Unidade',
            entidadeId: novaUnidade.id,
            detalhes: `Unidade "${novaUnidade.nomeSistema}" foi criada.`
        });

        res.status(201).json(novaUnidade);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Já existe uma unidade com este Nome ou CNPJ.' });
        }
        res.status(500).json({ message: 'Erro ao criar unidade.', error: error.message });
    }
});


// ROTA: PUT /api/unidades/:id - Atualizar unidade
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nomeSistema, nomeFantasia, cnpj, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;
    
    try {
        // >> CORREÇÃO PRINCIPAL APLICADA AQUI <<
        // A lógica de atualização segue o mesmo princípio da criação: os campos de endereço
        // são atualizados individualmente no registro da unidade.
        const unidadeAtualizada = await prisma.unidade.update({
            where: { id },
            data: {
                nomeSistema,
                nomeFantasia,
                cnpj,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                cep
            }
        });
        
        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'EDIÇÃO',
            entidade: 'Unidade',
            entidadeId: id,
            detalhes: `Unidade "${unidadeAtualizada.nomeSistema}" foi atualizada.`
        });

        res.json(unidadeAtualizada);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Unidade não encontrada.' });
        }
        res.status(500).json({ message: 'Erro ao atualizar unidade.', error: error.message });
    }
});


// ROTA: DELETE /api/unidades/:id - Excluir unidade
router.delete('/:id', async (req, res) => {
    // ... (o restante do código de delete e anexos permanece o mesmo e já está correto) ...
    const { id } = req.params;
    try {
        const unidadeParaExcluir = await prisma.unidade.findUnique({
            where: { id },
            include: { anexos: true },
        });

        if (!unidadeParaExcluir) {
            return res.status(404).json({ message: 'Unidade não encontrada.' });
        }
        
        await prisma.unidade.delete({ where: { id } });

        if (unidadeParaExcluir.anexos && unidadeParaExcluir.anexos.length > 0) {
            unidadeParaExcluir.anexos.forEach(anexo => {
                if(anexo.path && fs.existsSync(anexo.path)) {
                    fs.unlinkSync(anexo.path);
                }
            });
        }
        
        await registrarLog({
            usuarioId: req.usuario.id,
            acao: 'EXCLUSÃO',
            entidade: 'Unidade',
            entidadeId: id,
            detalhes: `Unidade "${unidadeParaExcluir.nomeSistema}" e seus anexos foram excluídos.`
        });

        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2003') {
            return res.status(409).json({ message: 'Não é possível excluir esta unidade pois ela está associada a um ou mais equipamentos.' });
        }
        res.status(500).json({ message: 'Erro ao excluir unidade.', error: error.message });
    }
});


// --- ROTAS DE ANEXOS ---

// ROTA: POST /api/unidades/:id/anexos - Upload de anexos
router.post('/:id/anexos', upload.array('anexos'), async (req, res) => {
    // ... (esta rota já estava correta e não precisa de alterações) ...
    const { id: unidadeId } = req.params;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    try {
        const anexosData = req.files.map(file => ({
            unidadeId: unidadeId,
            nomeOriginal: file.originalname,
            path: file.path,
            tipoMime: file.mimetype,
        }));
        await prisma.anexo.createMany({ data: anexosData });
        const unidadeAtualizada = await prisma.unidade.findUnique({
            where: { id: unidadeId },
            include: { anexos: true }
        });
        res.status(201).json(unidadeAtualizada);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar anexos.', error: error.message });
    }
});


// ROTA: DELETE /api/unidades/:id/anexos/:anexoId - Excluir anexo
router.delete('/:id/anexos/:anexoId', async (req, res) => {
    // ... (esta rota já estava correta e não precisa de alterações) ...
    const { anexoId } = req.params;
    try {
        const anexo = await prisma.anexo.findUnique({ where: { id: anexoId } });
        if (anexo && anexo.path && fs.existsSync(anexo.path)) {
            fs.unlinkSync(anexo.path);
        }
        await prisma.anexo.delete({ where: { id: anexoId } });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Anexo não encontrado.' });
        }
        res.status(500).json({ message: 'Erro ao excluir anexo.', error: error.message });
    }
});


// Exporta o router para ser usado no arquivo principal do servidor.
export default router;