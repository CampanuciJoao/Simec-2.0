// src/utils/timeUtils.js

/**
 * Formata uma data ISO (UTC) para o formato de data pt-BR (dd/mm/aaaa).
 * Usa timeZone: 'UTC' para garantir que a data não mude por causa do fuso.
 * @param {string} dataISO - A string de data no formato ISO 8601 (ex: "2025-01-01T02:00:00.000Z").
 * @returns {string} A data formatada ou 'N/A'.
 */
export const formatarData = (dataISO) => {
  if (!dataISO) return 'N/A';
  try {
    const data = new Date(dataISO);
    // IMPORTANTE: Adicionar timeZone: 'UTC' aqui previne que uma data como
    // 1 de Jan, 2h da manhã (UTC) vire 31 de Dez para um usuário no Brasil (UTC-3).
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch (e) { return 'Data Inválida'; }
};

/**
 * Formata uma data e hora ISO (UTC) para o formato pt-BR (dd/mm/aaaa, HH:mm).
 * O navegador converte automaticamente para o fuso horário LOCAL do usuário.
 * @param {string} dataISO - A string de data/hora no formato ISO 8601.
 * @returns {string} A data e hora formatada no fuso do usuário ou 'N/A'.
 */
export const formatarDataHora = (dataISO) => {
  if (!dataISO) return 'N/A';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch (e) { return 'Data Inválida'; }
};

/**
 * Formata o horário de início e fim.
 * @param {string} horaInicio - Ex: "08:00"
 * @param {string} horaFim - Ex: "17:00"
 * @returns {string} O intervalo de horário formatado.
 */
export const formatarHorario = (horaInicio, horaFim) => {
    if (!horaInicio) return 'N/A';
    const inicio = String(horaInicio).slice(0, 5);
    const fim = horaFim ? String(horaFim).slice(0, 5) : null;
    if (!fim || inicio === fim) return inicio;
    return `${inicio} - ${fim}`;
};