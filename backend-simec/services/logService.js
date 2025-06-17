// Ficheiro: services/logService.js
// VERSÃO COMPLETA E ATUALIZADA PARA PRISMA

import prisma from './prismaService.js';

/**
 * Registra um evento de auditoria no banco de dados.
 * @param {object} dadosLog - As informações do log.
 * @param {string} dadosLog.usuarioId - ID do usuário que realizou a ação.
 * @param {string} dadosLog.acao - A ação realizada (ex: 'CRIAÇÃO', 'EDIÇÃO').
 * @param {string} dadosLog.entidade - A entidade afetada (ex: 'Equipamento', 'Contrato').
 * @param {string} dadosLog.entidadeId - O ID da entidade afetada.
 * @param {string} dadosLog.detalhes - A descrição do log.
 */
export async function registrarLog(dadosLog) {
  try {
    const { usuarioId, acao, entidade, entidadeId, detalhes } = dadosLog;
    
    // Validação para garantir que dados essenciais não estão faltando
    if (!usuarioId || !acao || !entidade || !entidadeId || !detalhes) {
        console.error('Falha ao registrar log: Dados obrigatórios faltando.', dadosLog);
        return;
    }

    // Cria o registro na tabela 'LogAuditoria'
    // Note que o campo da relação no schema é 'autorId', então mapeamos 'usuarioId' para ele.
    await prisma.logAuditoria.create({
      data: {
        acao,
        entidade,
        entidadeId,
        detalhes,
        autorId: usuarioId, 
      },
    });

  } catch (error) {
    console.error('Falha ao registrar log de auditoria no Prisma:', error);
    // Em um sistema real, você poderia enviar este erro para um serviço de monitoramento.
  }
}