// Ficheiro: simec/backend-simec/services/alertasService.js
// Versão: 4.0 (Sênior - LÓGICA DE ALERTAS UNIFICADA E SEM DUPLICIDADE)
// Descrição: Serviço de alertas com a lógica de finalização de manutenção
//            centralizada em um único ponto para evitar alertas duplicados.

import prisma from './prismaService.js';
import { enviarEmail } from './emailService.js';
import { addDays, isBefore, differenceInDays, differenceInMinutes, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * @function atualizarStatusManutencoes
 * @description Unifica a automação de status. Chamada a cada minuto.
 */
export async function atualizarStatusManutencoes() {
  const agora = new Date();

  // 1. Inicia manutenções 'Agendada' -> 'EmAndamento'
  const resInicio = await prisma.manutencao.updateMany({
    where: { status: 'Agendada', dataHoraAgendamentoInicio: { lte: agora } },
    data: { status: 'EmAndamento' },
  });
  if (resInicio.count > 0) {
    console.log(`[STATUS AUTO] ${resInicio.count} manutenção(ões) iniciada(s).`);
  }

  // 2. Move 'EmAndamento' -> 'AguardandoConfirmacao' e gera o alerta de confirmação
  const manutsParaConfirmar = await prisma.manutencao.findMany({
      where: {
          status: 'EmAndamento',
          dataHoraAgendamentoFim: { lte: agora }
      }
  });

  for (const manut of manutsParaConfirmar) {
      await prisma.manutencao.update({
          where: { id: manut.id },
          data: { status: 'AguardandoConfirmacao' }
      });
      // Este é o ÚNICO alerta gerado ao final de uma manutenção.
      await prisma.alerta.upsert({
          where: { id: `manut-confirm-${manut.id}` },
          update: { titulo: 'Confirmação de Manutenção Pendente' },
          create: {
              id: `manut-confirm-${manut.id}`,
              titulo: 'Confirmação de Manutenção Pendente',
              subtitulo: `OS ${manut.numeroOS} finalizou. Confirme o status do equipamento.`,
              data: agora,
              prioridade: 'Alta',
              tipo: 'Manutenção',
              link: `/manutencoes/detalhes/${manut.id}`
          }
      });
      console.log(`[STATUS AUTO] OS ${manut.numeroOS} movida para 'Aguardando Confirmação'.`);
  }
}

/**
 * @function gerarAlertasDeProximidadeManutencao
 * @description Gera alertas APENAS para eventos futuros.
 */
async function gerarAlertasDeProximidadeManutencao() {
  const agora = new Date();
  const PONTOS_VERIFICACAO = [
    { limiar: 60, tipo: 'inicio', prioridade: 'Baixa', label: 'inicio-60min' },
    { limiar: 10, tipo: 'inicio', prioridade: 'Media', label: 'inicio-10min' },
    { limiar: 10, tipo: 'fim', prioridade: 'Alta', label: 'fim-10min' },
  ];

  const manutencoesProximas = await prisma.manutencao.findMany({
    where: {
      OR: [
        { status: 'Agendada', dataHoraAgendamentoInicio: { gt: agora } },
        { status: 'EmAndamento', dataHoraAgendamentoFim: { gt: agora } },
      ]
    },
    include: { equipamento: { select: { modelo: true, tag: true, unidade: { select: { nomeSistema: true } } } } }
  });

  for (const manutencao of manutencoesProximas) {
    const tipoEvento = manutencao.status === 'Agendada' ? 'inicio' : 'fim';
    const dataAlvo = tipoEvento === 'inicio' ? manutencao.dataHoraAgendamentoInicio : manutencao.dataHoraAgendamentoFim;
    if (!dataAlvo) continue;

    const minutosRestantes = differenceInMinutes(dataAlvo, agora);

    // Itera nos pontos de verificação para criar o alerta mais iminente
    for (const ponto of PONTOS_VERIFICACAO) {
      if (ponto.tipo === tipoEvento && minutosRestantes > 0 && minutosRestantes <= ponto.limiar) {
        const idAlertaProx = `manut-prox-${manutencao.id}-${ponto.label}`;
        const alertaExistente = await prisma.alerta.findUnique({ where: { id: idAlertaProx } });

        if (!alertaExistente) {
            const evento = ponto.tipo === 'inicio' ? 'inicia' : 'termina';
            const titulo = `Manutenção ${evento} em ~${minutosRestantes} min.`;
            const subtitulo = `Equip: ${manutencao.equipamento.modelo} (${manutencao.equipamento.tag}) da Unidade ${manutencao.equipamento.unidade.nomeSistema}`;
            
            await prisma.alerta.create({
              data: {
                id: idAlertaProx,
                titulo: titulo,
                subtitulo: subtitulo,
                data: dataAlvo,
                prioridade: ponto.prioridade,
                tipo: 'Manutenção',
                link: `/manutencoes/detalhes/${manutencao.id}`,
              },
            });
            console.log(`[ALERTA PROXIMIDADE] Alerta para ${idAlertaProx} gerado.`);
            break; // Cria apenas o alerta mais próximo e para.
        }
      }
    }
  }
}

export async function processarAlertasEEnviarNotificacoes() {
  console.log(`[Serviço de Alertas] Iniciando verificação de notificações de proximidade... [${new Date().toLocaleTimeString('pt-BR')}]`);
  try {
    await gerarAlertasDeProximidadeManutencao();
    await verificarVencimentoContratos();
    await verificarVencimentoSeguros();
  } catch (error) {
    console.error('[ERRO GERAL no Serviço de Alertas]:', error);
  }
}

// O restante do ficheiro (verificarVencimentoContratos, verificarVencimentoSeguros) permanece igual.
// ... (código existente para contratos e seguros)
async function verificarVencimentoContratos() {
  const contratosAtivos = await prisma.contrato.findMany({ where: { status: 'Ativo' } });
  const hoje = startOfDay(new Date());

  for (const contrato of contratosAtivos) {
    const maxDiasAntecedencia = 30; 
    const dataDeVencimento = startOfDay(contrato.dataFim);
    const dataLimiteAlertaInterno = addDays(dataDeVencimento, -maxDiasAntecedencia);

    if (isBefore(hoje, dataDeVencimento) && (hoje.getTime() >= dataLimiteAlertaInterno.getTime())) {
      const diasRestantes = differenceInDays(dataDeVencimento, hoje);
      const tituloAlerta = `Contrato vence em ${diasRestantes} dia(s)`;
      const subtituloAlerta = `Nº ${contrato.numeroContrato} - ${contrato.fornecedor || ''}`;
      
      await prisma.alerta.upsert({
        where: { id: `contrato-${contrato.id}` },
        update: { titulo: tituloAlerta, data: contrato.dataFim, subtitulo: subtituloAlerta }, 
        create: {
          id: `contrato-${contrato.id}`,
          titulo: tituloAlerta,
          subtitulo: subtituloAlerta,
          data: contrato.dataFim,
          prioridade: 'Alta',
          tipo: 'Contrato',
          link: `/contratos/detalhes/${contrato.id}`,
        },
      });
    }

    const emailsInscritos = await prisma.emailNotificacao.findMany({
      where: { ativo: true, recebeAlertasContrato: true },
    });

    if (emailsInscritos.length === 0) continue;

    for (const email of emailsInscritos) {
      const diasDeAntecedencia = email.diasAntecedencia;
      const dataDeVencimento = startOfDay(contrato.dataFim);
      const dataInicioNotificacao = addDays(dataDeVencimento, -diasDeAntecedencia);

      if (isBefore(hoje, dataDeVencimento) && (hoje.getTime() >= dataInicioNotificacao.getTime())) {
        const notificacaoJaEnviada = await prisma.notificacaoEnviada.findFirst({
          where: { entidade: 'Contrato', entidadeId: contrato.id, emailNotificacaoId: email.id },
        });

        if (!notificacaoJaEnviada) {
          const diasRestantes = differenceInDays(dataDeVencimento, hoje);
          const dadosDoTemplate = {
            nomeDestinatario: email.nome || 'Usuário',
            tituloAlerta: 'Alerta de Vencimento de Contrato',
            mensagemPrincipal: `O seguinte contrato está se aproximando da data de vencimento e requer sua atenção.`,
            detalhes: {
              'Nº do Contrato': contrato.numeroContrato,
              'Fornecedor': contrato.fornecedor || 'Não informado',
              'Vence em': format(contrato.dataFim, 'dd/MM/yyyy', { locale: ptBR }),
              'Dias Restantes': diasRestantes,
            },
            textoBotao: 'Ver Detalhes do Contrato',
            linkBotao: `${process.env.FRONTEND_URL}/contratos/detalhes/${contrato.id}`,
          };

          await enviarEmail({
            para: email.email,
            assunto: `[SIMEC] Alerta: Contrato ${contrato.numeroContrato} vence em ${diasRestantes} dia(s)`,
            dadosTemplate: dadosDoTemplate,
          });

          await prisma.notificacaoEnviada.create({
            data: {
              entidade: 'Contrato',
              entidadeId: contrato.id,
              emailNotificacaoId: email.id,
            },
          });
        }
      }
    }
  }
}

async function verificarVencimentoSeguros() {
  const segurosAtivos = await prisma.seguro.findMany({
    where: {
      status: 'Ativo',
      dataFim: { gte: new Date() }
    },
    include: {
      equipamento: { select: { modelo: true, tag: true, unidade: { select: { nomeSistema: true } } } },
      unidade: { select: { nomeSistema: true } }
    }
  });

  if (segurosAtivos.length === 0) return;
  
  const hoje = startOfDay(new Date());

  for (const seguro of segurosAtivos) {
    const maxDiasAntecedencia = 30;
    const dataDeVencimento = startOfDay(seguro.dataFim);
    const dataLimiteAlertaInterno = addDays(dataDeVencimento, -maxDiasAntecedencia);

    if (isBefore(hoje, dataDeVencimento) && (hoje.getTime() >= dataLimiteAlertaInterno.getTime())) {
      const diasRestantes = differenceInDays(dataDeVencimento, hoje);
      const tituloAlerta = `Seguro vence em ${diasRestantes} dia(s)`;
      
      let subtituloAlerta = '';
      const detalhesEmail = {
          'Nº da Apólice': seguro.apoliceNumero,
          'Seguradora': seguro.seguradora,
          'Vence em': format(seguro.dataFim, 'dd/MM/yyyy', { locale: ptBR }),
          'Dias Restantes': diasRestantes,
      };

      if (seguro.equipamento) {
          subtituloAlerta = `Apólice Nº ${seguro.apoliceNumero} - Equipamento: ${seguro.equipamento.modelo} (Tag: ${seguro.equipamento.tag})`;
          detalhesEmail['Equipamento'] = `${seguro.equipamento.modelo} (Tag: ${seguro.equipamento.tag})`;
          if (seguro.equipamento.unidade?.nomeSistema) {
            detalhesEmail['Unidade do Equipamento'] = seguro.equipamento.unidade.nomeSistema;
          }
      } else if (seguro.unidade) {
          subtituloAlerta = `Apólice Nº ${seguro.apoliceNumero} - Unidade: ${seguro.unidade.nomeSistema}`;
          detalhesEmail['Unidade'] = seguro.unidade.nomeSistema;
      } else {
          subtituloAlerta = `Apólice Nº ${seguro.apoliceNumero}`;
      }

      await prisma.alerta.upsert({
        where: { id: `seguro-${seguro.id}` },
        update: { titulo: tituloAlerta, data: seguro.dataFim, subtitulo: subtituloAlerta },
        create: {
          id: `seguro-${seguro.id}`,
          titulo: tituloAlerta,
          subtitulo: subtituloAlerta,
          data: seguro.dataFim,
          prioridade: 'Media',
          tipo: 'Seguro',
          link: `/seguros/detalhes/${seguro.id}`,
        },
      });
    }

    const emailsInscritosParaSeguro = await prisma.emailNotificacao.findMany({
      where: { ativo: true, recebeAlertasSeguro: true },
    });

    if (emailsInscritosParaSeguro.length === 0) continue;

    for (const email of emailsInscritosParaSeguro) {
      const diasDeAntecedencia = email.diasAntecedencia;
      const dataDeVencimento = startOfDay(seguro.dataFim);
      const dataInicioNotificacao = addDays(dataDeVencimento, -diasDeAntecedencia);

      if (isBefore(hoje, dataDeVencimento) && (hoje.getTime() >= dataInicioNotificacao.getTime())) {
        const notificacaoJaEnviada = await prisma.notificacaoEnviada.findFirst({
          where: { entidade: 'Seguro', entidadeId: seguro.id, emailNotificacaoId: email.id },
        });

        if (!notificacaoJaEnviada) {
          const diasRestantes = differenceInDays(dataDeVencimento, hoje);
          const dadosDoTemplate = {
            nomeDestinatario: email.nome || 'Usuário',
            tituloAlerta: 'Alerta de Vencimento de Seguro',
            mensagemPrincipal: `A seguinte apólice de seguro está próxima do vencimento e requer sua atenção.`,
            detalhes: detalhesEmail,
            textoBotao: 'Ver Detalhes do Seguro',
            linkBotao: `${process.env.FRONTEND_URL}/seguros/detalhes/${seguro.id}`,
          };

          await enviarEmail({
            para: email.email,
            assunto: `[SIMEC] Alerta: Apólice ${seguro.apoliceNumero} vence em ${diasRestantes} dia(s)`,
            dadosTemplate: dadosDoTemplate,
          });

          await prisma.notificacaoEnviada.create({
            data: {
              entidade: 'Seguro',
              entidadeId: seguro.id,
              emailNotificacaoId: email.id,
            },
          });
        }
      }
    }
  }
}