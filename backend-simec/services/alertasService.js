// Ficheiro: simec/backend-simec/services/alertasService.js
// VERSÃO 6.2 (FINAL CORRIGIDO - Lógica de Alerta Único para Manutenção)
// Descrição: Serviço de alertas com lógica completa para o sistema e para notificações por e-mail.
//            A geração de alertas de manutenção foi refinada para evitar redundância.

import prisma from './prismaService.js';
import { enviarEmail } from './emailService.js';
import { addDays, isBefore, isAfter, differenceInDays, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ==========================================================================
// SEÇÃO DE MANUTENÇÕES
// (Lógica de alertas internos e automação de status)
// ==========================================================================

export async function atualizarStatusManutencoes() {
  const agora = new Date();

  // 1. Inicia manutenções 'Agendada' -> 'EmAndamento'
  const manutsParaIniciar = await prisma.manutencao.findMany({
    where: { status: 'Agendada', dataHoraAgendamentoInicio: { lte: agora } },
    select: { id: true, equipamentoId: true, numeroOS: true },
  });

  if (manutsParaIniciar.length > 0) {
    const idsManutencao = manutsParaIniciar.map(m => m.id);
    const idsEquipamento = manutsParaIniciar.map(m => m.equipamentoId);

    await prisma.$transaction(async (tx) => {
      await tx.equipamento.updateMany({ where: { id: { in: idsEquipamento } }, data: { status: 'EmManutencao' } });
      await tx.manutencao.updateMany({ where: { id: { in: idsManutencao } }, data: { status: 'EmAndamento' } });
      
      for (const manut of manutsParaIniciar) {
        await tx.alerta.create({
          data: {
            id: `manut-iniciada-${manut.id}`,
            titulo: `Manutenção Iniciada: OS ${manut.numeroOS}`,
            subtitulo: `A manutenção foi iniciada automaticamente.`,
            data: agora,
            prioridade: 'Media',
            tipo: 'Manutenção',
            link: `/manutencoes/detalhes/${manut.id}`
          }
        });
      }
    });
    console.log(`[STATUS AUTO] ${idsManutencao.length} manutenção(ões) iniciada(s).`);
  }

  // 2. Move 'EmAndamento' -> 'AguardandoConfirmacao'
  const manutsParaConfirmar = await prisma.manutencao.findMany({
    where: { status: 'EmAndamento', dataHoraAgendamentoFim: { lte: agora } }
  });

  for (const manut of manutsParaConfirmar) {
    await prisma.$transaction(async (tx) => {
      await tx.manutencao.update({ where: { id: manut.id }, data: { status: 'AguardandoConfirmacao' } });
      await tx.alerta.upsert({
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
    });
    console.log(`[STATUS AUTO] OS ${manut.numeroOS} movida para 'Aguardando Confirmação'.`);
  }
}

// ========================================================================
// >> INÍCIO DA SEÇÃO MODIFICADA <<
// ========================================================================

async function gerarAlertasDeProximidadeManutencao() {
  const agora = new Date();

  // Pontos de verificação para o INÍCIO da manutenção, ordenados do mais próximo ao mais distante
  const PONTOS_INICIO = [
    { limiar: 10, prioridade: 'Alta', label: '10min', texto: 'em 10 minutos' },
    { limiar: 60, prioridade: 'Media', label: '1h', texto: 'em 1 hora' },
    { limiar: 60 * 24, prioridade: 'Baixa', label: '24h', texto: 'em 24 horas' },
    { limiar: 60 * 24 * 7, prioridade: 'Baixa', label: '7d', texto: 'em 7 dias' },
  ];

  // Pontos de verificação para o FIM da manutenção
  const PONTOS_FIM = [
    { limiar: 10, prioridade: 'Alta', label: '10min', texto: 'em 10 minutos' },
    { limiar: 60, prioridade: 'Media', label: '1h', texto: 'em 1 hora' },
  ];

  const manutencoesProximas = await prisma.manutencao.findMany({
    where: {
      OR: [
        { status: 'Agendada', dataHoraAgendamentoInicio: { gt: agora } },
        { status: 'EmAndamento', dataHoraAgendamentoFim: { gt: agora } },
      ]
    },
    include: { equipamento: { select: { modelo: true, tag: true } } }
  });

  for (const manutencao of manutencoesProximas) {
    const tipoEvento = manutencao.status === 'Agendada' ? 'início' : 'fim';
    const dataAlvo = tipoEvento === 'início' ? manutencao.dataHoraAgendamentoInicio : manutencao.dataHoraAgendamentoFim;
    const pontosDeVerificacao = tipoEvento === 'início' ? PONTOS_INICIO : PONTOS_FIM;
    
    if (!dataAlvo) continue;

    const minutosRestantes = Math.round((dataAlvo.getTime() - agora.getTime()) / 60000);

    // Itera nos pontos de verificação (do mais próximo para o mais distante)
    for (const ponto of pontosDeVerificacao) {
      if (minutosRestantes > 0 && minutosRestantes <= ponto.limiar) {
        
        // Verifica se QUALQUER alerta de proximidade para este evento já foi criado
        const algumAlertaJaExiste = await prisma.alerta.findFirst({
            where: { id: { startsWith: `manut-prox-${tipoEvento}-${manutencao.id}-` } }
        });

        // Se nenhum alerta de proximidade para este evento foi criado ainda, criamos o nosso.
        if (!algumAlertaJaExiste) {
          const idAlerta = `manut-prox-${tipoEvento}-${manutencao.id}-${ponto.label}`;
          const titulo = `Manutenção ${tipoEvento === 'início' ? 'inicia' : 'termina'} ${ponto.texto}`;
          const subtitulo = `OS ${manutencao.numeroOS} - Equip: ${manutencao.equipamento.modelo} (${manutencao.equipamento.tag})`;
          
          await prisma.alerta.create({
            data: {
              id: idAlerta,
              titulo,
              subtitulo,
              data: dataAlvo,
              prioridade: ponto.prioridade,
              tipo: 'Manutenção',
              link: `/manutencoes/detalhes/${manutencao.id}`,
            },
          });
          console.log(`[ALERTA MANUTENÇÃO] Alerta mais relevante ('${ponto.label}') gerado para ${tipoEvento} da OS ${manutencao.numeroOS}.`);
        }
        
        // Paramos o loop pois já encontramos (ou criamos) o alerta mais relevante.
        break; 
      }
    }
  }
}

// ========================================================================
// >> FIM DA SEÇÃO MODIFICADA <<
// ========================================================================


// ==========================================================================
// SEÇÃO DE CONTRATOS E SEGUROS
// (Lógica de alertas internos E envio de e-mails)
// ==========================================================================

async function gerarAlertasVencimento(item, tipoEntidade) {
  const hoje = startOfDay(new Date());
  const dataDeVencimento = startOfDay(item.dataFim);

  if (isAfter(dataDeVencimento, hoje)) {
    const diasRestantes = differenceInDays(dataDeVencimento, hoje);
    const PONTOS_VERIFICACAO_DIAS = [
      { limiar: 30, prioridade: 'Baixa', label: '30d', texto: 'em 30 dias' },
      { limiar: 15, prioridade: 'Media', label: '15d', texto: 'em 15 dias' },
      { limiar: 7, prioridade: 'Alta', label: '7d', texto: 'em 7 dias' },
      { limiar: 1, prioridade: 'Alta', label: '1d', texto: 'amanhã' },
    ];
    for (const ponto of PONTOS_VERIFICACAO_DIAS) {
      if (diasRestantes > 0 && diasRestantes <= ponto.limiar) {
        const idAlerta = `${tipoEntidade.toLowerCase()}-vence-${item.id}-${ponto.label}`;
        if (!(await prisma.alerta.findUnique({ where: { id: idAlerta } }))) {
          const titulo = `${tipoEntidade} vence ${ponto.texto}`;
          const subtitulo = tipoEntidade === 'Contrato' ? `Nº ${item.numeroContrato}` : `Apólice Nº ${item.apoliceNumero}`;
          const link = `/${tipoEntidade.toLowerCase()}s/detalhes/${item.id}`;
          await prisma.alerta.create({ data: { id: idAlerta, titulo, subtitulo, data: item.dataFim, prioridade: ponto.prioridade, tipo: tipoEntidade, link } });
          console.log(`[ALERTA VENCIMENTO] Alerta '${ponto.label}' gerado para ${tipoEntidade} ${item.id}.`);
        }
        break;
      }
    }
  } else {
    const idAlerta = `${tipoEntidade.toLowerCase()}-vencido-${item.id}`;
    if (!(await prisma.alerta.findUnique({ where: { id: idAlerta } }))) {
      const titulo = `${tipoEntidade} Vencido`;
      const subtitulo = tipoEntidade === 'Contrato' ? `Nº ${item.numeroContrato}` : `Apólice Nº ${item.apoliceNumero}`;
      const link = `/${tipoEntidade.toLowerCase()}s/detalhes/${item.id}`;
      await prisma.alerta.create({ data: { id: idAlerta, titulo, subtitulo, data: item.dataFim, prioridade: 'Alta', tipo: tipoEntidade, link } });
      console.log(`[ALERTA VENCIDO] Alerta gerado para ${tipoEntidade} ${item.id}.`);
    }
  }
}

async function verificarVencimentoContratos() {
  const contratosAtivos = await prisma.contrato.findMany({ where: { status: 'Ativo' } });
  const hoje = startOfDay(new Date());

  for (const contrato of contratosAtivos) {
    await gerarAlertasVencimento(contrato, 'Contrato');
    
    // --- LÓGICA DE E-MAIL REINTEGRADA ---
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
              'Nº do Contrato': contrato.numeroContrato, 'Fornecedor': contrato.fornecedor || 'Não informado',
              'Vence em': format(contrato.dataFim, 'dd/MM/yyyy', { locale: ptBR }), 'Dias Restantes': diasRestantes,
            },
            textoBotao: 'Ver Detalhes do Contrato', linkBotao: `${process.env.FRONTEND_URL}/contratos/detalhes/${contrato.id}`,
          };
          await enviarEmail({ para: email.email, assunto: `[SIMEC] Alerta: Contrato ${contrato.numeroContrato} vence em ${diasRestantes} dia(s)`, dadosTemplate: dadosDoTemplate });
          await prisma.notificacaoEnviada.create({ data: { entidade: 'Contrato', entidadeId: contrato.id, emailNotificacaoId: email.id } });
        }
      }
    }
  }
}

