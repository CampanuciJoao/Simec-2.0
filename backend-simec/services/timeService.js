// services/timeService.js

// Altere para 'false' quando o sistema estiver em produção
const IS_PRODUCTION_MODE = true;

// A data mockada para testes DEVE estar no formato ISO 8601 UTC (com 'Z' no final).
// Usando seu exemplo de UTC-4: 09:36 da manhã no seu fuso é 13:36 em UTC.
const MOCK_DATE_UTC = '2025-06-06T13:36:00.000Z';

/**
 * Retorna um objeto Date que representa o "agora" do sistema.
 * Em modo de produção, retorna a data/hora atual do servidor (que deve estar em UTC).
 * Em modo de desenvolvimento, retorna uma data mockada para consistência nos testes.
 * O valor retornado é sempre um objeto Date, para ser formatado depois.
 */
export function getAgora() {
  if (IS_PRODUCTION_MODE) {
    return new Date();
  }
  return new Date(MOCK_DATE_UTC);
}