// Ficheiro: backend-simec/services/emailService.js
// Versão: 2.0 (Sênior - Com template HTML profissional)
// Descrição: Serviço para envio de e-mails, agora com um gerador de template HTML.

import nodemailer from 'nodemailer';

// Cria o "transportador" de e-mail usando as variáveis de ambiente.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true para porta 465, false para outras
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Gera o corpo HTML de um e-mail de alerta com um design profissional.
 * @param {object} dados - Os dados para preencher o template.
 * @param {string} dados.nomeDestinatario - O nome da pessoa ou grupo que recebe o e-mail.
 * @param {string} dados.tituloAlerta - O título principal do alerta (ex: "Contrato Próximo do Vencimento").
 * @param {string} dados.mensagemPrincipal - Uma frase de contexto para o alerta.
 * @param {object} dados.detalhes - Um objeto com os detalhes chave-valor para exibir na tabela.
 * @param {string} dados.textoBotao - O texto para o botão de ação (ex: "Ver Contrato").
 * @param {string} dados.linkBotao - A URL para a qual o botão irá redirecionar.
 * @returns {string} O HTML completo do e-mail.
 */
function gerarTemplateDeEmail({ nomeDestinatario, tituloAlerta, mensagemPrincipal, detalhes, textoBotao, linkBotao }) {
  const anoAtual = new Date().getFullYear();
  
  // Converte o objeto de detalhes em linhas de tabela HTML
  const detalhesHtml = Object.entries(detalhes)
    .map(([chave, valor]) => `
      <tr>
        <td style="padding: 5px 10px; font-weight: bold; color: #555555; text-align: right; width: 40%;">${chave}:</td>
        <td style="padding: 5px 10px; color: #333333; text-align: left;">${valor}</td>
      </tr>
    `).join('');

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF--8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Estilos básicos para garantir consistência */
      body { margin: 0; padding: 0; background-color: #f4f4f4; }
      table { border-spacing: 0; }
      td { padding: 0; }
      img { border: 0; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
    <center style="width: 100%; table-layout: fixed; background-color: #f4f4f4; padding: 40px 0;">
      <table style="background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border: 1px solid #e0e0e0; border-radius: 8px;">
        
        <!-- Cabeçalho / Logo -->
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #2c3e50; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px; color: #ffffff;">SIMEC</h1>
          </td>
        </tr>

        <!-- Conteúdo Principal -->
        <tr>
          <td style="padding: 30px 40px;">
            <h2 style="margin-top: 0; margin-bottom: 20px; font-size: 22px; color: #333333;">${tituloAlerta}</h2>
            <p style="margin-bottom: 25px; font-size: 16px; line-height: 1.5; color: #555555;">
              Olá ${nomeDestinatario},
            </p>
            <p style="margin-bottom: 25px; font-size: 16px; line-height: 1.5; color: #555555;">
              ${mensagemPrincipal}
            </p>

            <!-- Tabela de Detalhes -->
            <table style="width: 100%; border-collapse: collapse; background-color: #f9f9f9; border: 1px solid #dddddd; margin-bottom: 30px;">
              ${detalhesHtml}
            </table>

            <!-- Botão de Ação (CTA) -->
            <table style="width: 100%; border-spacing: 0;">
              <tr>
                <td style="text-align: center;">
                  <a href="${linkBotao}" target="_blank" style="display: inline-block; background-color: #3498db; color: #ffffff; padding: 12px 25px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 5px;">
                    ${textoBotao}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="padding: 20px 40px; text-align: center; background-color: #f4f4f4; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; font-size: 12px; color: #888888;">
              Você está recebendo este e-mail porque está inscrito para receber alertas do sistema SIMEC.
            </p>
            <p style="margin: 5px 0 0; font-size: 12px; color: #888888;">
              © ${anoAtual} Sistema SIMEC. Todos os direitos reservados.
            </p>
          </td>
        </tr>

      </table>
    </center>
  </body>
  </html>
  `;
}

/**
 * Envia um e-mail.
 * @param {object} mailOptions - As opções do e-mail.
 * @param {string} mailOptions.para - O destinatário do e-mail.
 * @param {string} mailOptions.assunto - O assunto do e-mail.
 * @param {object} mailOptions.dadosTemplate - Objeto com os dados para o template HTML.
 */
export async function enviarEmail({ para, assunto, dadosTemplate }) {
  // Gera o HTML a partir dos dados fornecidos
  const html = gerarTemplateDeEmail(dadosTemplate);

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_NAME || 'Alertas SIMEC'}" <${process.env.EMAIL_FROM}>`,
      to: para,
      subject: assunto,
      html: html, // Usa o template gerado
    });
    console.log(`E-mail enviado com sucesso para ${para}: ${info.messageId}`);
  } catch (error) {
    console.error(`Falha ao enviar e-mail para ${para}:`, error);
  }
}