async function verificarVencimentoSeguros() {
  const segurosAtivos = await prisma.seguro.findMany({ where: { status: 'Ativo' }, include: { equipamento: { select: { modelo: true, tag: true, unidade: { select: { nomeSistema: true } } } }, unidade: { select: { nomeSistema: true } } } });
  const hoje = startOfDay(new Date());

  for (const seguro of segurosAtivos) {
    await gerarAlertasVencimento(seguro, 'Seguro');

    // --- LÓGICA DE E-MAIL REINTEGRADA ---
    const emailsInscritos = await prisma.emailNotificacao.findMany({
      where: { ativo: true, recebeAlertasSeguro: true },
    });
    if (emailsInscritos.length === 0) continue;

    for (const email of emailsInscritos) {
      const diasDeAntecedencia = email.diasAntecedencia;
      const dataDeVencimento = startOfDay(seguro.dataFim);
      const dataInicioNotificacao = addDays(dataDeVencimento, -diasDeAntecedencia);

      if (isBefore(hoje, dataDeVencimento) && (hoje.getTime() >= dataInicioNotificacao.getTime())) {
        const notificacaoJaEnviada = await prisma.notificacaoEnviada.findFirst({
          where: { entidade: 'Seguro', entidadeId: seguro.id, emailNotificacaoId: email.id },
        });

        if (!notificacaoJaEnviada) {
          const diasRestantes = differenceInDays(dataDeVencimento, hoje);
          const detalhesEmail = { 'Nº da Apólice': seguro.apoliceNumero, 'Seguradora': seguro.seguradora, 'Vence em': format(seguro.dataFim, 'dd/MM/yyyy', { locale: ptBR }), 'Dias Restantes': diasRestantes };
          if (seguro.equipamento) { detalhesEmail['Equipamento'] = `${seguro.equipamento.modelo} (Tag: ${seguro.equipamento.tag})`; if (seguro.equipamento.unidade?.nomeSistema) { detalhesEmail['Unidade'] = seguro.equipamento.unidade.nomeSistema; } } else if (seguro.unidade) { detalhesEmail['Unidade'] = seguro.unidade.nomeSistema; }
          
          const dadosDoTemplate = {
            nomeDestinatario: email.nome || 'Usuário', tituloAlerta: 'Alerta de Vencimento de Seguro',
            mensagemPrincipal: `A seguinte apólice de seguro está próxima do vencimento e requer sua atenção.`,
            detalhes: detalhesEmail, textoBotao: 'Ver Detalhes do Seguro', linkBotao: `${process.env.FRONTEND_URL}/seguros/detalhes/${seguro.id}`,
          };
          await enviarEmail({ para: email.email, assunto: `[SIMEC] Alerta: Apólice ${seguro.apoliceNumero} vence em ${diasRestantes} dia(s)`, dadosTemplate: dadosDoTemplate });
          await prisma.notificacaoEnviada.create({ data: { entidade: 'Seguro', entidadeId: seguro.id, emailNotificacaoId: email.id } });
        }
      }
    }
  }
}

// ==========================================================================
// FUNÇÃO PRINCIPAL DE PROCESSAMENTO (EXPORTADA)
// ==========================================================================

export async function processarAlertasEEnviarNotificacoes() {
  console.log(`[Serviço de Alertas] Iniciando verificação completa...`);
  try {
    await gerarAlertasDeProximidadeManutencao();
    await verificarVencimentoContratos();
    await verificarVencimentoSeguros();
  } catch (error) {
    console.error('[ERRO GERAL no Serviço de Alertas]:', error);
  }
}