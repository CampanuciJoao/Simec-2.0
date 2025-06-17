// Ficheiro: routes/alertasRoutes.js
// VERSÃO 100% COMPLETA E ATUALIZADA PARA ALERTAS INDIVIDUAIS POR USUÁRIO

import express from 'express';
import prisma from '../services/prismaService.js';
// Importamos o middleware 'proteger' para garantir que req.usuario esteja disponível.
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplica o middleware de proteção a todas as rotas de alertas,
// garantindo que req.usuario.id esteja disponível.
router.use(proteger);

// ROTA: GET /api/alertas
// FINALIDADE: Retorna os alertas existentes no banco, com o status 'Visto'/'NaoVisto'
//             calculado individualmente para o usuário logado.
router.get('/', async (req, res) => {
    // O ID do usuário logado é essencial para saber quais alertas ele já viu.
    const userId = req.usuario.id;

    try {
        // Busca todos os alertas e, para cada um, tenta incluir o registro
        // de visualização específico para o usuário logado.
        const alertas = await prisma.alerta.findMany({
            include: {
                // Tenta carregar o registro em AlertaLidoPorUsuario para este alerta e este usuário.
                lidoPorUsuarios: {
                    where: {
                        usuarioId: userId
                    },
                    select: { // Seleciona apenas o campo 'visto'
                        visto: true
                    }
                }
            },
            orderBy: {
                data: 'desc' // Alertas mais recentes primeiro
            }
        });

        // Mapeia os alertas retornados para adicionar a propriedade 'status'
        // baseada na visualização do usuário atual.
        const alertasFormatados = alertas.map(alerta => ({
            ...alerta,
            // Se 'lidoPorUsuarios' contém um registro para este usuário E 'visto' é true,
            // então o status para o frontend é 'Visto'. Caso contrário, é 'NaoVisto'.
            status: alerta.lidoPorUsuarios.length > 0 && alerta.lidoPorUsuarios[0].visto ? 'Visto' : 'NaoVisto'
        }));

        res.json(alertasFormatados);
    } catch (error) {
        console.error("Erro ao buscar alertas por usuário:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar alertas.", error: error.message });
    }
});

// ROTA: PUT /api/alertas/:id/status
// FINALIDADE: Lida com a atualização do status de visualização ('Visto'/'NaoVisto')
//             de um alerta ESPECÍFICO para o usuário logado.
router.put('/:id/status', async (req, res) => {
    const { id: alertaId } = req.params;
    const { status: newStatus } = req.body; // Recebe 'Visto' ou 'NaoVisto'
    const userId = req.usuario.id; // ID do usuário que está marcando o alerta

    // Validação do status recebido.
    if (!newStatus || (newStatus !== 'Visto' && newStatus !== 'NaoVisto')) {
        return res.status(400).json({ message: "Status inválido. Deve ser 'Visto' ou 'NaoVisto'." });
    }

    // Converte o status do frontend para um booleano para o campo 'visto' no banco.
    const vistoBoolean = newStatus === 'Visto';

    try {
        // Usa 'upsert' para criar ou atualizar o registro em AlertaLidoPorUsuario.
        // - Se o usuário já visualizou este alerta antes, atualiza o registro existente.
        // - Se é a primeira vez que o usuário interage com este alerta, cria um novo registro.
        const alertaLidoAtualizado = await prisma.alertaLidoPorUsuario.upsert({
            where: {
                // A chave única composta é 'alertaId_usuarioId'
                alertaId_usuarioId: {
                    alertaId: alertaId,
                    usuarioId: userId
                }
            },
            update: {
                visto: vistoBoolean,
                dataVisto: vistoBoolean ? new Date() : null // Atualiza o timestamp se for marcado como visto
            },
            create: {
                alertaId: alertaId,
                usuarioId: userId,
                visto: vistoBoolean,
                dataVisto: vistoBoolean ? new Date() : null
            }
        });

        // Opcional: Para retornar o alerta completo com o status atualizado para o frontend,
        // é preciso buscá-lo novamente e formatar.
        const alertaGlobal = await prisma.alerta.findUnique({
            where: { id: alertaId },
            include: {
                lidoPorUsuarios: {
                    where: {
                        usuarioId: userId
                    }
                }
            }
        });

        // Formata o alerta para o frontend, adicionando a propriedade 'status' calculada.
        const formattedAlertaParaResposta = {
            ...alertaGlobal,
            status: alertaGlobal.lidoPorUsuarios.length > 0 && alertaGlobal.lidoPorUsuarios[0].visto ? 'Visto' : 'NaoVisto'
        };

        res.json(formattedAlertaParaResposta);

    } catch (error) {
        // Erro 'P2025' pode ocorrer se o 'alertaId' ou 'usuarioId' não existirem,
        // embora o middleware de autenticação e a geração de alertas evitem isso.
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Alerta ou usuário não encontrado(a).' });
        }
        console.error("Erro ao atualizar status do alerta por usuário:", error);
        res.status(500).json({ message: "Erro interno do servidor ao atualizar status do alerta.", error: error.message });
    }
});

export default router;
